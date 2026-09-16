from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Persona
from app.schemas.base import PersonaCreate, PersonaResponse

router = APIRouter(prefix="/personas", tags=["personas"])

@router.post("/", response_model=PersonaResponse)
def create_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    db_persona = Persona(nombre=persona.nombre, rol=persona.rol, email=persona.email)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.get("/", response_model=list[PersonaResponse])
def get_personas(db: Session = Depends(get_db)):
    return db.query(Persona).all()

@router.get("/rol/{rol}", response_model=list[PersonaResponse])
def get_personas_by_rol(rol: str, db: Session = Depends(get_db)):
    return db.query(Persona).filter(Persona.rol == rol).all()

from pydantic import BaseModel
class EmailUpdate(BaseModel):
    email: str

@router.put("/{id}/email")
def update_persona_email(id: int, email_data: EmailUpdate, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    persona.email = email_data.email
    db.commit()
    return {"message": "Email actualizado correctamente"}
