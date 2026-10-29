# 🛡️ Guía de Respaldos, Recuperación y Protección de Datos - GemStoneX

Esta guía detalla el funcionamiento, automatización y protocolos de recuperación para garantizar la persistencia e integridad absoluta de los datos (lotes, piedras, trazabilidad histórica inmutable, usuarios y fotografías WebP).

---

## 📑 Tabla de Contenidos
1. [Arquitectura de Persistencia y Respaldos en Caliente](#1-arquitectura-de-persistencia-y-respaldos-en-caliente)
2. [Guía de Uso: Generación de Respaldos](#2-guía-de-uso-generación-de-respaldos)
   - [En Windows (PowerShell)](#en-windows-powershell)
   - [En Linux / Servidor VPS (Bash)](#en-linux--servidor-vps-bash)
3. [Automatización de Respaldos](#3-automatización-de-respaldos)
   - [En Windows (Programador de Tareas)](#programador-de-tareas-de-windows)
   - [En Linux (Cron Job)](#cron-job-en-linux)
4. [Protocolo de Restauración y Recuperación ante Desastres](#4-protocolo-de-restauración-y-recuperación-ante-desastres)
5. [Protección y Seguridad de `reset_db.py`](#5-protección-y-seguridad-de-reset_dbpy)
   - [Recuperación ante una reinicialización no deseada](#recuperación-ante-una-reinicialización-no-deseada)

---

## 1. Arquitectura de Persistencia y Respaldos en Caliente

GemStoneX opera sobre volúmenes persistentes gestionados por Docker:
- **`gemstone-data`**: Aloja el archivo SQLite en `/app/data/gemstone.db`.
- **`gemstone-uploads`**: Aloja todas las imágenes comprimidas en WebP en `/app/uploads/`.

### ¿Por qué "en Caliente" (Hot Backup)?
Hacer una copia ordinaria de un archivo SQLite mientras el servidor recibe solicitudes de talladores puede generar bases de datos corruptas (*torn pages*) si ocurre una escritura a mitad de la copia.

GemStoneX utiliza la **API nativa de Hot Backup de SQLite** (`sqlite3.backup()` implementada en `backend/backup.py`). Esta API:
- Lee páginas consistentes de la base de datos sin detener Uvicorn ni Nginx.
- No bloquea a los talladores ni a los operadores que registran cambios de peso o fotos.
- Genera un archivo `.db` 100% íntegro garantizado bajo estándar **ACID**.

---

## 2. Guía de Uso: Generación de Respaldos

### En Windows (PowerShell)

El script `scripts\backup.ps1` automatiza la extracción de la base de datos, la copia de todas las fotografías WebP, el cálculo de sumas de verificación SHA-256 en un manifiesto y la rotación de archivos antiguos.

#### Respaldo Básico (Directorio):
```powershell
.\scripts\backup.ps1
```
*Genera una carpeta `backups\backup_YYYYMMDD_HHMMSS\` con la base de datos, las fotos y el manifiesto JSON.*

#### Respaldo Comprimido en `.zip`:
```powershell
.\scripts\backup.ps1 -Zip
```
*Empaqueta todo en un archivo `backups\backup_YYYYMMDD_HHMMSS.zip`.*

#### Control de Rotación / Retención:
Por defecto se conservan los últimos **10 respaldos**. Puedes personalizar este valor con `-RetentionCount`:
```powershell
.\scripts\backup.ps1 -Zip -RetentionCount 20
```

---

### En Linux / Servidor VPS (Bash)

Si despliegas la aplicación en un VPS (DigitalOcean, AWS, Hetzner, etc.):

```bash
# Dar permisos de ejecución:
chmod +x scripts/*.sh

# Ejecutar respaldo (conservando los últimos 10 archivos .tar.gz):
./scripts/backup.sh 10
```

---

## 3. Automatización de Respaldos

### Programador de Tareas de Windows
Para programar un respaldo diario automático a las 11:00 PM sin intervención manual:

1. Abre **PowerShell como Administrador**.
2. Ejecuta el siguiente comando (ajustando la ruta a tu proyecto si es necesario):
   ```powershell
   $Action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument '-ExecutionPolicy Bypass -File "C:\Users\16osc\Documents\Work\GemStoneX\App\scripts\backup.ps1" -Zip -RetentionCount 15'
   $Trigger = New-ScheduledTaskTrigger -Daily -At 11:00PM
   Register-ScheduledTask -TaskName "GemStoneX_Daily_Backup" -Action $Action -Trigger $Trigger -Description "Respaldo diario en caliente de GemStoneX"
   ```

### Cron Job en Linux
En servidores Linux, edita la tabla de cron (`crontab -e`) y añade:
```bash
# Ejecutar respaldo todos los días a las 2:00 AM:
0 2 * * * /ruta/al/proyecto/scripts/backup.sh 30 >> /var/log/gemstone_backup.log 2>&1
```

---

## 4. Protocolo de Restauración y Recuperación ante Desastres

Si requieres restaurar el sistema a una fecha u hora anterior:

### En Windows (PowerShell)

#### Modo Interactivo (Recomendado):
Ejecuta el script sin parámetros para ver la lista de todos los respaldos existentes y elegir cuál restaurar:
```powershell
.\scripts\restore.ps1
```
*El script mostrará un menú:*
```text
Respaldos disponibles:
  [1] backup_20261029_114648 (2026-10-29 11:46:48)
  [2] backup_20261029_114502.zip (2026-10-29 11:45:02)

Selecciona el número del respaldo a restaurar (1-2) o 'q' para salir: 1
```

#### Restauración Directa:
```powershell
.\scripts\restore.ps1 -BackupPath "backups\backup_20261029_114502.zip"
```

#### Mecanismos de Seguridad del Script de Restauración:
1. **Comprobación de Integridad:** Verifica que el respaldo contenga `gemstone.db` válido antes de tocar el contenedor.
2. **Snapshot Preventivo Automático:** Justo antes de restaurar, toma una copia de seguridad del estado actual del contenedor en `/app/data/gemstone_pre_restore_<timestamp>.bak`.
3. **Reconexión Limpia:** Reinicia automáticamente el backend para que SQLAlchemy libere conexiones previas y se adhiera a la base de datos restaurada.

---

## 5. Protección y Seguridad de `reset_db.py`

El script de inicialización en frío `backend/reset_db.py` incluye tres salvaguardas que impiden desastres accidentales:

1. **Bloqueo de Producción:**
   Si la variable `ENVIRONMENT=production` o `PROD=true` está presente, el script se rehúsa a ejecutarse a menos que se defina `ALLOW_RESET_IN_PRODUCTION=true`.

2. **Confirmación Obligatoria en Terminal:**
   ```bash
   docker compose exec backend python reset_db.py
   ```
   *Salida:*
   ```text
   ======================================================================
   ⚠️  ADVERTENCIA DE SEGURIDAD - ACCIÓN DESTRUCTIVA
   ======================================================================
   Esta operación ELIMINARÁ PERMANENTEMENTE todas las tablas:
    - Lotes y Piedras registradas
    - Trazabilidad histórica completa
    - Usuarios, credenciales y actores
    - Procesos de taller y áreas de custodia
   ======================================================================

   Para confirmar la destrucción total de los datos, escribe exactamente 'DESTRUIR_DATOS':
   > 
   ```
   Si el texto no coincide exactamente, la ejecución se cancela inmediatamente sin tocar la base de datos. En scripts desatendidos exige el parámetro `--force`.

3. **Copia de Respaldo de Emergencia Previa:**
   Incluso al ejecutarse con `--force`, el script extrae una copia automática en:
   `/app/data/gemstone.db.pre_reset_<timestamp>.bak`

### Recuperación ante una reinicialización no deseada
Si por error alguien ejecutó `reset_db.py`, la base de datos original **NO se ha perdido**. Se encuentra resguardada como archivo `.bak` dentro del volumen persistente:

```powershell
# 1. Listar los respaldos pre-reset existentes:
docker compose exec backend ls -l /app/data/

# 2. Restaurar la copia previa:
docker compose exec backend cp /app/data/gemstone.db.pre_reset_AAAAMMDD_HHMMSS.bak /app/data/gemstone.db

# 3. Reiniciar el backend:
docker compose restart backend
```
El sistema volverá de inmediato al estado exacto previo a la ejecución.
