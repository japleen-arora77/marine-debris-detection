import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_PIXELS = 40_000_000

async def validate_and_save_image(
    file: UploadFile,
    upload_dir: Path,
) -> dict:
    """
    Validate an uploaded image and save it using a unique filename.

    The file extension is determined from the decoded image format,
    not from the user-provided filename or content type.
    """

    contents = await file.read(MAX_UPLOAD_SIZE + 1)

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the maximum size of 10 MB.",
        )

    try:
        with Image.open(io.BytesIO(contents)) as image:
            actual_format = image.format

            if actual_format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=415,
                    detail="Unsupported image format. Upload JPEG, PNG, or WebP.",
                )

            image.verify()

        # Reopen after verify() to read the image dimensions.
        with Image.open(io.BytesIO(contents)) as image:
            width, height = image.size
            if width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail="Image dimensions exceed the allowed pixel limit.",
                )
            if width <= 0 or height <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions are invalid.",
                )

            # Force decoding so truncated or corrupt image data is detected.
            image.load()

    except HTTPException:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid, readable image.",
        ) from exc

    extension = ALLOWED_FORMATS[actual_format]
    safe_filename = f"{uuid.uuid4().hex}{extension}"

    upload_dir.mkdir(parents=True, exist_ok=True)
    saved_path = upload_dir / safe_filename

    try:
        saved_path.write_bytes(contents)
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail="The server could not save the uploaded image.",
        ) from exc

    return {
        "filename": safe_filename,
        "path": str(saved_path),
        "format": actual_format,
        "width": width,
        "height": height,
        "size_bytes": len(contents),
    }