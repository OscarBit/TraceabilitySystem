# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Áreas de Custodia / Ubicaciones**: Nuevo router `backend/app/routers/ubicaciones.py` (`/ubicaciones/`) con autosembrado de etapas departamentales y de custodia (*Recepción*, *Bóveda / Caja Fuerte*, *Área de Desbaste*, *Área de Talla*, *Control de Calidad*, *En manos del Cliente*).
- **Selector de Custodia en Frontend**: Selector dinámico de área de custodia en `StoneViewer.jsx`, con herencia automática entre estados y badge histórico.
- **Tokens Criptográficos en Códigos QR (Anti-Enumeración / Anti-Falsificación)**:
  - Generación de `qr_token` vía HMAC-SHA256 en lotes y piedras.
  - Codificación física en URLs de códigos QR (`/piedra/{id}?token={qr_token}`).
  - Validación obligatoria de token en `GET /piedras/{id}/historial` y `POST /piedras/{id}/estado` para usuarios con rol `Operador`, bloqueando accesos por adivinación o predicción secuencial (`GSX-...`).
  - Acceso administrativo global para `Administrador` desde el dashboard.
- **Store Centralizado de Autenticación (Zustand)**: Creación de `frontend/src/store/useAuthStore.js` para manejo reactivo y centralizado de credenciales, roles y sincronización de sesión.
- **Suite de Pruebas Automatizadas**:
  - `backend/tests/test_ubicaciones.py`: pruebas para listado, autosembrado y permisos RBAC en ubicaciones.
  - `test_qr_token_protection` en `test_api.py`: verificación de bloqueo a operadores sin token o con token inválido y autorización a administradores. (18/18 pruebas aprobadas).
- **Scripts de Respaldo y Restauración en Caliente**:
  - `scripts/backup.ps1` y `scripts/backup.sh`: Respaldos en caliente de SQLite con API nativa, copia de fotografías WebP, cálculo de sumas de verificación SHA-256 en manifiesto, compresión ZIP/tar opcional y política de rotación automática (mantener los últimos N respaldos).
  - `scripts/restore.ps1` y `scripts/restore.sh`: Restauración interactiva con snapshot preventivo automático antes de sobrescribir y reconexión limpia de SQLAlchemy.
  - `backend/backup.py`: Utilidad nativa de hot backup de SQLite dentro del contenedor sin bloquear lecturas ni escrituras.
- **Protección Triple en `reset_db.py`**:
  - Bloqueo en entornos de producción (`ENVIRONMENT=production`).
  - Confirmación obligatoria interactiva (`DESTRUIR_DATOS`) o flag explícito `--force` en CI/scripts.
  - Respaldo de emergencia previo (`.pre_reset_<timestamp>.bak`) antes de ejecutar `drop_all()`.
  - Sembrado completo de usuario Administrador y de las 6 áreas de custodia iniciales.
- **Guía de Respaldos y Recuperación**: Creación de `BACKUP_AND_RECOVERY_GUIDE.md` con instrucciones detalladas, programación de tareas desatendidas (Windows Task Scheduler y Linux Cron) y pasos de recuperación ante desastres.
- **Soporte de Docker Compose para Producción**: Inclusión de `docker-compose.prod.yml` y unificación de `.env.example` en la raíz.

### Changed
- **Cliente API Frontend (DRY)**: Refactorización de `frontend/src/utils/api.js` para autorresolver endpoints relativos (`/lotes/`, `/procesos/`, `/ubicaciones/`) con prefijo `/api` o `VITE_API_URL`, inyección automática de cabeceras `Authorization: Bearer` y cierre de sesión sincronizado ante códigos 401.
- **Refactorización de Componentes de Frontend**:
  - `Navbar.jsx`: Eliminación de decodificación manual `atob()` de JWT; uso reactivo de `useAuthStore`.
  - `Login.jsx`, `Register.jsx`, `LoteViewer.jsx`, `StoneViewer.jsx`, `DynamicActorSelect.jsx`, `DashboardViewer.jsx`: Migración a `fetchAuth` con rutas relativas estandarizadas.
  - `App.jsx`: `ProtectedRoute` simplificado mediante `useAuthStore`.
- **Configuración de Caddy**: Adaptado para soportar tanto red local/LAN por HTTP (`CADDY_DOMAIN=:80`) como producción con certificados SSL automáticos.
- **Alembic**: Actualización de `backend/alembic/env.py` y `backend/alembic.ini` para detección precisa de metadata y evolución de esquemas en SQLite.

### Removed
- **Código Muerto `verify_device_code`**: Eliminada la función y dependencias en `backend/app/main.py` y su inyección de cabeceras `X-Device-Code` en el frontend.
- **Archivos Obsoletos y Redundantes**:
  - `frontend/tailwind.config.js`: Eliminado (Tailwind v4 utiliza `@theme` nativo en `src/index.css`).
  - `frontend/src/assets/`: Eliminados archivos no utilizados (`hero.png`, `react.svg`, `vite.svg`).
  - `frontend/README.md`: Eliminado boilerplate de Vite.
  - `backend/gemstone.db`: Eliminada base de datos local huérfana en favor de volúmenes Docker persistentes.

### Fixed
- **Sincronización de Base de Datos y Modelos**: Alineadas las columnas `cedula`, `telefono` y `email` en la tabla `personas` para resolver error 500 en inicio de sesión.
- **URL de Imágenes en Producción**: Corregida la concatenación de `VITE_API_URL` en `StoneViewer.jsx` para evitar rutas mal formadas (`"undefined/uploads/..."`).
- **Advertencias de Docker Compose**: Retirado el atributo obsoleto `version: '3.8'` de `docker-compose.yml`.
