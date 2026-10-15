import asyncio
import io

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.services.image_service import validate_and_save_image


def create_test_image(format="JPEG"):
    buffer = io.BytesIO()
    Image.new("RGB", (100, 80), color="blue").save(
        buffer,
        format=format,
    )
    buffer.seek(0)
    return buffer.getvalue()


def make_upload(contents, filename="test.jpg"):
    return UploadFile(
        filename=filename,
        file=io.BytesIO(contents),
    )


def test_valid_jpeg_is_saved(tmp_path):
    result = asyncio.run(
        validate_and_save_image(
            make_upload(create_test_image()),
            tmp_path,
        )
    )

    assert result["format"] == "JPEG"
    assert result["width"] == 100
    assert result["height"] == 80
    assert (tmp_path / result["filename"]).exists()


def test_text_disguised_as_image_is_rejected(tmp_path):
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            validate_and_save_image(
                make_upload(b"This is not an image", "fake.jpg"),
                tmp_path,
            )
        )

    assert error.value.status_code == 400


def test_empty_file_is_rejected(tmp_path):
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            validate_and_save_image(
                make_upload(b""),
                tmp_path,
            )
        )

    assert error.value.status_code == 400


def test_oversized_file_is_rejected(tmp_path):
    from app.services.image_service import MAX_UPLOAD_SIZE

    oversized_content = b"x" * (MAX_UPLOAD_SIZE + 1)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            validate_and_save_image(
                make_upload(oversized_content),
                tmp_path,
            )
        )

    assert error.value.status_code == 413