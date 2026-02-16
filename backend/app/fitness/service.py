from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session, selectinload

from app.fitness.models import FitnessDay, FitnessSet
from app.fitness.schemas import FitnessSetCreate, FitnessSetUpdate
from app.masterdata.models import Exercise, Unit


def resolve_timezone(tz: str):
    tz_clean = (tz or "").strip()
    if tz_clean.upper() == "UTC":
        return timezone.utc
    try:
        return ZoneInfo(tz_clean)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"Invalid timezone: {tz}") from exc


def normalize_primary_muscle_selection(muscles) -> str | None:
    if not muscles:
        return None
    if isinstance(muscles, str):
        raw = [m.strip() for m in muscles.split(",") if m.strip()]
    else:
        raw = []
        for muscle in muscles:
            value = str(muscle.value) if hasattr(muscle, "value") else str(muscle)
            if value.strip():
                raw.append(value)
    if not raw:
        return None

    seen = set()
    ordered = []
    for muscle in raw:
        if muscle not in seen:
            seen.add(muscle)
            ordered.append(muscle)
    return ",".join(ordered)


def parse_primary_muscles(value: str | None) -> list[str]:
    if not value:
        return []
    return [item for item in (part.strip() for part in value.split(",")) if item]


def local_today(tz: str) -> date:
    tzinfo = resolve_timezone(tz)
    return datetime.now(tzinfo).date()


def get_fitness_day_by_id(db: Session, day_id: int) -> FitnessDay | None:
    stmt = (
        select(FitnessDay)
        .where(FitnessDay.id == day_id)
        .options(
            selectinload(FitnessDay.sets).selectinload(FitnessSet.exercise),
            selectinload(FitnessDay.sets).selectinload(FitnessSet.unit),
        )
    )
    return db.execute(stmt).scalars().first()


def serialize_fitness_day_detail(day: FitnessDay) -> dict:
    groups: dict[int, dict] = {}

    for fitness_set in day.sets:
        exercise = fitness_set.exercise
        if exercise.id not in groups:
            groups[exercise.id] = {
                "exercise": {"id": exercise.id, "name": exercise.name},
                "sets": [],
            }

        unit = fitness_set.unit
        set_type_value = (
            fitness_set.set_type.value
            if hasattr(fitness_set.set_type, "value")
            else fitness_set.set_type
        )
        groups[exercise.id]["sets"].append(
            {
                "id": fitness_set.id,
                "set_type": set_type_value,
                "weight": fitness_set.weight,
                "reps": fitness_set.reps,
                "unit": {"id": unit.id, "name": unit.name},
                "remark": fitness_set.remark,
            }
        )

    return {
        "id": day.id,
        "timezone": day.timezone,
        "primary_muscles": parse_primary_muscles(day.primary_muscles),
        "start_time": day.start_time.isoformat() if day.start_time else None,
        "end_time": day.end_time.isoformat() if day.end_time else None,
        "exercises": list(groups.values()),
    }


def list_fitness_days_by_month(db: Session, year: int, month: int) -> list[FitnessDay]:
    stmt = select(FitnessDay).where(
        extract("year", FitnessDay.date) == year,
        extract("month", FitnessDay.date) == month,
    )
    return list(db.execute(stmt).scalars().all())


def get_today_fitness_day(db: Session, tz: str) -> FitnessDay | None:
    today = local_today(tz)
    stmt = select(FitnessDay).where(FitnessDay.date == today)
    return db.execute(stmt).scalars().first()


def get_or_create_today_fitness_day(
    db: Session, tz: str, primary_muscles=None
) -> FitnessDay:
    today = local_today(tz)
    stmt = select(FitnessDay).where(FitnessDay.date == today)
    existing_day = db.execute(stmt).scalars().first()

    if existing_day:
        if primary_muscles is not None:
            existing_day.primary_muscles = normalize_primary_muscle_selection(
                primary_muscles
            )
            existing_day.updated_by = 1
            db.commit()
            db.refresh(existing_day)
        return existing_day

    new_day = FitnessDay(
        created_by=1,
        updated_by=1,
        date=today,
        timezone=tz,
        primary_muscles=normalize_primary_muscle_selection(primary_muscles),
        start_time=datetime.now(timezone.utc),
    )
    db.add(new_day)
    db.commit()
    db.refresh(new_day)
    return new_day


