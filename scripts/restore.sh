#!/usr/bin/env bash
# ==============================================================================
# Script de Restauración para GemStoneX (Linux / VPS)
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$ROOT_DIR/backups"

if [ -z "$BACKUP_FILE" ]; then
    echo "Respaldos disponibles en $BACKUPS_DIR:"
    ls -lh "$BACKUPS_DIR"/backup_*.tar.gz 2>/dev/null || echo "No se encontraron respaldos .tar.gz"
    echo ""
    echo "Uso: ./scripts/restore.sh <ruta-al-archivo-backup.tar.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo '$BACKUP_FILE' no existe."
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esta operación reemplazará los datos actuales por los del respaldo."
read -rp "Para confirmar, escribe 'RESTAURAR': " CONFIRM
if [ "$CONFIRM" != "RESTAURAR" ]; then
    echo "Operación cancelada."
    exit 0
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "⏳ Descomprimiendo respaldo..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

BACKUP_SUBDIR="$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
DB_FILE="$BACKUP_SUBDIR/gemstone.db"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: No se encontró gemstone.db dentro del respaldo."
    exit 1
fi

echo "⏳ Restaurando base de datos en backend..."
docker compose cp "$DB_FILE" backend:/app/data/gemstone.db

if [ -d "$BACKUP_SUBDIR/uploads" ]; then
    echo "⏳ Restaurando volumen de fotografías..."
    docker compose cp "$BACKUP_SUBDIR/uploads/." backend:/app/uploads/
fi

echo "⏳ Reiniciando contenedor backend..."
docker compose restart backend

echo "✅ Restauración completada con éxito."
