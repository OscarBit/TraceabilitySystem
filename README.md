# GemStoneX - Sistema de Trazabilidad de Inventario

GemStoneX es una aplicación web moderna diseñada para la gestión y trazabilidad integral del inventario de piedras preciosas. Permite realizar un seguimiento exhaustivo de cada piedra desde su recepción como parte de un lote, pasando por diversas fases de procesamiento (desbaste, tallado), hasta su entrega final, asegurando en todo momento la integridad y seguridad de la información.

## 🚀 Características Principales

- **Gestión de Lotes:** Registro de nuevos lotes asignados a clientes y operadores responsables, especificando peso total estimado y cantidad de piedras. Las reglas de negocio aseguran que el peso de las piedras individuales nunca sobrepase el límite del lote total.
- **Trazabilidad Individual Inmutable:** Seguimiento detallado del historial de cada piedra (Ingreso, Desbaste, Tallado, Entregado). El peso de la piedra no puede aumentar artificialmente entre etapas.
- **Deep Linking y Navegación Dinámica:** Utilización de React Router para compartir e incrustar enlaces directos a piedras (`/trazabilidad/:id`) y lotes (`/lotes/:id`).
- **Autenticación Segura (JWT):** Acceso restringido por roles mediante tokens JWT (JSON Web Tokens) con cifrado `bcrypt` para proteger la inyección de estados.
- **Generación Automática de Códigos QR (Navegación Directa):** Creación de códigos QR escaneables con el móvil que resuelven directamente a la URL de la piedra o el lote (ej. `http://localhost:5173/trazabilidad/GSX-1`), y que están protegidos estrictamente por autenticación.
- **Optimización de Evidencias:** Compresión y conversión al vuelo de imágenes al formato **WebP** usando Pillow, optimizando almacenamiento y tiempos de carga.
- **Dashboard Estadístico:** Analíticas en tiempo real que permiten supervisar la operación agrupada mediante consultas SQL agregadas para máximo rendimiento.

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, Vite, Tailwind CSS (v4), Zustand, React Router DOM.
- **Backend:** Python 3, FastAPI, SQLAlchemy, Pillow, Passlib/Bcrypt, python-jose (JWT).
- **Base de Datos:** SQLite (`gemstone.db`) integrado (100% migratorio a PostgreSQL/MySQL).
- **Pruebas:** Pytest y TestClient para cobertura unitaria.

## 📂 Estructura del Proyecto

El repositorio está dividido en dos aplicaciones:

```text
App/
├── backend/               # API y Lógica de Negocio
│   ├── app/               # Código fuente FastAPI
│   │   ├── routers/       # Endpoints (auth, dashboard, lotes, piedras, personas)
│   │   ├── schemas/       # Modelos Pydantic para validación y tipado
│   │   ├── models.py      # Modelos ORM SQLAlchemy
│   │   └── main.py        # Punto de entrada y configuraciones de FastAPI
│   ├── tests/             # Pruebas unitarias de las reglas de negocio (pytest)
│   ├── uploads/           # Almacenamiento optimizado de imágenes (WebP)
│   └── requirements.txt   # Dependencias de Python
└── frontend/              # Interfaz de Usuario
    ├── src/               
    │   ├── components/    # Componentes de UI (Login, DashboardViewer, LoteViewer, etc)
    │   ├── store/         # Hooks globales
    │   ├── utils/         # Validadores, fetchAuth (Interceptor JWT)
    │   └── App.jsx        # Enrutador principal
    ├── .env               # Variables de configuración del cliente (URL de API)
    └── package.json       
```

## ⚙️ Instalación y Ejecución Local

Sigue estos pasos para desplegar el entorno de desarrollo en tu máquina local.

### 1. Backend (FastAPI)

1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual e instala las dependencias:
   ```bash
   python -m venv venv
   
   # En Windows:
   .\venv\Scripts\activate
   # En macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload
   ```
   *El servidor de API estará disponible en `http://localhost:8000`.*

### 2. Frontend (React + Vite)

1. Abre una nueva terminal y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Asegúrate de que el archivo `.env` en la raíz del proyecto esté configurado (la configuración por defecto en `.env.example` funciona para entorno local).
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación web estará disponible en `http://localhost:5173`. Las credenciales por defecto son admin/admin123 (o créalas vía API).*

## 🧪 Pruebas Automatizadas

El backend incluye pruebas unitarias para proteger la integridad matemática de las transacciones (ej. que una piedra tallada no pese más que su estado original).
Para ejecutarlas, ingresa al backend con el entorno virtual activado y ejecuta:

