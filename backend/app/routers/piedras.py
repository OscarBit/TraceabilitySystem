from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Piedra, HistorialEstadoPiedra, EstadoPiedra
from app.schemas.base import PiedraEstadoUpdate, HistorialEstadoResponse, PlanCorteUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/piedras", tags=["piedras"])

@router.post("/{id}/estado", response_model=HistorialEstadoResponse)
def update_piedra_estado(id: str, data: PiedraEstadoUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    piedra = db.query(Piedra).filter(Piedra.id == id).first()
    if not piedra:
        raise HTTPException(status_code=404, detail="Piedra no encontrada")
        
    if piedra.estado_actual == EstadoPiedra.Entregado:
        # Business rule: If it's already "Entregado", we can only update notes
        if data.estado != EstadoPiedra.Entregado:
             raise HTTPException(status_code=403, detail="No se puede cambiar el estado de una piedra Entregada")
             
        # Check that physical measures are the same as the previous state
        last_hist = db.query(HistorialEstadoPiedra).filter(
            HistorialEstadoPiedra.piedra_id == id
        ).order_by(HistorialEstadoPiedra.fecha_actualizacion.desc()).first()
        
        if last_hist:
            if (data.peso_ct != last_hist.peso_ct or
                data.longitud_mm != last_hist.longitud_mm or
                data.ancho_mm != last_hist.ancho_mm or
                data.profundo_mm != last_hist.profundo_mm):
                raise HTTPException(status_code=403, detail="Las medidas físicas no pueden cambiar en estado Entregado")

    if data.peso_ct is not None:
        # Business rule: Weight in subsequent states cannot be greater than Ingreso weight
        if data.estado != EstadoPiedra.Ingreso:
            ingreso_hist = db.query(HistorialEstadoPiedra).filter(
                HistorialEstadoPiedra.piedra_id == id,
                HistorialEstadoPiedra.estado_registrado == EstadoPiedra.Ingreso
            ).first()
            if ingreso_hist and ingreso_hist.peso_ct is not None:
                if data.peso_ct > ingreso_hist.peso_ct:
                    raise HTTPException(status_code=400, detail=f"El peso no puede ser mayor al de Ingreso ({ingreso_hist.peso_ct} ct)")

        # Business rule: The total sum of stones' weights cannot exceed the Lot's total weight
        from app.models import Lote
        lote = db.query(Lote).filter(Lote.id == piedra.lote_id).first()
        if lote:
            suma_otros = 0
            for otra_piedra in lote.piedras:
                if otra_piedra.id != id:
                    latest_hist = db.query(HistorialEstadoPiedra).filter(
                        HistorialEstadoPiedra.piedra_id == otra_piedra.id
                    ).order_by(HistorialEstadoPiedra.fecha_actualizacion.desc()).first()
                    if latest_hist and latest_hist.peso_ct is not None:
                        suma_otros += latest_hist.peso_ct
            
            if (suma_otros + data.peso_ct) > lote.peso_total_ct:
                raise HTTPException(status_code=400, detail=f"La suma de los pesos ({suma_otros + data.peso_ct} ct) excede el peso total del lote ({lote.peso_total_ct} ct)")

    # Business rule: "Desbaste" inherits "plan_corte" if not provided
    plan_corte = data.plan_corte
    if data.estado == EstadoPiedra.Desbaste and not plan_corte:
        ingreso_hist = db.query(HistorialEstadoPiedra).filter(
            HistorialEstadoPiedra.piedra_id == id,
            HistorialEstadoPiedra.estado_registrado == EstadoPiedra.Ingreso
        ).first()
        if ingreso_hist:
            plan_corte = ingreso_hist.plan_corte
            
    # Update actual status in Piedra
    piedra.estado_actual = data.estado
    
    # Create new history record
    nuevo_historial = HistorialEstadoPiedra(
        piedra_id=id,
        estado_registrado=data.estado,
        peso_ct=data.peso_ct,
        longitud_mm=data.longitud_mm,
        ancho_mm=data.ancho_mm,
        profundo_mm=data.profundo_mm,
        plan_corte=plan_corte,
        ubicacion_id=data.ubicacion_id,
        tallador_id=data.tallador_id,
        foto_url=data.foto_url,
        notas=data.notas
    )
    
    db.add(nuevo_historial)
    db.commit()
    db.refresh(nuevo_historial)
    
    return nuevo_historial

@router.get("/{id}/historial", response_model=list[HistorialEstadoResponse])
def get_piedra_historial(id: str, db: Session = Depends(get_db)):
    piedra = db.query(Piedra).filter(Piedra.id == id).first()
    if not piedra:
        raise HTTPException(status_code=404, detail="Piedra no encontrada")

    historial = db.query(HistorialEstadoPiedra).filter(
        HistorialEstadoPiedra.piedra_id == id
    ).order_by(HistorialEstadoPiedra.fecha_actualizacion.asc()).all()
        
    return historial

@router.patch("/{id}/plan_corte")
def update_plan_corte(id: str, data: PlanCorteUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    piedra = db.query(Piedra).filter(Piedra.id == id).first()
    if not piedra:
        raise HTTPException(status_code=404, detail="Piedra no encontrada")
        
    last_hist = db.query(HistorialEstadoPiedra).filter(
        HistorialEstadoPiedra.piedra_id == id
    ).order_by(HistorialEstadoPiedra.fecha_actualizacion.desc()).first()

    if last_hist:
        # Business rule: If it's already "Entregado", we cannot change the plan de corte
        if piedra.estado_actual == EstadoPiedra.Entregado:
            raise HTTPException(status_code=403, detail="No se puede cambiar el plan de corte de una piedra Entregada")
            
        # Update existing last history record
        last_hist.plan_corte = data.plan_corte
        db.commit()
    else:
        # Create a new history record for 'Ingreso' state with this plan_corte
        nuevo_historial = HistorialEstadoPiedra(
            piedra_id=id,
            estado_registrado=EstadoPiedra.Ingreso,
            plan_corte=data.plan_corte
        )
        db.add(nuevo_historial)
        db.commit()
        
    return {"message": "Plan de corte actualizado", "plan_corte": data.plan_corte}
