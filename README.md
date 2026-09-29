# CampusPulse

CampusPulse is a campus issue-reporting and incident-management web application built for a B.Tech DevOps and Cloud Computing project.

## Week 1 MVP (with authentication)

- Student and admin authentication with role-based API access
- React student portal and admin dashboard
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
| POST | `/api/auth/register` | Register a new student |
| POST | `/api/auth/login/student` | Student login |
| POST | `/api/auth/login/admin` | Admin login |
| POST | `/api/incidents` | Student-only incident submission |
| GET | `/api/incidents` | Student sees own incidents, admin sees all |
| GET | `/api/incidents/{id}` | Student can access own incident only |
| PATCH | `/api/incidents/{id}/status` | Admin-only status update |
| GET | `/api/incidents/stats/summary` | Admin-only dashboard counters |

## Authentication and roles

- Access token: JWT bearer token from login endpoints.
- Roles:
  - `student`: can submit incidents and view only their own incidents/statuses.
  - `admin`: can view all incidents, dashboard summary, and update statuses.
- Authorization is enforced in backend APIs; student tokens receive `403` on admin-only endpoints.

## Local admin setup

Configure initial admin credentials in `.env` (or rely on compose defaults for local development):

```env
INITIAL_ADMIN_NAME=Campus Admin
INITIAL_ADMIN_EMAIL=admin@campuspulse.example
INITIAL_ADMIN_PASSWORD=change-this-local-admin-password
JWT_SECRET=replace-with-long-random-secret
```

On startup, the backend seeds the first admin user idempotently (safe to restart).

## Login flow in the UI

1. Open CampusPulse and choose **Student Login** or **Admin Login**.
2. New students register using **Create student account**.
3. Students sign in to access the student portal (submit + track own incidents).
4. Admins sign in to access the admin dashboard (all incidents + stats + status updates).
5. Expired/invalid sessions are cleared automatically and the user is redirected to login.

## Rebuild instructions

When auth/environment values change:

```bash
docker compose down
docker compose up --build
```

See `docs/WEEK1.md` for the completed checklist and demonstration procedure.
