from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Category = Literal["wifi", "electricity", "lab", "transport", "canteen", "cleanliness", "other"]
Priority = Literal["low", "medium", "high", "critical"]
Status = Literal["open", "acknowledged", "in_progress", "resolved", "closed"]


class IncidentCreate(BaseModel):
    reporter_name: str = Field(min_length=2, max_length=100)
    reporter_email: EmailStr
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=2000)
    category: Category
    location: str = Field(min_length=2, max_length=120)
    priority: Priority = "medium"


class StatusUpdate(BaseModel):
    status: Status
    note: str | None = Field(default=None, max_length=500)
    changed_by: str = Field(default="admin", min_length=2, max_length=100)


class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    old_status: str | None
    new_status: str
    note: str | None
    changed_by: str
    created_at: datetime


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    reporter_name: str
    reporter_email: str
    title: str
    description: str
    category: str
    location: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    history: list[HistoryOut] = []


class IncidentSummary(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    critical: int
