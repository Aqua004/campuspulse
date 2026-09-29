import os

os.environ["DATABASE_URL"] = "sqlite:///./test_campuspulse.db"

from fastapi.testclient import TestClient
from app.main import app

sample = {
    "reporter_name": "Aditya Yadav",
    "reporter_email": "aditya@example.com",
    "title": "Wi-Fi unavailable in data science lab",
    "description": "The lab Wi-Fi has been unavailable since the morning class.",
    "category": "wifi",
    "location": "Block C, Lab 204",
    "priority": "high",
}


def test_health():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_incident_lifecycle():
    with TestClient(app) as client:
        created = client.post("/api/incidents", json=sample)
        assert created.status_code == 201
        incident_id = created.json()["id"]
        assert created.json()["status"] == "open"

        listed = client.get("/api/incidents")
        assert listed.status_code == 200
        assert any(item["id"] == incident_id for item in listed.json())

        updated = client.patch(
            f"/api/incidents/{incident_id}/status",
            json={"status": "in_progress", "note": "Assigned to network team", "changed_by": "admin"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "in_progress"
        assert len(updated.json()["history"]) == 2