```bash
pytest tests/
```

## 🔄 Inicialización y Gestión de la Base de Datos

### Protección y Seguridad de `reset_db.py`
El script `backend/reset_db.py` está blindado con tres niveles de protección contra pérdida accidental de datos:

1. **Bloqueo en Producción:** Si `ENVIRONMENT=production`, el script se cancela de inmediato y exige la variable explícita `ALLOW_RESET_IN_PRODUCTION=true`.
2. **Confirmación Obligatoria:**
   - En consola interactiva: exige al operador escribir exactamente `DESTRUIR_DATOS` para proceder.
   - En scripts/CI no interactivos: exige pasar el flag explícito `--force` (de lo contrario se cancela con error).
3. **Respaldo de Emergencia Automático Previo:** Aún si se usa `--force`, el script genera automáticamente un archivo `.pre_reset_<timestamp>.bak` de la base de datos actual en el volumen persistente antes de invocar `drop_all()`.
4. **Sembrado Completo:** Inicializa el usuario administrador desde `.env` y siembra automáticamente las 6 áreas de custodia iniciales (*Recepción, Bóveda, Desbaste, Talla, Calidad, Cliente*).

```bash
# Inicialización en frío interactiva:
docker compose exec backend python reset_db.py

# Inicialización forzada (por ejemplo en automatizaciones/CI):
docker compose exec backend python reset_db.py --force
```

### Configuración del Administrador Vía Variables de Entorno (.env)
El script crea el usuario inicial según las variables del archivo `.env` en la raíz del proyecto (por defecto: `admin/admin123`).

Ejemplo de `.env` unificado:
```env
# Backend Settings
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@empresa.com
ADMIN_NOMBRE=Administrador Principal

# Frontend Settings
VITE_API_URL=/api
VITE_APP_URL=http://localhost:5173

# Caddy / SSL Settings (:80 para local sin SSL, o tu dominio para producción)
CADDY_DOMAIN=:80
```

## 🛡️ Persistencia de Datos, Transacciones ACID y Respaldos

### Volúmenes Persistentes
Toda la información reside en dos volúmenes nombrados gestionados por Docker:
- `gemstone-data`: Contiene el archivo SQLite `/app/data/gemstone.db`.
- `gemstone-uploads`: Contiene todas las imágenes comprimidas en WebP en `/app/uploads/`.

Estos volúmenes sobreviven intactos a:
- Reinicios del contenedor (`docker compose restart`).
- Detención de contenedores (`docker compose down`).
- Reconstrucción de imágenes de frontend o backend (`docker compose up --build`).

*(Nota de seguridad: Nunca utilices `docker compose down -v`, ya que la bandera `-v` elimina los volúmenes).*

### Transacciones ACID
GemStoneX opera sobre SQLite bajo el estándar completo **ACID**:
- **Atomicidad:** Gestionada en bloques transaccionales de SQLAlchemy (`SessionLocal`). Si la creación de un lote o una de sus piedras falla, toda la transacción hace rollback sin dejar registros huérfanos.
- **Consistencia:** Las reglas matemáticas de conservación de pesos y validaciones de estados impiden escrituras inconsistentes.
- **Aislamiento:** SQLite aísla las transacciones a nivel de archivo (equivalente a `SERIALIZABLE`), evitando lecturas sucias (*dirty reads*).
- **Durabilidad:** Al llamar a `db.commit()`, SQLite ejecuta `fsync()` directo al disco persistente, asegurando que los datos resistan caídas imprevistas del sistema o cortes de energía.

### 📦 Scripts de Respaldo y Restauración en Caliente

> [!TIP]
> Para la guía paso a paso completa, automatización con el Programador de Tareas de Windows/Cron y procedimientos de recuperación ante desastres, consulta [BACKUP_AND_RECOVERY_GUIDE.md](BACKUP_AND_RECOVERY_GUIDE.md).

Se incluyen herramientas profesionales de respaldo y restauración tanto para Windows PowerShell como para Linux/VPS:

#### 1. Generar Respaldo en Caliente (Hot Backup):
Extrae una copia atómica de SQLite (usando la API nativa de backup en caliente sin detener el servidor ni bloquear talladores), respalda las imágenes WebP, calcula sumas de verificación SHA-256 en un manifiesto y aplica rotación automática de archivos antiguos.

- **En Windows (PowerShell):**
  ```powershell
  # Respaldo en carpeta:
  .\scripts\backup.ps1

  # Respaldo comprimido en archivo .zip (manteniendo los últimos 15 respaldos):
  .\scripts\backup.ps1 -Zip -RetentionCount 15
  ```

