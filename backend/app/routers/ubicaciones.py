from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Ubicacion, RolPersona
from app.schemas.base import UbicacionCreate, UbicacionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/ubicaciones", tags=["ubicaciones"])

DEFAULT_UBICACIONES = [
    "Recepción",
    "Bóveda / Caja Fuerte",
    "Área de Desbaste",
    "Área de Talla",
    "Control de Calidad",
    "En manos del Cliente"
]

def seed_default_ubicaciones(db: Session):
    count = db.query(Ubicacion).count()
    if count == 0:
        for nombre in DEFAULT_UBICACIONES:
            db.add(Ubicacion(nombre=nombre))
        db.commit()

@router.get("/", response_model=list[UbicacionResponse])
def get_ubicaciones(db: Session = Depends(get_db)):
    # Auto-seed if empty
    seed_default_ubicaciones(db)
    return db.query(Ubicacion).order_by(Ubicacion.id.asc()).all()

@router.post("/", response_model=UbicacionResponse)
def create_ubicacion(
    data: UbicacionCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    if current_user.rol != RolPersona.Administrador:
        raise HTTPException(status_code=403, detail="Solo los administradores pueden registrar ubicaciones")
        
    existente = db.query(Ubicacion).filter(Ubicacion.nombre == data.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="Esta ubicación ya existe")
        
    nueva = Ubicacion(nombre=data.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva
