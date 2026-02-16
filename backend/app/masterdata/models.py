from enum import Enum

from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import BaseModel


class MuscleGroup(str, Enum):
    """Enumeration of target muscle groups."""
    CHEST = "胸"
    BACK = "背"
    SHOULDER = "肩"
    ARM = "臂"
    LEG = "腿"
    ABS = "腹"


class Exercise(BaseModel):
    """Represents a weightlifting exercise."""
    __tablename__ = "exercise"

    name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    target_muscle: Mapped[MuscleGroup | None] = mapped_column(
        SAEnum(MuscleGroup), nullable=True
    )


class Unit(BaseModel):
    """Represents a measurement unit for weight (e.g., kg, lbs)."""
    __tablename__ = "unit"

    name: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
