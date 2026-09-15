# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Database Reset Script**: Created `backend/reset_db.py` to easily reset the database to a fresh state and automatically seed the initial `Administrador` account (`admin`/`admin123`). This script can be run inside the Docker container via `docker compose exec backend python reset_db.py`.
- **Nginx Reverse Proxy**: Configured an Nginx reverse proxy for `/api/` requests in the frontend container to securely bypass browser security port-scanning blocks.
- **Two-Factor Authentication (2FA)**: Added simulated 2FA for users with the `Administrador` role. When logging in, a 6-digit code is generated and printed to the backend console.

### Fixed
- **CORS Conflict**: Modified `allow_credentials` to `False` in `backend/app/main.py` to resolve conflicts when `allow_origins=["*"]` is active.
- **Registration Authorization**: Fixed the user creation flow (`Register.jsx`) by including the JWT `Authorization` header in the `fetch` request, allowing authenticated Administrators to correctly register new users.
- **Docker Compose**: Removed the deprecated `version` attribute from `docker-compose.yml`.

### Changed
- **Frontend Environment**: Updated `VITE_API_URL` to point to `/api` instead of `http://localhost:8000` to utilize the new Nginx reverse proxy.
