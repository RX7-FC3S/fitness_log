from pydantic import BaseModel

from app.fitness.models import SetType
from app.masterdata.models import MuscleGroup


class FitnessDayStart(BaseModel):
    primary_muscles: list[MuscleGroup] | None = None


class FitnessSetCreate(BaseModel):
    fitness_day_id: int | None = None
    exercise_id: int
    weight: float
    reps: int = 1
    unit_id: int
    set_type: SetType = SetType.WORKING
    remark: str | None = None
    primary_muscles: list[MuscleGroup] | None = None


class FitnessSetUpdate(BaseModel):
    exercise_id: int | None = None
    weight: float | None = None
    reps: int | None = None
    unit_id: int | None = None
    set_type: SetType | None = None
    remark: str | None = None


class FitnessSetRead(BaseModel):
    id: int
    fitness_day_id: int
    exercise_id: int
    weight: float
    reps: int
    unit_id: int
    set_type: SetType
    remark: str | None = None

    class Config:
        from_attributes = True

