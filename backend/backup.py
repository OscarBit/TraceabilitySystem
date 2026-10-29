import os
import sys
import sqlite3
import json
from datetime import datetime
from app.database import SQLALCHEMY_DATABASE_URL, SessionLocal
from app.models import Lote, Piedra, HistorialEstadoPiedra, Persona

def get_db_file_path() -> str:
    prefix = "sqlite:///"
    if SQLALCHEMY_DATABASE_URL.startswith(prefix):
        return SQLALCHEMY_DATABASE_URL[len(prefix):]
    return "./data/gemstone.db"

def hot_backup_sqlite(source_path: str, dest_path: str):
    """Realiza un respaldo atómico en caliente de SQLite usando la API nativa de backup."""
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Base de datos no encontrada en: {source_path}")
    
    os.makedirs(os.path.dirname(dest_path) or ".", exist_ok=True)
    
    src_conn = sqlite3.connect(source_path)
    dst_conn = sqlite3.connect(dest_path)
    try:
        with dst_conn:
            src_conn.backup(dst_conn, pages=100)
    finally:
        dst_conn.close()
        src_conn.close()

def get_stats():
    """Calcula estadísticas generales de la base de datos."""
    db = SessionLocal()
    try:
        return {
            "lotes_totales": db.query(Lote).count(),
            "lotes_activos": db.query(Lote).filter_by(is_active=1).count(),
            "piedras_totales": db.query(Piedra).count(),
            "historial_estados": db.query(HistorialEstadoPiedra).count(),
            "usuarios_y_actores": db.query(Persona).count(),
        }
    except Exception as e:
        return {"error_stats": str(e)}
    finally:
        db.close()

def get_uploads_stats(uploads_dir: str = "/app/uploads"):
    if not os.path.exists(uploads_dir):
        return {"total_archivos": 0, "tamano_total_bytes": 0}
    
    total_files = 0
    total_bytes = 0
    for root, _, files in os.walk(uploads_dir):
        for f in files:
            total_files += 1
            total_bytes += os.path.getsize(os.path.join(root, f))
    return {"total_archivos": total_files, "tamano_total_bytes": total_bytes}

def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "/app/data/backups"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(target_dir, exist_ok=True)
    
    src_db = get_db_file_path()
    dest_db = os.path.join(target_dir, f"gemstone_{timestamp}.db")
    
    print(f"⏳ Ejecutando hot backup de SQLite ({src_db} -> {dest_db})...")
    hot_backup_sqlite(src_db, dest_db)
    
    db_size = os.path.getsize(dest_db)
    db_stats = get_stats()
    uploads_stats = get_uploads_stats()
    
    manifest = {
        "timestamp": timestamp,
        "fecha_iso": datetime.now().isoformat(),
        "archivo_db": os.path.basename(dest_db),
        "tamano_db_bytes": db_size,
        "estadisticas_db": db_stats,
        "estadisticas_imagenes": uploads_stats
    }
    
    manifest_path = os.path.join(target_dir, f"manifest_{timestamp}.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Hot backup completado:")
    print(f"   - DB: {dest_db} ({db_size / 1024:.1f} KB)")
    print(f"   - Lotes: {db_stats.get('lotes_totales', 0)} | Piedras: {db_stats.get('piedras_totales', 0)}")
    print(f"   - Imágenes registradas: {uploads_stats.get('total_archivos', 0)}")
    print(f"   - Manifiesto: {manifest_path}")

if __name__ == "__main__":
    main()
