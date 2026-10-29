# GemStoneX Migration Guide

This guide details the steps required to update a production instance of GemStoneX that is already running an older version of the codebase. It covers updating the backend, frontend, and safely executing Alembic schema migrations without disrupting existing data.

## Prerequisites
Before starting, ensure that you have access to the server terminal where the `docker-compose.yml` file is located, and that you have backed up the database volume.

## 1. Pull Latest Changes
Navigate to the project root and pull the latest code:
```bash
git fetch --all
git pull origin main
```

## 2. Stop the Application
It's important to stop the application gracefully so that no ongoing transactions are interrupted during the schema migration.
```bash
docker compose down
```

## 3. Rebuild Containers
Since the backend or frontend dependencies may have changed, rebuild the container images to ensure they incorporate the latest packages.
```bash
docker compose build --no-cache
```

## 4. Run Database Schema Migrations (Alembic)
The latest version introduces new models (`Proceso`) and columns (`cedula`, `telefono` in `Persona`, and `proceso_id` in `HistorialEstadoPiedra`).
These changes must be applied to your existing SQLite database using Alembic.

Run the migration script in a temporary container:
```bash
docker compose run --rm backend alembic upgrade head
```

> **Note on Existing Data:** 
> - Existing `Persona` records will have `null` for `cedula` and `telefono`, as these fields are optional at the DB level.
> - Existing `HistorialEstadoPiedra` records will retain their text-based `plan_corte` string and will have a `null` `proceso_id`. The application code safely handles this fallback seamlessly.

## 5. Restart the Application
Once migrations have successfully completed, bring the application back online:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 6. Verification
Log in to the application as an `Administrador` and verify the following:
1. Try creating a new Lote to trigger the **Confirmation Modal**.
2. Navigate to a stone's timeline and verify the **Proceso** dropdown fetches properly and allows you to create new processes.
3. Attempt to register a new user and ensure the **Cédula** and **Teléfono** inputs are visible.
