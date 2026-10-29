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
- **Codebase Optimization & Cleanup (Phases 1-4)**:
  - **Asset & Boilerplate Cleanup**: Purged Tailwind v3 legacy config, boilerplate READMEs, unused assets, and orphaned local SQLite files.
  - **Frontend DRY & Centralized State**: Built Zustand `useAuthStore.js` and refactored `api.js` for auto-resolving relative routes, centralizing Bearer tokens, and unifying 401 logout handling.
  - **Dead Code Removal**: Removed unused `verify_device_code` and `X-Device-Code` legacy headers.
  - **Anti-Enumeration QR Capability Tokens**: Validated physical QR scan URLs via cryptographic HMAC `qr_token` for operator access, preventing brute-force sequential stone ID access.
  - **Custody Areas (`Ubicaciones`)**: Implemented `/ubicaciones/` router with auto-seeding of custody states and dynamic selector in `StoneViewer.jsx`.
  - **Documentation & Testing**: Full API documentation, ACID transaction details, and 18 passing backend pytest tests.

## 🎯 Active Goals & Next Steps
- Implement lot bulk reception by weight (granel / peso total en ct sin conteo previo de piedras).
- Add processes for spherical roughing (esferas), polishing, and drilling for jewelry fabrication.
- Expand the frontend Vitest suite to cover the Lote creation and Stone processing views.
- Continuously protect persistent volumes (`gemstone-data` and `gemstone-uploads`).
