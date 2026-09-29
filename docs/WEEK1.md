# Week 1 — MVP Completion

## Completed tasks

- [x] Created the GitHub repository and feature branch
- [x] Added FastAPI project structure
- [x] Implemented health endpoint
- [x] Implemented create, list and view incident endpoints
- [x] Implemented status changes and incident history
- [x] Added PostgreSQL-compatible data models
- [x] Built React student reporting form
- [x] Built dashboard with counters and status controls
- [x] Added Dockerfiles and Docker Compose
- [x] Added backend API tests
- [x] Added GitHub Actions CI
- [x] Documented setup and API use

## Demonstration steps

1. Run `docker compose up --build`.
2. Open `http://localhost:5173`.
3. Submit a Wi-Fi or laboratory incident.
4. Open the dashboard and verify that it appears.
5. Change its status to `in progress`, then `resolved`.
6. Open `http://localhost:8000/docs` to demonstrate the API.
7. Show the GitHub Actions test and build jobs.

## Week 1 definition of done

The Week 1 MVP is complete when the UI can submit an incident, the database persists it, the dashboard displays it, its status can change, and all automated checks pass.
