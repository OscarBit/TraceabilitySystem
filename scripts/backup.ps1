<#
.SYNOPSIS
    Script de Respaldo Automatizado en Caliente para GemStoneX.
.DESCRIPTION
    Extrae un snapshot consistente de la base de datos SQLite y del volumen de imágenes WebP
    sin detener el sistema ni interrumpir la operación de los talladores.
.PARAMETER RetentionCount
    Número de respaldos históricos a conservar (por defecto: 10).
.PARAMETER Zip
    Comprime el respaldo resultante en formato .zip.
.EXAMPLE
    .\scripts\backup.ps1
.EXAMPLE
    .\scripts\backup.ps1 -Zip -RetentionCount 15
#>

[CmdletBinding()]
param (
    [int]$RetentionCount = 10,
    [switch]$Zip
)

$ErrorActionPreference = "Stop"

$RootPath = (Get-Item $PSScriptRoot).Parent.FullName
$BackupsDir = Join-Path $RootPath "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupTargetDir = Join-Path $BackupsDir "backup_$Timestamp"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "💎 GemStoneX - Protocolo de Respaldo en Caliente" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "📅 Fecha y Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "📁 Destino: $BackupTargetDir" -ForegroundColor Gray

# 1. Verificar si Docker está en ejecución y el contenedor activo
try {
    $backendStatus = docker compose ps --format json backend | ConvertFrom-Json
    if (-not $backendStatus) {
        Write-Host "❌ Error: El contenedor 'gemstone-backend' no está en ejecución." -ForegroundColor Red
        Write-Host "   Inicia el sistema con 'docker compose up -d' antes de respaldar." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error al comunicarse con Docker. Verifica que Docker Desktop esté iniciado." -ForegroundColor Red
    exit 1
}

# 2. Crear directorio de respaldo
if (-not (Test-Path $BackupsDir)) {
    New-Item -ItemType Directory -Path $BackupsDir | Out-Null
}
New-Item -ItemType Directory -Path $BackupTargetDir | Out-Null

# 3. Ejecutar hot backup de SQLite dentro del contenedor
Write-Host "`n⏳ 1/3 Generando snapshot consistente de SQLite..." -ForegroundColor Yellow
try {
    # Ejecuta el script de hot backup nativo dentro del contenedor
    $hotBackupOutput = docker compose exec -T backend python backup.py /app/data/temp_backup
    Write-Host "   $hotBackupOutput" -ForegroundColor Gray

    # Extraer el archivo de base de datos generado
    docker compose cp backend:/app/data/gemstone.db "$BackupTargetDir/gemstone.db"
    
    # Limpiar archivo temporal en el contenedor
    docker compose exec -T backend rm -rf /app/data/temp_backup
    
    $dbSize = (Get-Item "$BackupTargetDir/gemstone.db").Length / 1KB
    Write-Host "   ✅ Base de datos respaldada: gemstone.db ($([math]::Round($dbSize, 1)) KB)" -ForegroundColor Green
} catch {
    Write-Host "❌ Falló el respaldo de la base de datos: $_" -ForegroundColor Red
    exit 1
}

# 4. Extraer imágenes del volumen de uploads
Write-Host "`n⏳ 2/3 Respaldando volumen persistente de fotografías (WebP)..." -ForegroundColor Yellow
$UploadsTarget = Join-Path $BackupTargetDir "uploads"
try {
    docker compose cp backend:/app/uploads "$BackupTargetDir"
    
    $imageCount = 0
    $uploadsSize = 0
    if (Test-Path $UploadsTarget) {
        $files = Get-ChildItem -Path $UploadsTarget -File -Recurse
        $imageCount = $files.Count
        $uploadsSize = ($files | Measure-Object -Property Length -Sum).Sum / 1KB
    }
    Write-Host "   ✅ Fotografías respaldadas: $imageCount archivos ($([math]::Round($uploadsSize, 1)) KB)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Advertencia al copiar uploads: $_" -ForegroundColor DarkYellow
}

# 5. Generar archivo de manifiesto (metadata)
Write-Host "`n⏳ 3/3 Generando manifiesto de integridad..." -ForegroundColor Yellow
$dbHash = (Get-FileHash "$BackupTargetDir/gemstone.db" -Algorithm SHA256).Hash

$Manifest = @{
    Timestamp = $Timestamp
    FechaISO = (Get-Date).ToString("o")
    Archivos = @{
        BaseDeDatos = "gemstone.db"
        TamanoDBBytes = (Get-Item "$BackupTargetDir/gemstone.db").Length
        SHA256_DB = $dbHash
        TotalImagenes = $imageCount
    }
    Sistema = @{
        DockerVersion = (docker --version)
        OS = [System.Environment]::OSVersion.VersionString
    }
}

$ManifestJson = $Manifest | ConvertTo-Json -Depth 4
$ManifestPath = Join-Path $BackupTargetDir "manifest.json"
Set-Content -Path $ManifestPath -Value $ManifestJson -Encoding UTF8
Write-Host "   ✅ Manifiesto generado con checksum SHA-256." -ForegroundColor Green

# 6. Compresión opcional en .zip
$FinalPath = $BackupTargetDir
if ($Zip) {
    Write-Host "`n📦 Comprimiendo en archivo ZIP..." -ForegroundColor Yellow
    $ZipPath = Join-Path $BackupsDir "backup_$Timestamp.zip"
    Compress-Archive -Path "$BackupTargetDir\*" -DestinationPath $ZipPath -Force
    Remove-Item -Path $BackupTargetDir -Recurse -Force
    $FinalPath = $ZipPath
    $zipSize = (Get-Item $ZipPath).Length / 1KB
    Write-Host "   ✅ Archivo ZIP creado: $ZipPath ($([math]::Round($zipSize, 1)) KB)" -ForegroundColor Green
}

# 7. Política de retención / rotación automática
Write-Host "`n🧹 Verificando política de retención (mantener los últimos $RetentionCount respaldos)..." -ForegroundColor Yellow
$allBackups = Get-ChildItem -Path $BackupsDir | Where-Object { $_.Name -like "backup_*" } | Sort-Object CreationTime -Descending

if ($allBackups.Count -gt $RetentionCount) {
    $toDelete = $allBackups | Select-Object -Skip $RetentionCount
    foreach ($item in $toDelete) {
        Write-Host "   🗑️ Eliminando respaldo antiguo: $($item.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $item.FullName -Recurse -Force
    }
    Write-Host "   ✅ Rotación completada." -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay respaldos antiguos que purgar ($($allBackups.Count)/$RetentionCount almacenados)." -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "🎉 RESPALDO FINALIZADO CON ÉXITO" -ForegroundColor Green
Write-Host "Ubicación: $FinalPath" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
