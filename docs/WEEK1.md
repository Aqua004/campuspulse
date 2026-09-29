# Week 1 — MVP Completion

## Completed tasks

- [x] Created the GitHub repository and feature branch
- [x] Added FastAPI project structure
- [x] Implemented health endpoint
- [x] Implemented create, list and view incident endpoints
- [x] Implemented status changes and incident history
- [x] Added student/admin auth with JWT and role enforcement
- [x] Added student registration and seeded local admin from environment variables
- [x] Added PostgreSQL-compatible data models
- [x] Built separate student/admin login screens and role-specific portals
- [x] Added Dockerfiles and Docker Compose
- [x] Added backend API tests
- [x] Added GitHub Actions CI
- [x] Documented setup and API use

## Demonstration steps

1. Run `docker compose up --build`.
2. Open `http://localhost:5173`.
3. Register a student account and log in through **Student Login**.
4. Submit a Wi-Fi or laboratory incident from the student portal.
5. Log out, then log in through **Admin Login** with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`.
6. Open the admin dashboard, verify all incidents, and change status to `in_progress`, then `resolved`.
7. Open `http://localhost:8000/docs` to demonstrate role-restricted API behavior (`401/403`).
8. Show the GitHub Actions test and build jobs.

## Week 1 definition of done

The Week 1 MVP is complete when students can register/login and submit incidents, students only see their own incidents, admins can manage all incidents and statuses, and all automated checks pass.
