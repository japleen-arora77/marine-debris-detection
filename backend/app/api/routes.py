
import logging
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
) 
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Analysis, Detection
from app.schemas import AnalysisResponse
from app.services.ai_service import run_inference
from app.services.image_service import validate_and_save_image


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Images"])

UPLOAD_DIR = Path("uploads")


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
        # 1. Validate and save the uploaded image.
        image_result = await validate_and_save_image(
            file=file,
            upload_dir=UPLOAD_DIR,
        )

        saved_path = Path(image_result["path"])

        # 2. Run the actual Roboflow model.
        ai_result = run_inference(saved_path)

        image_info = ai_result["image"]

        image_width = image_info.get("width") or image_result["width"]
        image_height = image_info.get("height") or image_result["height"]

        # 3. Create the parent analysis record.
        analysis = Analysis(
            filename=image_result["filename"],
            model_id=ai_result["model_id"],
            image_width=int(image_width),
            image_height=int(image_height),
            latitude=latitude,
            longitude=longitude,
        )
        

        # 4. Attach all validated detections to the analysis.
        for prediction in ai_result["predictions"]:
            detection = Detection(
                class_name=prediction["class_name"],
                confidence=prediction["confidence"],
                x=prediction["x"],
                y=prediction["y"],
                width=prediction["width"],
                height=prediction["height"],
            )

            analysis.detections.append(detection)

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # 5. Build the response after the database commit.
        response = AnalysisResponse(
            id=analysis.id,
            filename=analysis.filename,
            model_id=analysis.model_id,
            image_width=analysis.image_width,
            image_height=analysis.image_height,
            latitude=analysis.latitude,
            longitude=analysis.longitude,
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

        return response

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



@router.get("/analyses", response_model=list[AnalysisResponse])
def list_analyses(
    db: Session = Depends(get_db),
):
    """Return saved analyses, newest first."""

    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        .all()
    )

    return [
        AnalysisResponse(
            id=analysis.id,
            filename=analysis.filename,
            model_id=analysis.model_id,
            image_width=analysis.image_width,
            image_height=analysis.image_height,
            latitude=analysis.latitude,
            longitude=analysis.longitude,
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
        for analysis in analyses
    ]


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

    return AnalysisResponse(
        id=analysis.id,
        filename=analysis.filename,
        model_id=analysis.model_id,
        image_width=analysis.image_width,
        image_height=analysis.image_height,
        latitude=analysis.latitude,
        longitude=analysis.longitude,
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
