from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from collections import defaultdict
from app.database import get_db
from app.models import Piedra, Persona, EstadoPiedra, HistorialEstadoPiedra
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    estado: Optional[str] = None,
    lote_id: Optional[str] = None,
    tallador_id: Optional[int] = None,
    plan_corte: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Persona = Depends(get_current_user)
):
    if current_user.rol.value != "Administrador":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de Administrador.")
    # Get all talladores for mapping names
    talladores = db.query(Persona).filter(Persona.rol == "Tallador").all()
    tallador_map = {t.id: t.nombre for t in talladores}
    
    # 1. Subquery to find the LATEST history record ID for each stone
    latest_hist_ids = db.query(func.max(HistorialEstadoPiedra.id)).group_by(HistorialEstadoPiedra.piedra_id)
    
    # 2. Base query joining Piedra with its latest HistorialEstadoPiedra
    base_query = db.query(
        Piedra.id.label("piedra_id"),
        Piedra.estado_actual.label("estado_actual"),
        HistorialEstadoPiedra.peso_ct.label("peso_ct"),
        HistorialEstadoPiedra.tallador_id.label("tallador_id"),
        HistorialEstadoPiedra.plan_corte.label("plan_corte")
    ).outerjoin(
        HistorialEstadoPiedra,
        (Piedra.id == HistorialEstadoPiedra.piedra_id) & 
        (HistorialEstadoPiedra.id.in_(latest_hist_ids))
    )
    
    # 3. Apply Filters
    if estado:
        base_query = base_query.filter(Piedra.estado_actual == estado)
    if lote_id:
        # We need to join Lote or filter by Piedra.lote_id. It's in Piedra!
        base_query = base_query.filter(Piedra.lote_id == lote_id)
    if tallador_id is not None:
        base_query = base_query.filter(HistorialEstadoPiedra.tallador_id == tallador_id)
    if plan_corte:
        base_query = base_query.filter(HistorialEstadoPiedra.plan_corte == plan_corte)
        
    # We turn the base query into a subquery to perform multiple aggregations cleanly
    filtered_subq = base_query.subquery()
    
    # --- Aggregation 1: Totals ---
    total_piedras = db.query(func.count(filtered_subq.c.piedra_id)).scalar() or 0
    total_quilates = db.query(func.sum(filtered_subq.c.peso_ct)).scalar() or 0.0
    
    # --- Aggregation 2: Piedras por Estado ---
    estado_counts = db.query(
        filtered_subq.c.estado_actual, 
        func.count(filtered_subq.c.piedra_id)
    ).group_by(filtered_subq.c.estado_actual).all()
    
    piedras_por_estado = {e.value: 0 for e in EstadoPiedra}
    for e_enum, count in estado_counts:
        # e_enum is an enum instance in SQLAlchemy depending on how it's defined
        e_str = e_enum.value if hasattr(e_enum, 'value') else str(e_enum)
        # If e_str starts with "EstadoPiedra.", strip it (SQLite enums can be weird)
        if "." in e_str: e_str = e_str.split(".")[-1]
        piedras_por_estado[e_str] = count

    # --- Aggregation 3: Piedras por Tallador ---
    tallador_counts = db.query(
        filtered_subq.c.tallador_id, 
        func.count(filtered_subq.c.piedra_id)
    ).group_by(filtered_subq.c.tallador_id).all()
    
    arr_por_tallador = []
    for t_id, count in tallador_counts:
        t_name = tallador_map.get(t_id, "Sin Asignar") if t_id else "Sin Asignar"
        arr_por_tallador.append({"name": t_name, "value": count})
        
    # Combine duplicate "Sin Asignar" if any (e.g. t_id=None and t_id not in map)
    tallador_combined = defaultdict(int)
    for item in arr_por_tallador:
        tallador_combined[item["name"]] += item["value"]
    arr_por_tallador = [{"name": k, "value": v} for k, v in tallador_combined.items()]
    
    # --- Aggregation 4: Piedras por Forma ---
    forma_counts = db.query(
        filtered_subq.c.plan_corte, 
        func.count(filtered_subq.c.piedra_id)
    ).group_by(filtered_subq.c.plan_corte).all()
    
    arr_por_forma = []
    for forma, count in forma_counts:
        f_name = forma if forma else "Sin Definir"
        arr_por_forma.append({"name": f_name, "value": count})
        
    # Formatting
    arr_por_estado = [{"name": k, "value": v} for k, v in piedras_por_estado.items()]
    arr_por_tallador.sort(key=lambda x: x["value"], reverse=True)
    arr_por_forma.sort(key=lambda x: x["value"], reverse=True)
    
    return {
        "total_piedras": total_piedras,
        "total_quilates": round(total_quilates, 2),
        "piedras_por_estado": arr_por_estado,
        "piedras_por_tallador": arr_por_tallador,
        "piedras_por_forma": arr_por_forma
    }
