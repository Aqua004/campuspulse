# CampusPulse

CampusPulse is a campus issue-reporting and incident-management web application built for a B.Tech DevOps and Cloud Computing project.

## Week 1 MVP

- React student issue-submission form
- Incident dashboard with summary cards and status controls
- FastAPI REST API with validation and Swagger documentation
- PostgreSQL database schema and incident status history
- Docker Compose local development environment
- Pytest API tests and GitHub Actions continuous integration

## Architecture

```text
React UI :5173  --->  FastAPI :8000  --->  PostgreSQL :5432
```

## Start the complete stack

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Web application: http://localhost:5173
- API documentation: http://localhost:8000/docs
- Health endpoint: http://localhost:8000/api/health

## Run the checks manually

```bash
cd backend
pip install -r requirements.txt
pytest -q

cd ../frontend
npm install
npm run build
```

The backend defaults to SQLite when run without Docker. Docker Compose supplies PostgreSQL through `DATABASE_URL`.

## Main endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database health |
| POST | `/api/incidents` | Submit an incident |
| GET | `/api/incidents` | List and filter incidents |
| GET | `/api/incidents/{id}` | View one incident |
| PATCH | `/api/incidents/{id}/status` | Update status and history |
| GET | `/api/incidents/stats/summary` | Dashboard counters |

See `docs/WEEK1.md` for the completed checklist and demonstration procedure.
