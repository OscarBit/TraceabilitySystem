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
3. Crea un archivo `.env` en la raíz de `frontend` (opcional, por defecto es local):
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_APP_URL=http://localhost:5173
   ```
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

## 🔄 Reinicio de la Base de Datos

Si necesitas limpiar la base de datos por completo y volver a crear el usuario Administrador, hemos provisto un script automatizado que puedes ejecutar dentro del contenedor Docker:

```bash
docker compose exec backend python reset_db.py
```

### Configuración del Administrador Vía Variables de Entorno (.env)

El script `reset_db.py` crea un usuario dinámicamente si configuras las variables en un archivo `.env` en la raíz del proyecto. Si no lo haces, usará las por defecto (`admin/admin123`).

Ejemplo de `.env`:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@empresa.com
ADMIN_NOMBRE=Administrador Principal
```

## 🔗 Endpoints Principales (API)

- **Auth**:
  - `POST /auth/token` - Intercambia usuario y contraseña por un token JWT Bearer.
- **Dashboard**:
  - `GET /dashboard/stats` - Retorna los agregados estadísticos nativos (piedras por estado, tallador, y pesos totales).
- **Lotes y Piedras**:
  - `POST /lotes/` - Registra un lote nuevo, autogenerando piedras.
  - `POST /piedras/{id}/estado` - Inyecta un nuevo registro de estado e imágenes en el historial. Valida reglas de peso límite.
  - `GET /piedras/{id}/historial` - Devuelve el historial inmutable cronológico.
- **Uploads**:
  - `POST /upload/image` - Procesa con Pillow la fotografía a WebP y la almacena.

## 🐳 Despliegue con Docker (Producción)

El proyecto está completamente contenerizado para un despliegue rápido y seguro. Al utilizar `docker-compose`, la aplicación es independiente de la plataforma y puedes alojarla donde prefieres.

### Opciones de Alojamiento Recomendadas:
1. **Servidor VPS (Recomendado):** Rentar un servidor Linux en **DigitalOcean**, **Hetzner**, o **AWS Lightsail** (aprox. $5 USD/mes). Solo necesitas clonar el repositorio y ejecutar Docker.
2. **Red Local (Privado):** Ejecutar Docker Desktop en una computadora física dentro del taller. Los operadores pueden acceder a través de la red Wi-Fi ingresando la IP local del servidor (ej. `http://192.168.1.50`).
3. **PaaS (Render/Railway):** Despliegue automatizado conectado a GitHub. *(Nota: Requiere configurar volúmenes persistentes adicionales para evitar la pérdida de la base de datos SQLite en reinicios efímeros).*

### Instrucciones de Arranque
Asegúrate de tener Docker y Docker Compose instalados. En la raíz del proyecto, ejecuta:
```bash
docker-compose up --build -d
```
El frontend estará disponible en el puerto 80 y el backend en el puerto 8000. La base de datos y las imágenes subidas están protegidas por volúmenes persistentes.

## 🔒 Seguridad Avanzada

- **Protección de Rutas en el Frontend**: Las rutas principales de la aplicación están protegidas mediante un componente `ProtectedRoute` que verifica la existencia de un token de sesión válido, redireccionando automáticamente a la pantalla de inicio de sesión (`/login`) en caso contrario.
- **Doble Factor (TOTP 2FA)**: Al iniciar sesión en el frontend, el backend exigirá un código de seguridad de 6 dígitos al rol `Administrador`. La primera vez se mostrará un **Código QR** para vincular aplicaciones como Google Authenticator o Authy.
- **Roles y Privilegios (RBAC)**: Solo los usuarios con rol `Administrador` tienen permitido visualizar el Dashboard de métricas generales y registrar a otros miembros del equipo (`/register`). Las cuentas de los talladores (`Operador`) tienen un acceso enfocado únicamente en la trazabilidad.
