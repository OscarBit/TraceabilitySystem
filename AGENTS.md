# GemStoneX: AI Agent Guidelines

Welcome to the GemStoneX project! This document outlines the core business domain, architectural rules, and security model. Any AI agent (Cursor, Copilot, etc.) contributing to this repository must strictly adhere to these principles.

## 💎 Business Domain: Traceability System

GemStoneX is a comprehensive web application for managing the inventory and traceability of precious stones. 

### Core Concepts
1. **Lotes (Lots)**: Collections of stones registered to a specific client and operator. A Lote has a predefined total weight (`peso_total_ct`) and a specific number of stones (`cantidad_piedras`).
2. **Piedras (Stones)**: Individual stones generated from a Lote. They go through an immutable lifecycle.

### Inviolable Business Rules
- **Lote Weight Limits**: The sum of the initial weights (`Ingreso`) of all `Piedras` in a `Lote` **CANNOT** exceed the total weight (`peso_total_ct`) of the `Lote`.
- **Stone Weight Conservation**: A `Piedra`'s weight can never artificially increase. When moving between processing phases (e.g., from `Ingreso` to `Desbaste`, or `Desbaste` to `Tallado`), the new weight must be **less than or equal to** its previous weight.
- **Immutability**: Historical status records (`HistorialEstadoPiedra`) for a stone are immutable. We append new states rather than modifying past states to ensure full traceability.

## 🔒 Security Model

### Authentication & Authorization
- **JWT (JSON Web Tokens)**: All protected routes require a Bearer token.
- **RBAC (Role-Based Access Control)**:
  - **Administrador**: Has full access. Can view dashboard statistics, register new users, and configure the system.
  - **Operador**: Restricted access. Can only update stone tracking (Trazabilidad).
- **Two-Factor Authentication (TOTP 2FA)**: Required for the `Administrador` role. Implemented using `pyotp`. Do not bypass 2FA checks in the backend auth flow.

### Infrastructure & Deployments
- **Docker Compose**: The project uses containerization. The main deployment relies on `docker-compose.yml`. 
- **Volumes**: `app_gemstone-data` (SQLite DB) and `app_gemstone-uploads` (WebP Images) are critical persistent volumes. **NEVER** instruct the deletion or destructive recreation of these volumes.
- **Nginx & Caddy**: Uses Caddy for HTTPS and Nginx as a reverse proxy mapping `/api/` to the FastAPI backend.

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Zustand, React Router DOM.
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy (SQLite), Pytest.
- **Images**: Pillow is used to compress and convert all uploaded images to **WebP** on the fly.
