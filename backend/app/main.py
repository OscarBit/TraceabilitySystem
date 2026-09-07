import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="GemstoneX Trace API", description="Sistema de Trazabilidad de Inventario")

# En produccion el SPA y el API comparten origen (nginx enruta /api al backend),
# asi que no hace falta CORS. Solo el servidor de desarrollo de Vite lo necesita.
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]
if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from app.routers import personas, lotes, piedras, dashboard, auth
from app.auth import get_current_user
from fastapi.staticfiles import StaticFiles
from fastapi import UploadFile, File
import uuid
import shutil
import os
from PIL import Image
import io

# Mount uploads directory. In the container this points at /app/data/uploads,
# which is on the mounted volume, so photos survive image rebuilds.
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(personas.router, dependencies=[Depends(get_current_user)])
app.include_router(lotes.router, dependencies=[Depends(get_current_user)])
app.include_router(piedras.router, dependencies=[Depends(get_current_user)])
app.include_router(dashboard.router, dependencies=[Depends(get_current_user)])

@app.post("/upload/image", dependencies=[Depends(get_current_user)])
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    unique_filename = f"{uuid.uuid4()}.webp"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    contents = await file.read()
    
    try:
        img = Image.open(io.BytesIO(contents))
        
        if img.width > 1024:
            ratio = 1024.0 / img.width
            new_height = int(img.height * ratio)
            img = img.resize((1024, new_height), Image.Resampling.LANCZOS)
            
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        img.save(file_path, "WEBP", quality=80)
    except Exception as e:
        print(f"Image processing error: {e}")
        raise HTTPException(status_code=500, detail="Error processing image")
        
    # Devuelve la URL relativa
    return {"url": f"/uploads/{unique_filename}"}

@app.get("/")
def read_root():
    return {"message": "GemStoneX API funcionando."}
