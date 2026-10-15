
import logging
import math
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException
from inference_sdk import (
    InferenceConfiguration,
    InferenceHTTPClient,
)

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL_ID = "marine-debris-uxk2k-qcr2d/2"


def run_inference(image_path: Path) -> dict:
    """
    Send a validated local image to Roboflow for inference
    and return normalized predictions.
    """

    api_key = os.getenv("ROBOFLOW_API_KEY")
    model_id = os.getenv("ROBOFLOW_MODEL_ID", DEFAULT_MODEL_ID)

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Roboflow API key is not configured.",
        )

    if not image_path.is_file():
        raise HTTPException(
            status_code=400,
            detail="The image file does not exist.",
        )

    try:
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key,
        ).configure(
            InferenceConfiguration(api_key_transport="header")
        )

        result = client.infer(
            str(image_path),
            model_id=model_id,
        )

    except Exception as exc:
        logger.error(
            "Roboflow inference failed. Error type: %s",
            type(exc).__name__,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Roboflow inference failed. Check the API key, "
                "model ID, network connection, and model access."
            ),
        ) from None

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=502,
            detail="Roboflow returned an unexpected response.",
        )

    predictions = result.get("predictions")

    if not isinstance(predictions, list):
        raise HTTPException(
            status_code=502,
            detail=(
                "Roboflow response did not contain "
                "a valid predictions list."
            ),
        )

    image_info = result.get("image") or {}

    if not isinstance(image_info, dict):
        image_info = {}

    normalized_predictions = []

    for item in predictions:
        if not isinstance(item, dict):
            continue

        class_name = item.get("class")

        if not isinstance(class_name, str) or not class_name.strip():
            continue

        try:
            confidence = float(item.get("confidence"))
            x = float(item.get("x"))
            y = float(item.get("y"))
            width = float(item.get("width"))
            height = float(item.get("height"))

        except (TypeError, ValueError):
            continue

        values = [confidence, x, y, width, height]

        if not all(math.isfinite(value) for value in values):
            continue

        if not 0 <= confidence <= 1:
            continue

        if width <= 0 or height <= 0:
            continue

        normalized_predictions.append(
            {
                "class_name": class_name.strip(),
                "confidence": confidence,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
            }
        )

    return {
        "model_id": model_id,
        "image": {
            "width": image_info.get("width"),
            "height": image_info.get("height"),
        },
        "prediction_count": len(normalized_predictions),
        "predictions": normalized_predictions,
    }
