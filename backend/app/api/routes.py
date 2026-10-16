
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Analysis, Detection
from app.schemas import AnalysisResponse
from app.schemas.analysis import DetectionResponse, DetectionUpdateRequest
from app.services.ai_service import run_inference
from app.services.annotation_service import create_annotated_image
from app.services.image_service import validate_and_save_image


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Images"])

UPLOAD_DIR = Path("uploads")
#temp chk
print("UPLOAD_DIR resolves to:", UPLOAD_DIR.resolve())


def build_analysis_response(analysis: Analysis) -> AnalysisResponse:
    """Build a consistent response for a saved analysis."""

    return AnalysisResponse(
        id=analysis.id,
        filename=analysis.filename,
        model_id=analysis.model_id,
        image_width=analysis.image_width,
        image_height=analysis.image_height,
        latitude=analysis.latitude,
        longitude=analysis.longitude,
        location_name=analysis.location_name,
        verification_status=analysis.verification_status,
        verified_at=analysis.verified_at,
        created_at=analysis.created_at,
        prediction_count=len(analysis.detections),
        detections=[
            {
                "id": detection.id,
                "class_name": detection.class_name,
                "confidence": detection.confidence,
                "x": detection.x,
                "y": detection.y,
                "width": detection.width,
                "height": detection.height,
            }
            for detection in analysis.detections
        ],
    )


@router.post("/images/validate-upload")
async def upload_image(file: UploadFile = File(...)):
    result = await validate_and_save_image(
        file=file,
        upload_dir=UPLOAD_DIR,
    )

    return {
        "message": "Image uploaded and validated successfully.",
        "filename": result["filename"],
        "format": result["format"],
        "width": result["width"],
        "height": result["height"],
        "size_bytes": result["size_bytes"],
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    location_name: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status_code=422,
            detail="Provide both latitude and longitude, or neither.",
        )

    if latitude is not None and not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=422,
            detail="Latitude must be between -90 and 90.",
        )

    if longitude is not None and not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=422,
            detail="Longitude must be between -180 and 180.",
        )

    saved_path = None

    try:
        image_result = await validate_and_save_image(
            file=file,
            upload_dir=UPLOAD_DIR,
        )

        saved_path = Path(image_result["path"])

        ai_result = run_inference(saved_path)
        print("DEBUG - Roboflow result:", ai_result)

        image_info = ai_result["image"]

        image_width = image_info.get("width") or image_result["width"]
        image_height = image_info.get("height") or image_result["height"]

        analysis = Analysis(
            filename=image_result["filename"],
            model_id=ai_result["model_id"],
            image_width=int(image_width),
            image_height=int(image_height),
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
        )

        for prediction in ai_result["predictions"]:
            detection = Detection(
                class_name=prediction["class_name"],
                confidence=prediction["confidence"],
                original_class_name=prediction["class_name"],
                original_confidence=prediction["confidence"],
                x=prediction["x"],
                y=prediction["y"],
                width=prediction["width"],
                height=prediction["height"],
            )

            analysis.detections.append(detection)

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return build_analysis_response(analysis)

    except HTTPException:
        db.rollback()

        if saved_path is not None:
            try:
                saved_path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not remove a failed analysis upload.")

        raise

    except Exception:
        db.rollback()

        if saved_path is not None:
            try:
                saved_path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not remove a failed analysis upload.")

        logger.exception("Image analysis failed.")

        raise HTTPException(
            status_code=500,
            detail="Image analysis could not be completed.",
        ) from None


# --------------------------------------------------
# ANALYSIS HISTORY: PAGINATION AND FILTERING
# --------------------------------------------------

