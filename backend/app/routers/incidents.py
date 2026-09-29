from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..models import User
from ..schemas import IncidentCreate, IncidentOut, IncidentSummary, StatusUpdate
from ..security import require_role

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def submit_incident(
    payload: IncidentCreate,
    database: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return crud.create_incident(database, payload, reporter_name=current_user.full_name, reporter_email=current_user.email)


@router.get("", response_model=list[IncidentOut])
def get_incidents(
    incident_status: str | None = Query(default=None, alias="status"),
    category: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    database: Session = Depends(get_db),
    current_user: User = Depends(require_role("student", "admin")),
):
    reporter_email = None if current_user.role == "admin" else current_user.email
    return crud.list_incidents(database, incident_status, category, limit, offset, reporter_email=reporter_email)


@router.get("/stats/summary", response_model=IncidentSummary)
def get_summary(database: Session = Depends(get_db), _: User = Depends(require_role("admin"))):
    return crud.summary(database)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: str,
    database: Session = Depends(get_db),
    current_user: User = Depends(require_role("student", "admin")),
):
    incident = crud.get_incident(database, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if current_user.role == "student" and incident.reporter_email != current_user.email:
        raise HTTPException(status_code=403, detail="Forbidden")
    return incident


@router.patch("/{incident_id}/status", response_model=IncidentOut)
def change_status(
    incident_id: str,
    payload: StatusUpdate,
    database: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    incident = crud.get_incident(database, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return crud.update_status(database, incident, payload, changed_by=current_user.email)
