
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    class_name: Mapped[str] = mapped_column(String(100), nullable=False)

    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    x: Mapped[float] = mapped_column(Float, nullable=False)

    y: Mapped[float] = mapped_column(Float, nullable=False)

    width: Mapped[float] = mapped_column(Float, nullable=False)

    height: Mapped[float] = mapped_column(Float, nullable=False)

    analysis: Mapped["Analysis"] = relationship(
        back_populates="detections",
    )
