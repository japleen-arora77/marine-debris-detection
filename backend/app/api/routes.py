from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.image_service import validate_and_save_image


router = APIRouter(prefix="/api", tags=["Images"])


@router.post("/images/validate-upload")
async def upload_image(file: UploadFile = File(...)):
    result = await validate_and_save_image(
        file=file,
        upload_dir=Path("uploads"),
    )

    # Return metadata, not the server's internal filesystem path.
    return {
        "message": "Image uploaded and validated successfully.",
        "filename": result["filename"],
        "format": result["format"],
        "width": result["width"],
        "height": result["height"],
        "size_bytes": result["size_bytes"],
    }