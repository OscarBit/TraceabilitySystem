# GemStoneX - Sistema de Trazabilidad de Inventario

GemStoneX es una aplicación web moderna diseñada para la gestión y trazabilidad integral del inventario de piedras preciosas. Permite realizar un seguimiento exhaustivo de cada piedra desde su recepción como parte de un lote, pasando por diversas fases de procesamiento (desbaste, tallado), hasta su entrega final, asegurando en todo momento la integridad y seguridad de la información.

## 🚀 Características Principales

- **Gestión de Lotes:** Registro de nuevos lotes asignados a clientes y operadores responsables, especificando peso total estimado y cantidad de piedras.
- **Generación Automática de Códigos QR:** Creación de identificadores únicos y códigos QR verificables criptográficamente para lotes y piedras individuales.
- **Trazabilidad Individual:** Seguimiento detallado del historial de cada piedra en 4 estados principales:
  - *Ingreso*
  - *Desbaste*
  - *Tallado*
  - *Entregado*
- **Registro Físico:** Almacenamiento del peso (ct), dimensiones (mm), plan de corte, evidencias fotográficas y notas en cada etapa.
- **Gestión de Actores:** Administración dinámica de Clientes, Operadores y Talladores integrados directamente en el flujo de trabajo.

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, Vite, Tailwind CSS (v4), Zustand (Gestión de estado ligero).
- **Backend:** Python 3, FastAPI, SQLAlchemy (ORM).
- **Base de Datos:** SQLite (`gemstone.db`) integrado localmente para desarrollo rápido (preparado para migrar a bases relacionales mayores en producción).
- **Seguridad:** Firmas HMAC-SHA256 para validación de autenticidad en los códigos generados.

## 📂 Estructura del Proyecto

El repositorio está dividido en dos aplicaciones principales independientes:

```text
App/
├── backend/               # API y Lógica de Negocio
│   ├── app/               # Código fuente FastAPI
│   │   ├── routers/       # Endpoints de la API (lotes, piedras, personas)
│   │   ├── schemas/       # Modelos Pydantic para validación y tipado
│   │   ├── models.py      # Modelos ORM SQLAlchemy
│   │   └── main.py        # Punto de entrada y configuraciones de FastAPI
│   ├── uploads/           # Almacenamiento local de evidencias fotográficas
│   ├── gemstone.db        # Base de datos local SQLite
│   └── requirements.txt   # Dependencias de Python
└── frontend/              # Interfaz de Usuario
    ├── src/               # Código fuente React
    │   ├── components/    # Componentes de UI (LoteViewer, StoneViewer, Selects dinámicos)
    │   ├── store/         # Hooks de estado global (Zustand)
    │   └── App.jsx        # Vistas principales y enrutador
    ├── public/            # Assets estáticos, logos, etc.
    └── package.json       # Dependencias de Node.js
```

## ⚙️ Instalación y Ejecución Local

Sigue estos pasos para desplegar el entorno de desarrollo en tu máquina local.

### 1. Backend (FastAPI)

1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual (recomendado) e instala las dependencias:
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
   *El servidor estará disponible en `http://localhost:8000`. Puedes consultar la documentación interactiva de la API en `http://localhost:8000/docs`.*

### 2. Frontend (React + Vite)

1. Abre una nueva terminal y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación web estará disponible en `http://localhost:5173`.*

## 🔗 Endpoints Principales (API)

A continuación, un resumen de la estructura de la API REST que consume la aplicación:

- **Personas**:
  - `POST /personas/` - Crea un nuevo actor (Cliente, Operador o Tallador).
  - `GET /personas/rol/{rol}` - Lista personas según el rol requerido.
- **Lotes**:
  - `POST /lotes/` - Registra un lote nuevo, genera las identificaciones de las piedras hijas y sus firmas QR criptográficas.
  - `GET /lotes/{id}` - Recupera la información global de un lote específico junto con la lista y estado de todas sus piedras.
- **Piedras**:
  - `POST /piedras/{id}/estado` - Inyecta un nuevo registro de estado (con medidas y fotografías) en el historial inmutable de la piedra.
  - `GET /piedras/{id}/historial` - Devuelve el historial completo de la piedra, ordenado cronológicamente, útil para la representación en la línea de tiempo.
  - `PATCH /piedras/{id}/plan_corte` - Actualiza rápidamente la forma de talla asignada a una piedra directamente desde la vista del lote.
- **Imágenes**:
  - `POST /upload/image` - Endpoint de subida multipart para alojar la fotografía física de la piedra en el almacenamiento del servidor.
