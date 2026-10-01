# GemStoneX Memory

This file acts as the short-term and long-term memory for AI assistants working on the project. It tracks current architecture, recent changes, and immediate goals.

## 📍 Current State
The project is a fully functional MVP with containerized deployment.
- **Backend**: FastAPI REST API is stable. Implements strict lot/stone weight rules and 2FA for administrators. 
- **Frontend**: React SPA is functional. Implements deep linking for stones (`/trazabilidad/:id`) and lots (`/lotes/:id`).
- **Deployment**: `docker-compose.yml` is configured for production with Caddy (HTTPS) and Nginx (reverse proxy for `/api/`).
- **Testing**: A professional testing harness is in place.
  - Backend uses `pytest` and runs via GitHub Actions and a dedicated `docker-compose.test.yml`.
  - Frontend uses `vitest` and `@testing-library/react`.

## 🕒 Recent Milestones (October 2026)
- **CI/CD Harness**: Added GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically test frontend and backend on push/PR.
- **Test Isolation**: Fixed a bug where `pytest` modules (`test_api.py` and `test_auth.py`) were sharing an in-memory DB improperly by migrating DB setup to a global `conftest.py`.
- **Frontend Tests**: Initialized Vitest in the React frontend and added smoke tests for the router/authentication flow.
- **Admin & Database**: Implemented an automated `reset_db.py` script that seeds an admin account driven by `.env` variables (`ADMIN_USERNAME`, `ADMIN_EMAIL`, etc.).

## 🎯 Active Goals & Next Steps
- Expand the frontend Vitest suite to cover the Lote creation and Stone processing views.
- Ensure all new API endpoints are thoroughly unit-tested before merging.
- Continuously monitor the `app_gemstone-data` and `app_gemstone-uploads` Docker volumes to prevent accidental data loss in ephemeral deployments (e.g., PaaS platforms).