def finish_today_fitness_day(db: Session, tz: str) -> FitnessDay | None:
    day = get_today_fitness_day(db, tz)
    if not day:
        return None
    day.end_time = datetime.now(timezone.utc)
    day.updated_by = 1
    db.commit()
    db.refresh(day)
    return day


def create_fitness_set(db: Session, data: FitnessSetCreate, tz: str) -> FitnessSet:
    day_id = data.fitness_day_id
    if not day_id:
        day = get_or_create_today_fitness_day(db, tz, data.primary_muscles)
        day_id = day.id

    new_set = FitnessSet(
        fitness_day_id=day_id,
        exercise_id=data.exercise_id,
        weight=data.weight,
        reps=data.reps,
        unit_id=data.unit_id,
        set_type=data.set_type,
        remark=data.remark,
        created_by=1,
        updated_by=1,
    )
    db.add(new_set)
    db.commit()
    db.refresh(new_set)
    return new_set


def update_fitness_set(
    db: Session, set_id: int, data: FitnessSetUpdate
) -> FitnessSet | None:
    stmt = select(FitnessSet).where(FitnessSet.id == set_id)
    fitness_set = db.execute(stmt).scalars().first()
    if not fitness_set:
        return None

    if data.exercise_id is not None:
        fitness_set.exercise_id = data.exercise_id
    if data.weight is not None:
        fitness_set.weight = data.weight
    if data.reps is not None:
        fitness_set.reps = data.reps
    if data.unit_id is not None:
        fitness_set.unit_id = data.unit_id
    if data.set_type is not None:
        fitness_set.set_type = data.set_type
    if data.remark is not None:
        fitness_set.remark = data.remark

    fitness_set.updated_by = 1
    db.commit()
    db.refresh(fitness_set)
    return fitness_set


def delete_fitness_set(db: Session, set_id: int) -> bool:
    stmt = select(FitnessSet).where(FitnessSet.id == set_id)
    fitness_set = db.execute(stmt).scalars().first()
    if not fitness_set:
        return False

    day_id = fitness_set.fitness_day_id
    count_stmt = select(func.count(FitnessSet.id)).where(FitnessSet.fitness_day_id == day_id)
    set_count = db.execute(count_stmt).scalar()

    if set_count == 1:
        day_stmt = select(FitnessDay).where(FitnessDay.id == day_id)
        day = db.execute(day_stmt).scalars().first()
        if day:
            db.delete(day)
    else:
        db.delete(fitness_set)

    db.commit()
    return True


def list_units(db: Session) -> list[Unit]:
    stmt = select(Unit).order_by(Unit.name)
    return list(db.execute(stmt).scalars().all())


def list_fitness_logs(
    db: Session,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    exercise_name: str | None = None,
) -> list[dict]:
    stmt = (
        select(FitnessSet)
        .join(FitnessDay)
        .join(Exercise)
        .options(
            selectinload(FitnessSet.exercise),
            selectinload(FitnessSet.unit),
            selectinload(FitnessSet.fitness_day),
        )
    )

    if from_date:
        stmt = stmt.where(FitnessDay.date >= from_date.date())
    if to_date:
        stmt = stmt.where(FitnessDay.date <= to_date.date())
    if exercise_name:
        stmt = stmt.where(Exercise.name.ilike(f"%{exercise_name}%"))

    stmt = stmt.order_by(FitnessDay.date.desc(), FitnessSet.id.desc())
    fitness_sets = db.execute(stmt).scalars().all()

    grouped_results = {}
    for fitness_set in fitness_sets:
        date_str = fitness_set.fitness_day.date.strftime("%Y-%m-%d")
        if date_str not in grouped_results:
            grouped_results[date_str] = {
                "date": date_str,
                "timezone": fitness_set.fitness_day.timezone,
                "sets": [],
            }
        grouped_results[date_str]["sets"].append(
            {
                "id": fitness_set.id,
                "exercise": fitness_set.exercise.name,
                "set_type": (
                    fitness_set.set_type.value
                    if hasattr(fitness_set.set_type, "value")
                    else fitness_set.set_type
                ),
                "weight": fitness_set.weight,
                "reps": fitness_set.reps,
                "unit": fitness_set.unit.name,
                "remark": fitness_set.remark,
                "created_at": (
                    fitness_set.created_at.isoformat() if fitness_set.created_at else None
                ),
            }
        )
    return list(grouped_results.values())

