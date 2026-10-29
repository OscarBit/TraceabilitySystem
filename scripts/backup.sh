#!/usr/bin/env bash
# ==============================================================================
# Script de Respaldo Automatizado en Caliente para GemStoneX (Linux / VPS)
# ==============================================================================
set -euo pipefail

RETENTION_COUNT="${1:-10}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$ROOT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET_DIR="$BACKUPS_DIR/backup_$TIMESTAMP"

echo "=========================================================="
echo "💎 GemStoneX - Protocolo de Respaldo en Caliente"
echo "=========================================================="
echo "📅 Fecha: $(date)"
echo "📁 Destino: $TARGET_DIR"

# 1. Verificar contenedor backend
if ! docker compose ps --services --filter "status=running" | grep -q "backend"; then
    echo "❌ Error: El contenedor gemstone-backend no está en ejecución."
    exit 1
fi

mkdir -p "$TARGET_DIR"

# 2. Hot backup de SQLite
echo "⏳ 1/3 Generando snapshot consistente de SQLite..."
docker compose exec -T backend python backup.py /app/data/temp_backup
docker compose cp backend:/app/data/gemstone.db "$TARGET_DIR/gemstone.db"
docker compose exec -T backend rm -rf /app/data/temp_backup
echo "   ✅ Base de datos respaldada."

# 3. Copia de imágenes WebP
echo "⏳ 2/3 Respaldando volumen persistente de fotografías..."
docker compose cp backend:/app/uploads "$TARGET_DIR/"
echo "   ✅ Fotografías respaldadas."

# 4. Manifiesto
echo "⏳ 3/3 Generando manifiesto de integridad..."
DB_SHA256="$(sha256sum "$TARGET_DIR/gemstone.db" | awk '{print $1}')"
TOTAL_IMAGES="$(find "$TARGET_DIR/uploads" -type f | wc -l || echo 0)"

cat <<EOF > "$TARGET_DIR/manifest.json"
{
  "timestamp": "$TIMESTAMP",
  "fecha_iso": "$(date -Iseconds)",
  "archivos": {
    "base_de_datos": "gemstone.db",
    "sha256_db": "$DB_SHA256",
    "total_imagenes": $TOTAL_IMAGES
  }
}
EOF
echo "   ✅ Manifiesto generado."

# 5. Comprimir a .tar.gz opcional
TAR_FILE="$BACKUPS_DIR/backup_$TIMESTAMP.tar.gz"
echo "📦 Comprimiendo en $TAR_FILE..."
tar -czf "$TAR_FILE" -C "$BACKUPS_DIR" "backup_$TIMESTAMP"
rm -rf "$TARGET_DIR"

# 6. Rotación de respaldos antiguos
echo "🧹 Rotando respaldos (manteniendo los últimos $RETENTION_COUNT)..."
cd "$BACKUPS_DIR"
ls -1t backup_*.tar.gz 2>/dev/null | tail -n +"$((RETENTION_COUNT + 1))" | xargs -r rm -f

echo "=========================================================="
echo "🎉 RESPALDO FINALIZADO CON ÉXITO: $TAR_FILE"
echo "=========================================================="
