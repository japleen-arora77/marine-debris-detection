
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DetectionResponse(BaseModel):
    id: int
    class_name: str
    confidence: float = Field(ge=0, le=1)
    x: float
    y: float
    width: float = Field(gt=0)
    height: float = Field(gt=0)

    model_config = ConfigDict(from_attributes=True)


class DetectionUpdateRequest(BaseModel):
    class_name: str = Field(min_length=1, max_length=100)
    confidence: float = Field(ge=0, le=1)
    x: float
    y: float
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class AnalysisResponse(BaseModel):
    id: int
    filename: str
    model_id: str
    image_width: int
    image_height: int
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None
    created_at: datetime

    verification_status: str = "pending"
    verified_at: datetime | None = None

    prediction_count: int
    detections: list[DetectionResponse]

    model_config = ConfigDict(from_attributes=True)
