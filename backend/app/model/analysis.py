
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, Float, Integer, String
from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    model_id: Mapped[str] = mapped_column(String(255), nullable=False)

    image_width: Mapped[int] = mapped_column(Integer, nullable=False)

    image_height: Mapped[int] = mapped_column(Integer, nullable=False)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True,)

    longitude: Mapped[float | None] = mapped_column(Float, nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    detections: Mapped[list["Detection"]] = relationship(
        back_populates="analysis",
        cascade="all, delete-orphan",
    )
