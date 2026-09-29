from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import IncidentCreate, IncidentOut, IncidentSummary, StatusUpdate

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def submit_incident(payload: IncidentCreate, database: Session = Depends(get_db)):
    return crud.create_incident(database, payload)


@router.get("", response_model=list[IncidentOut])
def get_incidents(
    incident_status: str | None = Query(default=None, alias="status"),
    category: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    database: Session = Depends(get_db),
):
    return crud.list_incidents(database, incident_status, category, limit, offset)


@router.get("/stats/summary", response_model=IncidentSummary)
def get_summary(database: Session = Depends(get_db)):
    return crud.summary(database)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str, database: Session = Depends(get_db)):
    incident = crud.get_incident(database, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}/status", response_model=IncidentOut)
def change_status(incident_id: str, payload: StatusUpdate, database: Session = Depends(get_db)):
    incident = crud.get_incident(database, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return crud.update_status(database, incident, payload)