- **En Linux / VPS (Bash):**
  ```bash
  chmod +x scripts/*.sh
  ./scripts/backup.sh 10
  ```

#### 2. Restaurar un Respaldo:
Permite recuperar el sistema a un punto previo con creación automática de snapshot de emergencia previo y reinicio de conexiones:

- **En Windows (PowerShell):**
  ```powershell
  # Menú interactivo (muestra la lista de respaldos disponibles para seleccionar):
  .\scripts\restore.ps1

  # Restauración directa por ruta:
  .\scripts\restore.ps1 -BackupPath "backups\backup_20261029_114502.zip"
  ```

- **En Linux / VPS (Bash):**
  ```bash
  ./scripts/restore.sh backups/backup_20261029_114502.tar.gz
  ```

## 🧬 Evolución de Esquemas y Versionamiento en el Tiempo (Alembic)

El sistema está diseñado para incorporar nuevos modelos de negocio (por ejemplo: recepción de lotes a granel por peso en quilates, desbaste de esferas, brillado y perforación) sin perder datos existentes.

### Flujo de Modificación Segura:
1. **Respaldar:** Tomar una copia de seguridad rápida de `gemstone.db`.
2. **Actualizar Modelos:** Modificar o agregar campos en `backend/app/models.py` (usando `nullable=True` o valores por defecto para columnas nuevas, o creando nuevas tablas).
3. **Generar Migración:**
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "descripcion_del_cambio"
   ```
4. **Aplicar Migración en Caliente:**
   ```bash
   docker compose exec backend alembic upgrade head
   ```
   SQLite añadirá las columnas o tablas nuevas **sin borrar ni tocar las filas y datos históricos previamente registrados**.

## 🔗 Endpoints Principales (API)

- **Autenticación y Usuarios (`/auth`)**:
  - `POST /auth/token` - Autenticación con credenciales. Para rol `Administrador`, implementa flujo 2FA: si es el primer inicio retorna `403 (2FA_SETUP_REQUIRED)` con cabecera `X-Provisioning-Uri` (código QR); una vez configurado exige el parámetro `two_factor_code`.
  - `POST /auth/register` - Registro de nuevos usuarios y operadores con contraseña encriptada (restringido a `Administrador`).
- **Dashboard y Analíticas (`/dashboard`)**:
  - `GET /dashboard/stats` - Retorna los agregados estadísticos nativos (piedras por estado, tallador, y pesos totales) con filtros opcionales de fecha.
- **Lotes (`/lotes`)**:
  - `POST /lotes/` - Registra un lote nuevo, autogenerando secuencialmente sus piedras individuales y tokens QR.
  - `GET /lotes/{id}` - Obtiene el detalle completo del lote y la lista de sus piedras generadas.
  - `POST /lotes/{id}/anular` - Anula lógicamente un lote y sus piedras asociadas registrando el motivo de anulación (restringido a `Administrador`).
- **Piedras y Trazabilidad (`/piedras`)**:
  - `GET /piedras/{id}/historial` - Devuelve el historial cronológico inmutable de la piedra. Para usuarios con rol `Operador`, exige el parámetro de consulta `?token={qr_token}` generado con el código QR físico para evitar enumeración.
  - `POST /piedras/{id}/estado` - Inyecta un nuevo registro de estado (Desbaste, Tallado, Entregado), medidas, tallador responsable, área de custodia (`ubicacion_id`) y fotografías. Valida reglas matemáticas de conservación de pesos y el `qr_token` para operadores.
- **Áreas de Custodia y Ubicación (`/ubicaciones`)**:
  - `GET /ubicaciones/` - Lista todas las áreas de custodia física o departamental ("Recepción", "Bóveda / Caja Fuerte", "Área de Desbaste", "Área de Talla", "Control de Calidad", "En manos del Cliente"). Autopuebla las áreas estándar del taller si la base de datos está vacía.
  - `POST /ubicaciones/` - Registra una nueva área de custodia personalizada (restringido a `Administrador`).
- **Procesos Dinámicos de Taller (`/procesos`)**:
  - `GET /procesos/` - Lista los procesos y etapas disponibles de transformación en taller.
  - `POST /procesos/` - Crea un nuevo proceso de taller (restringido a `Administrador`).
  - `DELETE /procesos/{proceso_id}` - Elimina un proceso de taller (restringido a `Administrador`).
- **Personas y Actores (`/personas`)**:
  - `GET /personas/` - Lista general de actores registrados.
  - `POST /personas/` - Crea un nuevo actor (Cliente, Tallador, etc.).
  - `GET /personas/rol/{rol}` - Filtra actores por rol específico para poblar selectores dinámicos en la interfaz.
- **Archivos y Evidencias (`/upload`)**:
  - `POST /upload/image` - Procesa la fotografía con Pillow, la comprime y convierte a WebP y la almacena en el volumen persistente. Retorna la URL relativa.

## 🐳 Despliegue con Docker (Producción)

El proyecto está completamente contenerizado para un despliegue rápido y seguro. Al utilizar `docker-compose`, la aplicación es independiente de la plataforma y puedes alojarla donde prefieres. La configuración actual incluye un servidor **Caddy** que actúa como proxy inverso y gestiona automáticamente la provisión de certificados **HTTPS (SSL/TLS)** a través de Let's Encrypt.

### Opciones de Alojamiento Recomendadas:
1. **Servidor VPS (Recomendado):** Rentar un servidor Linux en **DigitalOcean**, **Hetzner**, o **AWS Lightsail** (aprox. $5 USD/mes). Solo necesitas clonar el repositorio y ejecutar Docker.
2. **Red Local (Privado):** Ejecutar Docker Desktop en una computadora física dentro del taller. Los operadores pueden acceder a través de la red Wi-Fi ingresando la IP local del servidor (ej. `http://192.168.1.50`).
3. **PaaS (Render/Railway):** Despliegue automatizado conectado a GitHub. *(Nota: Requiere configurar volúmenes persistentes adicionales para evitar la pérdida de la base de datos SQLite en reinicios efímeros).*

