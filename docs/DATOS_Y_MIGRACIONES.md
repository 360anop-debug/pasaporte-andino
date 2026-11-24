# Datos y migraciones

## Principios
- Solo tablas nuevas con prefijo `pa_`; ninguna FK ni ALTER sobre tablas de Cultura Educa 360.
- Migraciones versionadas (`backend-integration/migrations/NNN_nombre.{up,down}.sql`), registradas en `pa_migraciones`.
- Usuario MariaDB de mínimos privilegios: `SELECT, INSERT, UPDATE, DELETE` sobre `pa_*` en runtime; `CREATE/ALTER/INDEX/DROP/REFERENCES` solo para el usuario de despliegue.
- Backup de tablas `pa_*` antes de cada despliegue (`scripts/deploy-staging.sh`).

## Modelo
```
pa_usuarios 1─1 pa_pasaportes 1─* pa_eventos (inmutables; UNIQUE idempotency_key y dedupe_key por pasaporte)
                     │                 └─1 pa_monedas_movimientos (libro mayor; saldo = SUM; reversión = fila negativa con revierte_id UNIQUE)
                     ├─* pa_visitas ──* pa_destinos *─1 pa_territorios 1─1 pa_sellos (sello + moneda coleccionable)
                     ├─* pa_sellos_obtenidos (UNIQUE pasaporte+sello; revocación auditada)
                     ├─* pa_album_fotos (privadas; borrado lógico + borrado de archivo)
                     └─* pa_lectura_progreso ──1 pa_contenidos (biblioteca_ref local:/ce360:)
pa_rutas *─* pa_destinos (pa_ruta_destinos, orden) · pa_checkin_codigos (nonce, expiración, usos) · pa_reglas · pa_auditoria · pa_rate_limit · pa_sesiones
```
Contenido con atribución: `fuente`, `licencia`, `credito`, `autor`, `es_ilustracion`, `es_demo`, `estado (borrador|publicado)`, `ubicacion_validada`.

## Migraciones
| Versión | Contenido | Reversión |
|---|---|---|
| 001 | Esquema base (22 tablas `pa_*`) | `DROP` de las tablas `pa_*` (borra datos del módulo → backup previo) |
| 002 | Reglas iniciales de monedas (100 visita, 200 ruta, 20 lectura, 5 audio, 5 video) | `DELETE` de esas reglas |

```bash
cd backend-integration
php bin/migrate.php status
php bin/migrate.php up
php bin/migrate.php down            # solo la última
php bin/migrate.php down --to=001   # hasta una versión
```

## Semillas
- `php bin/seed.php base` — **producción**: 13 provincias de la región Cajamarca + distrito Los Baños del Inca, con su sello y moneda coleccionable. Sin textos históricos (pendientes de curaduría editorial). Fuente declarada: INEI, «pendiente de validación editorial».
- `php bin/seed.php demo` — **solo staging/QA** (`es_demo=1`). Bloqueada en producción por código y la API nunca expone filas demo con `PA_ENV=production`.

## Configuración (variables de entorno; nunca en el repositorio)
`PA_ENV`, `PA_DB_DSN`, `PA_DB_USER`, `PA_DB_PASS`, `PA_SECRET` (≥32 car., firma de QR), `PA_CORS_ORIGINS`, `PA_STORAGE_DIR` (fuera del webroot), `PA_PUBLIC_BASE_URL`, `PA_SHOW_DEMO` (prohibido en producción), `PA_LIBRARY_CE360`, `PA_SESSION_DAYS`, `PA_MIN_READING_SECONDS`, `PA_UPLOAD_MAX_BYTES`, `PA_COOKIE_SECURE`, `PA_TRUST_PROXY`.

## Migración de datos entre versiones de la app
Las apps no guardan datos de negocio localmente (solo el token y caché pública), por lo que una nueva versión de APK/EXE no requiere migración local. La caché se descarta sin pérdida.
