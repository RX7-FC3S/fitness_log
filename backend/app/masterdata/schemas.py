from pydantic import BaseModel
from app.masterdata.models import MuscleGroup


class ExerciseCreate(BaseModel):
    """Schema for creating a new exercise."""
    name: str
    target_muscle: MuscleGroup | None = None
