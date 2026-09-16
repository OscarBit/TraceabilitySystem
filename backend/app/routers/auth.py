from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Persona
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash, get_current_user
from pydantic import BaseModel
import random

class RegisterRequest(BaseModel):
    username: str
    password: str
    rol: str
    nombre: str

router = APIRouter(prefix="/auth", tags=["auth"])

from fastapi import Form
import random

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    two_factor_code: str = Form(None),
    db: Session = Depends(get_db)
):
    user = db.query(Persona).filter(Persona.username == form_data.username).first()
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.rol.value == "Administrador":
        import pyotp
        if not user.totp_secret:
            # Configuración inicial del 2FA
            secret = pyotp.random_base32()
            user.totp_secret = secret
            db.commit()
            
            uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.username, issuer_name="GemStoneX")
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="2FA_SETUP_REQUIRED",
                headers={"X-Provisioning-URI": uri}
            )

        if not two_factor_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="2FA_REQUIRED"
            )
        else:
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(two_factor_code):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Código 2FA incorrecto"
                )
            # El secreto TOTP no se borra, es permanente.

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "rol": user.rol.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "nombre": user.nombre, "rol": user.rol.value}}

@router.post("/register")
async def register_user(
    request: RegisterRequest, 
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_user)
):
    if current_user.rol.value != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de Administrador para registrar usuarios.")
        
    existing = db.query(Persona).filter(Persona.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pwd = get_password_hash(request.password)
    new_user = Persona(nombre=request.nombre, username=request.username, password_hash=hashed_pwd, rol=request.rol)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}