### Instrucciones de Arranque (Producción y HTTPS)
Asegúrate de tener Docker y Docker Compose instalados. Para desplegar de forma segura en un servidor con dominio:

1. **Configurar el DNS**: Asegúrate de que el registro (A record) de tu dominio (ej. `app.midominio.com`) apunte a la IP pública de tu servidor.
2. **Configurar el Entorno (.env)**: En tu archivo `.env` en la raíz del proyecto, define tu dominio para que Caddy obtenga el certificado SSL automáticamente y los códigos QR utilicen HTTPS:
   ```env
   CADDY_DOMAIN=app.midominio.com
   VITE_APP_URL=https://app.midominio.com
   ```
   *(Para entorno local en desarrollo, mantén `CADDY_DOMAIN=:80` para deshabilitar SSL y servir solo HTTP).*
4. **Desplegar**: En la raíz del proyecto, ejecuta:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```
Caddy se encargará automáticamente de obtener un certificado SSL válido y tu frontend estará disponible por HTTPS. La base de datos y las imágenes subidas están protegidas por volúmenes persistentes.

## 🔒 Seguridad Avanzada

- **Protección de Rutas en el Frontend**: Las rutas principales de la aplicación están protegidas mediante un componente `ProtectedRoute` que verifica la existencia de un token de sesión válido, redireccionando automáticamente a la pantalla de inicio de sesión (`/login`) en caso contrario.
- **Tokens Criptográficos Únicos en Códigos QR (Anti-Enumeración / Anti-Falsificación)**:
  - Cada piedra y lote posee un `qr_token` único generado criptográficamente mediante HMAC-SHA256 al momento de su creación.
  - Los códigos QR impresos codifican la URL física con dicho token: `https://.../piedra/{id}?token={qr_token}`.
  - Los usuarios con rol `Operador` son obligados por el backend a validar este token para consultar el historial o cambiar el estado de la piedra.
  - Esto impide que cualquier usuario o dispositivo ajeno pueda adivinar o asumir IDs secuenciales (ej. saber que existe `GSX-001-0001` y generar un QR arbitrario para `GSX-003-0001`). Sin el token criptográfico original impreso en el taller, el acceso es denegado con `403 Forbidden`.
  - El rol `Administrador` conserva acceso administrativo global sin restricciones de token desde su panel de control.
- **Doble Factor (TOTP 2FA)**: Al iniciar sesión en el frontend, el backend exigirá un código de seguridad de 6 dígitos al rol `Administrador`. La primera vez se mostrará un **Código QR** para vincular aplicaciones como Google Authenticator o Authy.
- **Roles y Privilegios (RBAC)**: Solo los usuarios con rol `Administrador` tienen permitido visualizar el Dashboard de métricas generales y registrar a otros miembros del equipo (`/register`). Las cuentas de los talladores (`Operador`) tienen un acceso enfocado únicamente en la trazabilidad.
