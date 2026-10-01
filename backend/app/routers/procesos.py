from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Proceso, RolPersona
from app.schemas.base import ProcesoCreate, ProcesoResponse
from app.auth import get_current_user

router = APIRouter(prefix="/procesos", tags=["procesos"])

@router.get("/", response_model=list[ProcesoResponse])
def get_procesos(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Proceso).all()

@router.post("/", response_model=ProcesoResponse)
def create_proceso(proceso: ProcesoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.rol != RolPersona.Administrador:
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear procesos")
        
    db_proceso = Proceso(nombre=proceso.nombre, descripcion=proceso.descripcion)
    db.add(db_proceso)
    db.commit()
    db.refresh(db_proceso)
    return db_proceso

@router.delete("/{proceso_id}")
def delete_proceso(proceso_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.rol != RolPersona.Administrador:
        raise HTTPException(status_code=403, detail="Solo los administradores pueden eliminar procesos")
        
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    if not proceso:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
        
    db.delete(proceso)
    db.commit()
    return {"message": "Proceso eliminado exitosamente"}
