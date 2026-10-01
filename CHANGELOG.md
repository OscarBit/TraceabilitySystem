# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Direct QR URLs**: Added `VITE_APP_URL` environment variable support to generate direct, scannable links in the QR codes instead of raw JSON strings.
- **Pagination**: Added `skip` and `limit` parameters to the `personas` and `procesos` endpoints to prepare the API for high-volume data fetching.
- **Frontend Error Boundaries**: Implemented a global React Error Boundary to catch UI rendering crashes and prevent the app from displaying a blank white screen during unhandled exceptions.
- **Lote Creation Confirmation**: Added a frontend confirmation modal in the Lote reception flow to prevent data entry typos.
- **Lote Cancellation (Anular Lote)**: Implemented `POST /lotes/{id}/anular` allowing administrators to rescind invalid lots with a mandatory reason. Added corresponding frontend UI in `LoteViewer.jsx`.
- **Expanded Entity Data**: Added `cedula` and `telefono` fields to the `Persona` model. Administrators can now capture this data during operator/client registration in the frontend.
- **Dynamic Processing Stages**: Added `Proceso` model and `/procesos/` endpoints. The 'Plan de corte' dropdown now fetches dynamically from the backend, and administrators can define new processes via the UI.
- **Database Reset Script**: Created `backend/reset_db.py` to easily reset the database to a fresh state and automatically seed the initial `Administrador` account (`admin`/`admin123`). This script can be run inside the Docker container via `docker compose exec backend python reset_db.py`.
- **Nginx Reverse Proxy**: Configured an Nginx reverse proxy for `/api/` requests in the frontend container to securely bypass browser security port-scanning blocks.
- **Two-Factor Authentication (TOTP 2FA)**: Implemented full TOTP-based Two-Factor Authentication for the `Administrador` role using Google Authenticator / Authy. Includes QR code generation for initial setup (`2FA_SETUP_REQUIRED`) and code verification via `pyotp`.
- **Admin Configuration & Email**: Added an `email` column to the `Persona` model. The initial admin account can now be dynamically configured via environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_NOMBRE`) in an `.env` file instead of being hardcoded. Added `PUT /personas/{id}/email` to update the email.
### Fixed
- **Route Protection**: Implemented a `ProtectedRoute` component in `App.jsx` to prevent unauthenticated access to the main application routes (`/`, `/recepcion`, `/trazabilidad`, `/lotes`, `/dashboard`), redirecting users without a valid session to the `/login` page.
- **CORS Conflict**: Modified `allow_credentials` to `False` in `backend/app/main.py` to resolve conflicts when `allow_origins=["*"]` is active.
- **Registration Authorization**: Fixed the user creation flow (`Register.jsx`) by including the JWT `Authorization` header in the `fetch` request, allowing authenticated Administrators to correctly register new users.
- **Docker Compose**: Removed the deprecated `version` attribute from `docker-compose.yml`.

### Changed
- **Frontend Environment**: Updated `VITE_API_URL` to point to `/api` instead of `http://localhost:8000` to utilize the new Nginx reverse proxy.
