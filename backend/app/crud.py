from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .models import Incident, IncidentHistory, User
from .schemas import IncidentCreate, RegisterStudentRequest, StatusUpdate
from .security import hash_password, verify_password


def create_incident(database: Session, data: IncidentCreate, reporter_name: str, reporter_email: str) -> Incident:
    incident = Incident(**data.model_dump(), reporter_name=reporter_name, reporter_email=reporter_email)
    incident.history.append(IncidentHistory(old_status=None, new_status="open", note="Incident submitted"))
    database.add(incident)
    database.commit()
    return get_incident(database, incident.id)


def get_incident(database: Session, incident_id: str) -> Incident | None:
    statement = select(Incident).options(selectinload(Incident.history)).where(Incident.id == incident_id)
    return database.scalar(statement)


def list_incidents(
    database: Session, status: str | None, category: str | None, limit: int, offset: int, reporter_email: str | None = None
):
    statement = select(Incident).options(selectinload(Incident.history)).order_by(Incident.created_at.desc())
    if status:
        statement = statement.where(Incident.status == status)
    if category:
        statement = statement.where(Incident.category == category)
    if reporter_email:
        statement = statement.where(Incident.reporter_email == reporter_email)
    return list(database.scalars(statement.limit(limit).offset(offset)).all())


def update_status(database: Session, incident: Incident, data: StatusUpdate, changed_by: str) -> Incident:
    previous_status = incident.status
    incident.status = data.status
    incident.history.append(IncidentHistory(old_status=previous_status, new_status=data.status, note=data.note, changed_by=changed_by))
    database.commit()
    return get_incident(database, incident.id)


def summary(database: Session) -> dict[str, int]:
    grouped = dict(database.execute(select(Incident.status, func.count()).group_by(Incident.status)).all())
    critical = database.scalar(select(func.count()).select_from(Incident).where(Incident.priority == "critical")) or 0
    return {
        "total": sum(grouped.values()),
        "open": grouped.get("open", 0) + grouped.get("acknowledged", 0),
        "in_progress": grouped.get("in_progress", 0),
        "resolved": grouped.get("resolved", 0) + grouped.get("closed", 0),
        "critical": critical,
    }


def get_user_by_email(database: Session, email: str) -> User | None:
    return database.query(User).filter(User.email == email).first()


def register_student(database: Session, data: RegisterStudentRequest) -> User:
    user = User(full_name=data.full_name, email=str(data.email).lower(), password_hash=hash_password(data.password), role="student")
    database.add(user)
    database.commit()
    database.refresh(user)
    return user


def authenticate_user(database: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(database, email.lower())
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def seed_initial_admin(database: Session, full_name: str, email: str, password: str) -> User:
    normalized_email = email.lower()
    existing = get_user_by_email(database, normalized_email)
    if existing:
        if existing.role != "admin":
            existing.role = "admin"
            database.commit()
        return existing
    user = User(full_name=full_name, email=normalized_email, password_hash=hash_password(password), role="admin")
    database.add(user)
    database.commit()
    database.refresh(user)
    return user
