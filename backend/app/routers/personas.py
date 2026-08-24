from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Persona
from app.schemas.base import PersonaCreate, PersonaResponse

router = APIRouter(prefix="/personas", tags=["personas"])

@router.post("/", response_model=PersonaResponse)
def create_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    db_persona = Persona(nombre=persona.nombre, rol=persona.rol)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.get("/", response_model=list[PersonaResponse])
def get_personas(db: Session = Depends(get_db)):
    return db.query(Persona).all()
