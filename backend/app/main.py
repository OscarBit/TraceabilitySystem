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

from app.routers import personas, lotes, piedras
from fastapi.staticfiles import StaticFiles
from fastapi import UploadFile, File
import uuid
import shutil
import os

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(personas.router, dependencies=[Depends(verify_device_code)])
app.include_router(lotes.router, dependencies=[Depends(verify_device_code)])
app.include_router(piedras.router, dependencies=[Depends(verify_device_code)])

@app.post("/upload/image", dependencies=[Depends(verify_device_code)])
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/uploads/{unique_filename}"}

@app.get("/")
def read_root():
    return {"message": "GemStoneX API funcionando."}
