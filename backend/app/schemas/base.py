from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models import RolPersona, EstadoPiedra

# Persona
class PersonaBase(BaseModel):
    nombre: str
    rol: RolPersona
    email: Optional[str] = None
    cedula: Optional[str] = None
    telefono: Optional[str] = None

class PersonaCreate(PersonaBase):
    pass

class PersonaResponse(PersonaBase):
    id: int
    class Config:
        from_attributes = True

# Proceso
class ProcesoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class ProcesoCreate(ProcesoBase):
    pass

class ProcesoResponse(ProcesoBase):
    id: int
    class Config:
        from_attributes = True

# Lote
class LoteCreate(BaseModel):
    cliente_id: int
    cantidad_piedras: int
    peso_total_ct: float
    responsable_id: int

class PiedraQRResponse(BaseModel):
    id: str
    qr_token: str

class LoteResponse(BaseModel):
    id: str
    qr_token: str
    piedras_generadas: List[PiedraQRResponse]

class PiedraListDetailResponse(BaseModel):
    id: str
    estado_actual: EstadoPiedra
    peso_ct: Optional[float] = None
    tallador_id: Optional[int] = None
    plan_corte: Optional[str] = None
    proceso_id: Optional[int] = None

    class Config:
        from_attributes = True

class LoteDetailResponse(BaseModel):
    id: str
    cliente_id: int
    cantidad_piedras: int
    peso_total_ct: float
    responsable_id: int
    fecha_registro: datetime
    qr_token: Optional[str] = None
    is_active: int = 1
    motivo_anulacion: Optional[str] = None
    piedras: List[PiedraListDetailResponse]

    class Config:
        from_attributes = True

# Piedra
class PiedraEstadoUpdate(BaseModel):
    estado: EstadoPiedra
    peso_ct: Optional[float] = None
    longitud_mm: Optional[float] = None
    ancho_mm: Optional[float] = None
    profundo_mm: Optional[float] = None
    plan_corte: Optional[str] = None
    proceso_id: Optional[int] = None
    ubicacion_id: Optional[int] = None
    tallador_id: Optional[int] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None

class PlanCorteUpdate(BaseModel):
    plan_corte: Optional[str] = None
    proceso_id: Optional[int] = None

class LoteAnular(BaseModel):
    nota: str

class HistorialEstadoResponse(BaseModel):
    id: int
    piedra_id: str
    estado_registrado: EstadoPiedra
    peso_ct: Optional[float]
    longitud_mm: Optional[float]
    ancho_mm: Optional[float]
    profundo_mm: Optional[float]
    plan_corte: Optional[str]
    proceso_id: Optional[int]
    ubicacion_id: Optional[int]
    tallador_id: Optional[int]
    foto_url: Optional[str]
    notas: Optional[str]
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True
