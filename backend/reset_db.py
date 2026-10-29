import os
import sys
import shutil
import argparse
from datetime import datetime
import bcrypt
from app.database import engine, Base, SessionLocal, SQLALCHEMY_DATABASE_URL
from app.models import Persona, RolPersona, Ubicacion

DEFAULT_UBICACIONES = [
    "Recepción",
    "Bóveda / Caja Fuerte",
    "Área de Desbaste",
    "Área de Talla",
    "Control de Calidad",
    "En manos del Cliente"
]

def get_sqlite_file_path() -> str:
    """Extrae la ruta del archivo SQLite a partir de SQLALCHEMY_DATABASE_URL."""
    prefix = "sqlite:///"
    if SQLALCHEMY_DATABASE_URL.startswith(prefix):
        return SQLALCHEMY_DATABASE_URL[len(prefix):]
    return ""

def create_emergency_backup(db_path: str):
    """Crea una copia de seguridad en frío antes de destruir los datos."""
    if db_path and os.path.exists(db_path) and os.path.getsize(db_path) > 0:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dir_name = os.path.dirname(db_path) or "."
        base_name = os.path.basename(db_path)
        backup_path = os.path.join(dir_name, f"{base_name}.pre_reset_{timestamp}.bak")
        try:
            shutil.copy2(db_path, backup_path)
            print(f"🛡️  [SEGURIDAD] Respaldo de emergencia creado automáticamente en:")
            print(f"    -> {backup_path}")
        except Exception as e:
            print(f"⚠️  No se pudo crear el respaldo de emergencia: {e}")

def reset_database(force: bool = False, skip_backup: bool = False):
    env_mode = os.getenv("ENVIRONMENT", "development").lower()
    is_prod = env_mode in ("production", "prod") or os.getenv("PROD", "").lower() in ("1", "true")

    # Guardia 1: Protección estricta en entorno de producción
    if is_prod and os.getenv("ALLOW_RESET_IN_PRODUCTION", "").lower() != "true":
        print("❌ ERROR CRÍTICO: La base de datos está en modo PRODUCCIÓN.")
        print("   Por seguridad, reset_db.py está BLOQUEADO.")
        print("   Para desbloquear intencionalmente, define ALLOW_RESET_IN_PRODUCTION=true en el entorno.")
        sys.exit(1)

    # Guardia 2: Confirmación interactiva si no se suministró --force
    if not force:
        print("\n" + "="*70)
        print("⚠️  ADVERTENCIA DE SEGURIDAD - ACCIÓN DESTRUCTIVA")
        print("="*70)
        print("Esta operación ELIMINARÁ PERMANENTEMENTE todas las tablas:")
        print(" - Lotes y Piedras registradas")
        print(" - Trazabilidad histórica completa")
        print(" - Usuarios, credenciales y actores")
        print(" - Procesos de taller y áreas de custodia")
        print("="*70)

        if not sys.stdin.isatty():
            print("❌ ERROR: Para ejecutar reset_db.py de forma no interactiva (scripts/CI),")
            print("   debes pasar el flag explícito: --force")
            sys.exit(1)

        confirm = input("\nPara confirmar la destrucción total de los datos, escribe exactamente 'DESTRUIR_DATOS':\n> ")
        if confirm.strip() != "DESTRUIR_DATOS":
            print("\nOperación cancelada por el usuario. No se modificó ningún dato.")
            sys.exit(0)

    # Guardia 3: Respaldo de emergencia automático previo
    db_file = get_sqlite_file_path()
    if not skip_backup and db_file:
        create_emergency_backup(db_file)

    print("\n⏳ Eliminando todas las tablas (drop_all)...")
    Base.metadata.drop_all(bind=engine)
    
    print("⏳ Creando tablas limpias desde modelos (create_all)...")
    Base.metadata.create_all(bind=engine)
    
    print("🌱 Sembrando datos iniciales del sistema...")
    db = SessionLocal()
    
    try:
        # 1. Sembrado de Usuario Administrador
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@empresa.com")
        admin_nombre = os.getenv("ADMIN_NOMBRE", "Administrador Principal")

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), salt).decode('utf-8')
        
        admin_user = Persona(
            nombre=admin_nombre,
            username=admin_username,
            email=admin_email,
            password_hash=hashed_password,
            rol=RolPersona.Administrador
        )
        db.add(admin_user)

        # 2. Sembrado de Áreas de Custodia iniciales
        for nombre_ubicacion in DEFAULT_UBICACIONES:
            db.add(Ubicacion(nombre=nombre_ubicacion))

        db.commit()
        print(f"✅ Administrador inicial creado:")
        print(f"   - Usuario: {admin_username}")
        print(f"   - Email:   {admin_email}")
        print(f"✅ {len(DEFAULT_UBICACIONES)} Áreas de custodia sembradas con éxito.")
        print("\n✨ Base de datos reinicializada satisfactoriamente.")

    except Exception as e:
        print(f"❌ Error durante el sembrado inicial: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reinicializa la base de datos de GemStoneX con protecciones de seguridad.")
    parser.add_argument("--force", "-f", action="store_true", help="Fuerza la ejecución sin confirmación interactiva.")
    parser.add_argument("--skip-backup", action="store_true", help="Omite la creación del respaldo de seguridad previo.")
    args = parser.parse_args()

    reset_database(force=args.force, skip_backup=args.skip_backup)