@router.get("/analyses")
def list_analyses(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    verification_status: str | None = Query(
        default=None,
        pattern="^(pending|verified)$",
    ),
    db: Session = Depends(get_db),
):
    """
    Return paginated analysis history, newest first.

    Optional parameters:
    - limit: number of records to return (1-100)
    - offset: number of records to skip
    - verification_status: pending or verified
    """

    query = db.query(Analysis)

    if verification_status is not None:
        query = query.filter(
            Analysis.verification_status == verification_status
        )

    total = query.with_entities(func.count(Analysis.id)).scalar() or 0

    analyses = (
        query
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            build_analysis_response(analysis)
            for analysis in analyses
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# --------------------------------------------------
# GET ONE ANALYSIS
# --------------------------------------------------

@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Return one saved analysis and its detections."""

    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    return build_analysis_response(analysis)


# --------------------------------------------------
# DELETE AN ANALYSIS AND ITS DETECTIONS
# --------------------------------------------------

@router.delete("/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Delete an analysis and its associated detection records."""

    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    try:
        db.delete(analysis)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Could not delete analysis %s", analysis_id)

        raise HTTPException(
            status_code=500,
            detail="Could not delete the analysis.",
        ) from None

    return {
        "message": "Analysis and associated detections deleted successfully.",
        "analysis_id": analysis_id,
    }



# --------------------------------------------------
# GET ORIGINAL UPLOADED IMAGE
# --------------------------------------------------

@router.get("/analyses/{analysis_id}/image")
def get_original_image(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    
    """Return the original image associated with an analysis."""

    print("========== ORIGINAL IMAGE ENDPOINT HIT ==========")
    print("Analysis ID received:", analysis_id, flush=True)
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    print("Requested analysis ID:", analysis_id)
    print("Database filename:", analysis.filename if analysis else None)
    print("Resolved image path:", (UPLOAD_DIR / analysis.filename).resolve() if analysis else None)

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    original_path = UPLOAD_DIR / analysis.filename

    if not original_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Original image file not found.",
        )

    return FileResponse(
        path=original_path,
        filename=analysis.filename,
    )


# --------------------------------------------------
# GENERATE ANNOTATED IMAGE
# --------------------------------------------------

@router.get("/analyses/{analysis_id}/annotated-image")
def get_annotated_image(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    original_path = UPLOAD_DIR / analysis.filename

    if not original_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Original image file not found.",
        )

    detections = [
        {
            "class_name": detection.class_name,
            "confidence": detection.confidence,
            "x": detection.x,
            "y": detection.y,
            "width": detection.width,
            "height": detection.height,
        }
        for detection in analysis.detections
    ]

    output_path = (
        UPLOAD_DIR / "annotated" / f"analysis_{analysis.id}.jpg"
    )

    try:
        create_annotated_image(
            original_path=original_path,
            detections=detections,
            output_path=output_path,
        )

    except Exception:
        logger.exception(
            "Could not generate annotated image for analysis %s",
            analysis_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Could not generate annotated image.",
        ) from None

    return FileResponse(
        path=output_path,
        media_type="image/jpeg",
        filename=f"analysis_{analysis.id}_annotated.jpg",
    )


# --------------------------------------------------
# HUMAN VERIFICATION
# --------------------------------------------------

@router.post(
    "/analyses/{analysis_id}/verify",
    response_model=AnalysisResponse,
)
def verify_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Confirm the analysis and record its verification time."""

    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    analysis.verification_status = "verified"
    analysis.verified_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(analysis)

    except Exception:
        db.rollback()
        logger.exception("Could not verify analysis %s", analysis_id)

        raise HTTPException(
            status_code=500,
            detail="Could not save analysis verification.",
        ) from None

    return build_analysis_response(analysis)


# --------------------------------------------------
# EDIT A DETECTION
# --------------------------------------------------

@router.patch(
    "/analyses/{analysis_id}/detections/{detection_id}",
    response_model=DetectionResponse,
)
def edit_detection(
    analysis_id: int,
    detection_id: int,
    updates: DetectionUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update a detection while preserving its original AI prediction."""

    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    detection = (
        db.query(Detection)
        .filter(
            Detection.id == detection_id,
            Detection.analysis_id == analysis_id,
        )
        .first()
    )

    if detection is None:
        raise HTTPException(
            status_code=404,
            detail="Detection not found for this analysis.",
        )

    class_name = updates.class_name.strip()

    if not class_name:
        raise HTTPException(
            status_code=422,
            detail="Detection class name cannot be empty.",
        )

    detection.class_name = class_name
    detection.confidence = updates.confidence
    detection.x = updates.x
    detection.y = updates.y
    detection.width = updates.width
    detection.height = updates.height

    try:
        db.commit()
        db.refresh(detection)

    except Exception:
        db.rollback()

        logger.exception(
            "Could not update detection %s in analysis %s",
            detection_id,
            analysis_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Could not save detection changes.",
        ) from None

    return detection
