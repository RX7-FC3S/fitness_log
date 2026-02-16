from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import BaseModel


class SetType(str, Enum):
    WARMUP = "热身组"
    WORKING = "正式组"
    DROP = "递减组"
    FAILURE = "失败组"


class FitnessDay(BaseModel):
    __tablename__ = "fitness_day"

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    primary_muscles: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sets: Mapped[list["FitnessSet"]] = relationship(
        back_populates="fitness_day",
        cascade="all, delete-orphan",
    )


class FitnessSet(BaseModel):
    __tablename__ = "fitness_set"

    fitness_day_id: Mapped[int] = mapped_column(
        ForeignKey("fitness_day.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    fitness_day: Mapped["FitnessDay"] = relationship(back_populates="sets")

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercise.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    exercise = relationship("Exercise")

    set_type: Mapped[SetType] = mapped_column(SAEnum(SetType), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)

    unit_id: Mapped[int] = mapped_column(
        ForeignKey("unit.id", ondelete="RESTRICT"), nullable=False
    )
    unit = relationship("Unit")

    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

