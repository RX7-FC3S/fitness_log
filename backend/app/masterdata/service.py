from sqlalchemy import select
from sqlalchemy.orm import Session

from app.masterdata.models import Exercise


def list_exercises(db: Session) -> list[Exercise]:
    stmt = select(Exercise).order_by(Exercise.name)
    return list(db.execute(stmt).scalars().all())


def create_exercise(
    db: Session, name: str, target_muscle: str | None = None
) -> Exercise:
    new_exercise = Exercise(
        name=name, target_muscle=target_muscle, created_by=1, updated_by=1
    )
    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise


def update_exercise(
    db: Session, ex_id: int, name: str, target_muscle: str | None = None
) -> Exercise | None:
    stmt = select(Exercise).where(Exercise.id == ex_id)
    exercise = db.execute(stmt).scalars().first()
    if not exercise:
        return None
    exercise.name = name
    exercise.target_muscle = target_muscle
    db.commit()
    db.refresh(exercise)
    return exercise


def delete_exercise(db: Session, ex_id: int) -> bool:
    stmt = select(Exercise).where(Exercise.id == ex_id)
    exercise = db.execute(stmt).scalars().first()
    if not exercise:
        return False
    db.delete(exercise)
    db.commit()
    return True

