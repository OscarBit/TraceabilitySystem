from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from collections import defaultdict
from app.database import get_db
from app.models import Piedra, Persona, EstadoPiedra

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    estado: Optional[str] = None,
    lote_id: Optional[str] = None,
    tallador_id: Optional[int] = None,
    plan_corte: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Fetch all stones with their histories and lot information
    piedras_query = db.query(Piedra).options(joinedload(Piedra.historial))
    todas_las_piedras = piedras_query.all()
    
    # We will also need tallador names mapping
    talladores = db.query(Persona).filter(Persona.rol == "Tallador").all()
    tallador_map = {t.id: t.nombre for t in talladores}
    
    filtered_piedras = []
    
    for p in todas_las_piedras:
        # Get the latest history record for the stone
        latest_hist = p.historial[-1] if p.historial else None
        
        # Apply filters
        if estado and p.estado_actual.value != estado:
            continue
        if lote_id and p.lote_id != lote_id:
            continue
            
        stone_tallador_id = latest_hist.tallador_id if latest_hist else None
        if tallador_id is not None and stone_tallador_id != tallador_id:
            continue
            
        stone_plan = latest_hist.plan_corte if latest_hist else None
        if plan_corte and stone_plan != plan_corte:
            continue
            
        filtered_piedras.append({
            "piedra": p,
            "latest_hist": latest_hist,
            "tallador_id": stone_tallador_id,
            "plan_corte": stone_plan
        })
        
    # Aggregate data
    total_piedras = len(filtered_piedras)
    total_quilates = sum(
        item["latest_hist"].peso_ct 
        for item in filtered_piedras 
        if item["latest_hist"] and item["latest_hist"].peso_ct is not None
    )
    
    piedras_por_estado = defaultdict(int)
    for e in EstadoPiedra:
        piedras_por_estado[e.value] = 0
        
    piedras_por_tallador_counts = defaultdict(int)
    piedras_por_forma_counts = defaultdict(int)
    
    for item in filtered_piedras:
        # Estado
        piedras_por_estado[item["piedra"].estado_actual.value] += 1
        
        # Tallador
        t_id = item["tallador_id"]
        t_name = tallador_map.get(t_id, "Sin Asignar") if t_id else "Sin Asignar"
        piedras_por_tallador_counts[t_name] += 1
        
        # Forma
        forma = item["plan_corte"] if item["plan_corte"] else "Sin Definir"
        piedras_por_forma_counts[forma] += 1
        
    # Format data for frontend charting (arrays of objects are better for Recharts)
    arr_por_estado = [{"name": k, "value": v} for k, v in piedras_por_estado.items()]
    arr_por_tallador = [{"name": k, "value": v} for k, v in piedras_por_tallador_counts.items()]
    arr_por_forma = [{"name": k, "value": v} for k, v in piedras_por_forma_counts.items()]
    
    # Sort for better visuals
    arr_por_tallador.sort(key=lambda x: x["value"], reverse=True)
    arr_por_forma.sort(key=lambda x: x["value"], reverse=True)
    
    return {
        "total_piedras": total_piedras,
        "total_quilates": round(total_quilates, 2),
        "piedras_por_estado": arr_por_estado,
        "piedras_por_tallador": arr_por_tallador,
        "piedras_por_forma": arr_por_forma
    }
