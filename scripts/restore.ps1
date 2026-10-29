<#
.SYNOPSIS
    Script de Restauración de Respaldo para GemStoneX.
.DESCRIPTION
    Restaura la base de datos y el volumen de imágenes desde un respaldo previo
    con comprobación previa de seguridad y creación de snapshot de emergencia.
.PARAMETER BackupPath
    Ruta a la carpeta o archivo .zip del respaldo a restaurar. Si se omite, lista los disponibles.
.PARAMETER Force
    Omite la confirmación interactiva.
.EXAMPLE
    .\scripts\restore.ps1
.EXAMPLE
    .\scripts\restore.ps1 -BackupPath "backups\backup_20261029_120000.zip"
#>

[CmdletBinding()]
param (
    [string]$BackupPath,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$RootPath = (Get-Item $PSScriptRoot).Parent.FullName
$BackupsDir = Join-Path $RootPath "backups"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "💎 GemStoneX - Restauración de Respaldo" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Seleccionar respaldo si no se suministró BackupPath
if (-not $BackupPath) {
    if (-not (Test-Path $BackupsDir)) {
        Write-Host "❌ No existe la carpeta de respaldos '$BackupsDir'." -ForegroundColor Red
        exit 1
    }
    
    $availableBackups = Get-ChildItem -Path $BackupsDir | Where-Object { $_.Name -like "backup_*" } | Sort-Object CreationTime -Descending
    if ($availableBackups.Count -eq 0) {
        Write-Host "❌ No se encontraron respaldos en '$BackupsDir'." -ForegroundColor Red
        exit 1
    }

    Write-Host "`nRespaldos disponibles:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $availableBackups.Count; $i++) {
        $item = $availableBackups[$i]
        $sizeMb = [math]::Round($item.Length / 1MB, 2)
        Write-Host "  [$($i + 1)] $($item.Name) ($($item.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor White
    }

    $selection = Read-Host "`nSelecciona el número del respaldo a restaurar (1-$($availableBackups.Count)) o 'q' para salir"
    if ($selection -eq 'q' -or -not ($selection -match '^\d+$')) {
        Write-Host "Operación cancelada." -ForegroundColor Gray
        exit 0
    }
    
    $idx = [int]$selection - 1
    if ($idx -lt 0 -or $idx -ge $availableBackups.Count) {
        Write-Host "❌ Selección no válida." -ForegroundColor Red
        exit 1
    }
    $BackupPath = $availableBackups[$idx].FullName
}

if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ La ruta de respaldo '$BackupPath' no existe." -ForegroundColor Red
    exit 1
}

Write-Host "`nRespaldo seleccionado: $BackupPath" -ForegroundColor White

# 2. Descomprimir si es .zip a una carpeta temporal
$tempRestoreDir = $null
$SourceFolder = $BackupPath

if ($BackupPath.EndsWith(".zip", [System.StringComparison]::OrdinalIgnoreCase)) {
    $tempRestoreDir = Join-Path $env:TEMP "gemstone_restore_$(Get-Random)"
    New-Item -ItemType Directory -Path $tempRestoreDir | Out-Null
    Write-Host "⏳ Descomprimiendo archivo ZIP..." -ForegroundColor Yellow
    Expand-Archive -Path $BackupPath -DestinationPath $tempRestoreDir -Force
    $SourceFolder = $tempRestoreDir
}

$dbSource = Join-Path $SourceFolder "gemstone.db"
if (-not (Test-Path $dbSource)) {
    Write-Host "❌ Error crítico: El respaldo no contiene el archivo 'gemstone.db'." -ForegroundColor Red
    if ($tempRestoreDir) { Remove-Item -Path $tempRestoreDir -Recurse -Force }
    exit 1
}

# 3. Confirmación de seguridad
if (-not $Force) {
    Write-Host "`n⚠️  ADVERTENCIA:" -ForegroundColor Red
    Write-Host "Esta operación REEMPLAZARÁ la base de datos actual y las fotografías del sistema." -ForegroundColor Red
    $conf = Read-Host "Para confirmar la restauración, escribe 'RESTAURAR'"
    if ($conf -ne 'RESTAURAR') {
        Write-Host "Restauración cancelada." -ForegroundColor Gray
        if ($tempRestoreDir) { Remove-Item -Path $tempRestoreDir -Recurse -Force }
        exit 0
    }
}

try {
    # 4. Snapshot de seguridad del estado actual antes de sobrescribir
    Write-Host "`n⏳ 1/3 Tomando snapshot preventivo del estado actual antes de restaurar..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    docker compose exec -T backend python -c "
import shutil, os
if os.path.exists('./data/gemstone.db'):
    shutil.copy2('./data/gemstone.db', './data/gemstone_pre_restore_$timestamp.bak')
    print('Snapshot preventivo guardado en ./data/gemstone_pre_restore_$timestamp.bak')
"

    # 5. Restaurar base de datos
    Write-Host "⏳ 2/3 Copiando gemstone.db al contenedor backend..." -ForegroundColor Yellow
    docker compose cp "$dbSource" backend:/app/data/gemstone.db

    # 6. Restaurar fotos si existen en el respaldo
    $uploadsSource = Join-Path $SourceFolder "uploads"
    if (Test-Path $uploadsSource) {
        Write-Host "⏳ 3/3 Restaurando volumen de fotografías..." -ForegroundColor Yellow
        docker compose cp "$uploadsSource/." backend:/app/uploads/
    }

    # 7. Reiniciar contenedor backend para reconectar SQLAlchemy
    Write-Host "⏳ Reiniciando backend para refrescar conexiones..." -ForegroundColor Yellow
    docker compose restart backend | Out-Null

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "🎉 RESTAURACIÓN COMPLETADA CON ÉXITO" -ForegroundColor Green
    Write-Host "El sistema ha sido restaurado al estado del respaldo." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} finally {
    if ($tempRestoreDir -and (Test-Path $tempRestoreDir)) {
        Remove-Item -Path $tempRestoreDir -Recurse -Force
    }
}
