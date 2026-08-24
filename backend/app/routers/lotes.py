from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Lote, Piedra, EstadoPiedra, HistorialEstadoPiedra
from app.schemas.base import LoteCreate, LoteResponse, LoteDetailResponse
from app.utils.security import generate_qr_token

router = APIRouter(prefix="/lotes", tags=["lotes"])

@router.post("/", response_model=LoteResponse)
def create_lote(lote_data: LoteCreate, db: Session = Depends(get_db)):
    # Generar un ID para el lote (en prod sería auto-incrementado o con prefijo de año)
    year = datetime.now().year
    count = db.query(Lote).count() + 1
    lote_id = f"GSX-{year}-{count:03d}"
    
    lote_qr = generate_qr_token(lote_id)
    
    nuevo_lote = Lote(
        id=lote_id,
        cliente_id=lote_data.cliente_id,
        cantidad_piedras=lote_data.cantidad_piedras,
        peso_total_ct=lote_data.peso_total_ct,
        responsable_id=lote_data.responsable_id,
        qr_token=lote_qr
    )
    
    db.add(nuevo_lote)
    
    piedras_generadas = []
    
    for i in range(1, lote_data.cantidad_piedras + 1):
        piedra_id = f"{lote_id}-{i:03d}"
        piedra_qr = generate_qr_token(piedra_id)
        
        nueva_piedra = Piedra(
            id=piedra_id,
            lote_id=lote_id,
            estado_actual=EstadoPiedra.Ingreso,
            qr_token=piedra_qr
        )
        db.add(nueva_piedra)
        piedras_generadas.append({"id": piedra_id, "qr_token": piedra_qr})
        
    db.commit()
    
    return {
        "id": lote_id,
        "qr_token": lote_qr,
        "piedras_generadas": piedras_generadas
    }

@router.get("/{id}", response_model=LoteDetailResponse)
def get_lote(id: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    lote = db.query(Lote).filter(Lote.id == id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    piedras_detalles = []
    for piedra in lote.piedras:
        # Get the latest history for this stone
        historial = db.query(HistorialEstadoPiedra).filter(HistorialEstadoPiedra.piedra_id == piedra.id).order_by(HistorialEstadoPiedra.fecha_actualizacion.desc()).first()
        
        piedras_detalles.append({
            "id": piedra.id,
            "estado_actual": piedra.estado_actual,
            "peso_ct": historial.peso_ct if historial else None,
            "tallador_id": historial.tallador_id if historial else None,
            "plan_corte": historial.plan_corte if historial else None
        })

    return {
        "id": lote.id,
        "cliente_id": lote.cliente_id,
        "cantidad_piedras": lote.cantidad_piedras,
        "peso_total_ct": lote.peso_total_ct,
        "responsable_id": lote.responsable_id,
        "fecha_registro": lote.fecha_registro,
        "qr_token": lote.qr_token,
        "piedras": piedras_detalles
    }
