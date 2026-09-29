from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .models import Incident, IncidentHistory
from .schemas import IncidentCreate, StatusUpdate


def create_incident(database: Session, data: IncidentCreate) -> Incident:
    incident = Incident(**data.model_dump())
    incident.history.append(IncidentHistory(old_status=None, new_status="open", note="Incident submitted"))
    database.add(incident)
    database.commit()
    return get_incident(database, incident.id)


def get_incident(database: Session, incident_id: str) -> Incident | None:
    statement = select(Incident).options(selectinload(Incident.history)).where(Incident.id == incident_id)
    return database.scalar(statement)


def list_incidents(database: Session, status: str | None, category: str | None, limit: int, offset: int):
    statement = select(Incident).options(selectinload(Incident.history)).order_by(Incident.created_at.desc())
    if status:
        statement = statement.where(Incident.status == status)
    if category:
        statement = statement.where(Incident.category == category)
    return list(database.scalars(statement.limit(limit).offset(offset)).all())


def update_status(database: Session, incident: Incident, data: StatusUpdate) -> Incident:
    previous_status = incident.status
    incident.status = data.status
    incident.history.append(IncidentHistory(old_status=previous_status, new_status=data.status, note=data.note, changed_by=data.changed_by))
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
