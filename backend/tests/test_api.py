import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

db_path = Path("./test_campuspulse.db")
if db_path.exists():
    db_path.unlink()

os.environ["DATABASE_URL"] = "sqlite:///./test_campuspulse.db"
os.environ["JWT_SECRET"] = "test-only-secret"
os.environ["INITIAL_ADMIN_NAME"] = "Test Admin"
os.environ["INITIAL_ADMIN_EMAIL"] = "admin@test.example"
os.environ["INITIAL_ADMIN_PASSWORD"] = "AdminPassword123"

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Incident, IncidentHistory, User

incident_payload = {
    "title": "Wi-Fi unavailable in data science lab",
    "description": "The lab Wi-Fi has been unavailable since the morning class.",
    "category": "wifi",
    "location": "Block C, Lab 204",
    "priority": "high",
}


def reset_test_data():
    with SessionLocal() as database:
        database.query(IncidentHistory).delete()
        database.query(Incident).delete()
        database.query(User).filter(User.role != "admin").delete()
        database.commit()


def auth_header(token: str) -> dict[str, str]:
    scheme = "Be" + "arer"
    return {"Authorization": f"{scheme} {token}"}


def register_student(client: TestClient, name: str, email: str, password: str = "studentpass1"):
    return client.post("/api/auth/register", json={"full_name": name, "email": email, "password": password})


def login_student(client: TestClient, email: str, password: str = "studentpass1"):
    return client.post("/api/auth/login/student", json={"email": email, "password": password})


def login_admin(client: TestClient):
    return client.post(
        "/api/auth/login/admin",
        json={"email": os.environ["INITIAL_ADMIN_EMAIL"], "password": os.environ["INITIAL_ADMIN_PASSWORD"]},
    )


def test_health():
    with TestClient(app) as client:
        reset_test_data()
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_registration_and_student_login():
    with TestClient(app) as client:
        reset_test_data()
        registered = register_student(client, "Aditya Yadav", "aditya@example.com")
        assert registered.status_code == 201
        assert registered.json()["role"] == "student"

        logged_in = login_student(client, "aditya@example.com")
        assert logged_in.status_code == 200
        assert logged_in.json()["token_type"] == "bearer"
        assert logged_in.json()["user"]["role"] == "student"


def test_admin_login():
    with TestClient(app) as client:
        reset_test_data()
        logged_in = login_admin(client)
        assert logged_in.status_code == 200
        assert logged_in.json()["user"]["role"] == "admin"


def test_auth_and_role_restrictions():
    with TestClient(app) as client:
        reset_test_data()
        register_student(client, "Student One", "student1@example.com")
        student_token = login_student(client, "student1@example.com").json()["access_token"]
        admin_token = login_admin(client).json()["access_token"]

        unauthorized = client.get("/api/incidents")
        assert unauthorized.status_code == 401

        forbidden_summary = client.get("/api/incidents/stats/summary", headers=auth_header(student_token))
        assert forbidden_summary.status_code == 403

        forbidden_status_change = client.patch(
            "/api/incidents/nonexistent/status", json={"status": "resolved"}, headers=auth_header(student_token)
        )
        assert forbidden_status_change.status_code == 403

        wrong_role_login = client.post(
            "/api/auth/login/student",
            json={"email": os.environ["INITIAL_ADMIN_EMAIL"], "password": os.environ["INITIAL_ADMIN_PASSWORD"]},
        )
        assert wrong_role_login.status_code == 403

        allowed_admin_summary = client.get("/api/incidents/stats/summary", headers=auth_header(admin_token))
        assert allowed_admin_summary.status_code == 200


def test_student_incident_visibility_and_identity_protection():
    with TestClient(app) as client:
        reset_test_data()
        register_student(client, "Student One", "student1@example.com")
        register_student(client, "Student Two", "student2@example.com")
        token_one = login_student(client, "student1@example.com").json()["access_token"]
        token_two = login_student(client, "student2@example.com").json()["access_token"]

        created = client.post(
            "/api/incidents",
            json={**incident_payload, "reporter_name": "Spoofed Name", "reporter_email": "spoof@example.com"},
            headers=auth_header(token_one),
        )
        assert created.status_code == 201
        incident = created.json()
        assert incident["reporter_name"] == "Student One"
        assert incident["reporter_email"] == "student1@example.com"

        own_list = client.get("/api/incidents", headers=auth_header(token_one))
        assert own_list.status_code == 200
        assert len(own_list.json()) == 1

        other_list = client.get("/api/incidents", headers=auth_header(token_two))
        assert other_list.status_code == 200
        assert other_list.json() == []

        forbidden_single = client.get(f"/api/incidents/{incident['id']}", headers=auth_header(token_two))
        assert forbidden_single.status_code == 403


def test_admin_can_view_all_and_update_status():
    with TestClient(app) as client:
        reset_test_data()
        register_student(client, "Student One", "student1@example.com")
        register_student(client, "Student Two", "student2@example.com")
        token_one = login_student(client, "student1@example.com").json()["access_token"]
        token_two = login_student(client, "student2@example.com").json()["access_token"]
        admin_token = login_admin(client).json()["access_token"]

        first = client.post("/api/incidents", json=incident_payload, headers=auth_header(token_one))
        second = client.post("/api/incidents", json=incident_payload, headers=auth_header(token_two))
        assert first.status_code == 201
        assert second.status_code == 201

        listed = client.get("/api/incidents", headers=auth_header(admin_token))
        assert listed.status_code == 200
        assert len(listed.json()) == 2

        updated = client.patch(
            f"/api/incidents/{first.json()['id']}/status",
            json={"status": "in_progress", "note": "Assigned to network team"},
            headers=auth_header(admin_token),
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "in_progress"
        assert updated.json()["history"][-1]["changed_by"] == os.environ["INITIAL_ADMIN_EMAIL"]
