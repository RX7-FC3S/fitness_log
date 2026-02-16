from calendar import monthrange
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.fitness import service
from app.fitness.models import SetType
from app.fitness.schemas import (
    FitnessDayStart,
    FitnessSetCreate,
    FitnessSetRead,
    FitnessSetUpdate,
)
from app.masterdata import service as masterdata_service
from app.masterdata.models import MuscleGroup
from app.masterdata.schemas import ExerciseCreate

router = APIRouter()


def require_timezone(x_timezone: str = Header(..., alias="X-Timezone")) -> str:
    if not x_timezone or not x_timezone.strip():
        raise HTTPException(status_code=400, detail="X-Timezone header is required")
    try:
        service.resolve_timezone(x_timezone)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid X-Timezone header: {x_timezone}",
        )
    return x_timezone


@router.get("/api/fitness/init-data", tags=["Init"])
def get_init_data(
    db: Session = Depends(get_db),
    tz: str = Depends(require_timezone),
) -> dict[str, Any]:
    today = service.local_today(tz)
    exercises = masterdata_service.list_exercises(db)
    units = service.list_units(db)
    return {
        "today": today.strftime("%Y/%m/%d"),
        "timezone": tz,
        "exercises": [
            {"id": exercise.id, "name": exercise.name, "target_muscle": exercise.target_muscle}
            for exercise in exercises
        ],
        "units": [{"id": unit.id, "name": unit.name} for unit in units],
        "set_types": [
            {"value": SetType.WARMUP.value, "label": "Warm-up"},
            {"value": SetType.WORKING.value, "label": "Working"},
            {"value": SetType.DROP.value, "label": "Drop"},
            {"value": SetType.FAILURE.value, "label": "Failure"},
        ],
        "muscle_groups": [muscle_group.value for muscle_group in MuscleGroup],
    }


@router.get("/api/fitness/fitness_day", tags=["Fitness Day"])
def get_fitness_days_by_month(
    year: int | None = None,
    month: int | None = None,
    tz: str = Depends(require_timezone),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Get training days for a specific month.
    Frontend will handle calendar layout calculation.
    Returns a mapping of day (1-31) to training day ID.
    """
    today = service.local_today(tz)
    year = year or today.year
    month = month or today.month
    training_days = service.list_fitness_days_by_month(db=db, year=year, month=month)
    return {
        "training_days": {day.date.day: day.id for day in training_days},
    }


@router.get("/api/fitness/fitness_day/today", tags=["Fitness Day"])
def get_today_fitness_day(
    db: Session = Depends(get_db),
    tz: str = Depends(require_timezone),
):
    day = service.get_today_fitness_day(db, tz)
    if day:
        day_model = service.get_fitness_day_by_id(db, day.id)
        return service.serialize_fitness_day_detail(day_model)
    return {
        "id": None,
        "timezone": tz,
        "primary_muscles": [],
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "exercises": [],
    }


@router.post("/api/fitness/fitness_day/today/start", tags=["Fitness Day"])
def start_today_fitness_day(
    payload: FitnessDayStart,
    db: Session = Depends(get_db),
    tz: str = Depends(require_timezone),
):
    day = service.get_or_create_today_fitness_day(db, tz, payload.primary_muscles)
    return service.serialize_fitness_day_detail(day)


@router.put("/api/fitness/fitness_day/today/end", tags=["Fitness Day"])
def finish_today_fitness_day(
    db: Session = Depends(get_db),
    tz: str = Depends(require_timezone),
):
    day = service.finish_today_fitness_day(db, tz)
    if not day:
        raise HTTPException(status_code=404, detail="Today's fitness day not found")
    return {"ok": True}


@router.get("/api/fitness/fitness_day/{day_id}", tags=["Fitness Day"])
def get_fitness_day_detail(day_id: int, db: Session = Depends(get_db)):
    day = service.get_fitness_day_by_id(db=db, day_id=day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Fitness day not found")
    return service.serialize_fitness_day_detail(day)


@router.post("/api/fitness/fitness_set/create", response_model=FitnessSetRead, tags=["Fitness Set"])
def create_fitness_set(
    data: FitnessSetCreate,
    tz: str = Depends(require_timezone),
    db: Session = Depends(get_db),
):
    return service.create_fitness_set(db, data, tz)


@router.put("/api/fitness/fitness_set/{set_id}", response_model=FitnessSetRead, tags=["Fitness Set"])
def update_fitness_set(
    set_id: int,
    data: FitnessSetUpdate,
    db: Session = Depends(get_db),
):
    updated = service.update_fitness_set(db, set_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Set not found")
    return updated


@router.delete("/api/fitness/fitness_set/{set_id}", tags=["Fitness Set"])
def delete_fitness_set(
    set_id: int,
    db: Session = Depends(get_db),
):
    deleted = service.delete_fitness_set(db, set_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Set not found")
    return {"ok": True}


@router.get("/api/fitness/fitness_logs", tags=["Logs"])
def get_fitness_logs(
    from_date: str | None = None,
    to_date: str | None = None,
    exercise_name: str | None = None,
    db: Session = Depends(get_db),
) -> list[dict]:
    from_date_dt = datetime.strptime(from_date, "%Y-%m-%d") if from_date else None
    to_date_dt = datetime.strptime(to_date, "%Y-%m-%d") if to_date else None
    return service.list_fitness_logs(db, from_date_dt, to_date_dt, exercise_name)


@router.get("/api/masterdata/exercises", tags=["Exercise"])
def list_exercises(db: Session = Depends(get_db)):
    return masterdata_service.list_exercises(db)


@router.post("/api/masterdata/exercise/create", tags=["Exercise"])
def create_exercise(data: ExerciseCreate, db: Session = Depends(get_db)):
    return masterdata_service.create_exercise(db, data.name, data.target_muscle)


@router.put("/api/masterdata/exercise/{ex_id}", tags=["Exercise"])
def update_exercise(ex_id: int, data: ExerciseCreate, db: Session = Depends(get_db)):
    return masterdata_service.update_exercise(db, ex_id, data.name, data.target_muscle)


@router.delete("/api/masterdata/exercise/{ex_id}", tags=["Exercise"])
def delete_exercise(ex_id: int, db: Session = Depends(get_db)):
    return masterdata_service.delete_exercise(db, ex_id)
