import os
from fastapi import FastAPI, Request, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="GemStoneX API", description="Sistema de Trazabilidad de Inventario")

# Configurar CORS para permitir solicitudes del frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # En producción cambiar por la URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_DEVICE_CODE = os.getenv("DEVICE_CODE", "dev_device_12345")

async def verify_device_code(x_device_code: str = Header(None)):
    if not x_device_code or x_device_code != VALID_DEVICE_CODE:
        raise HTTPException(
            status_code=403,
            detail="Dispositivo no autorizado. Falta o es incorrecto el header X-Device-Code."
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

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
    file_path = f"uploads/{unique_filename}"
    
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
