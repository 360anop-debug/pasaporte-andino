# Pasaporte Andino · Andean Passport — Cultura Educa 360 (edición turística 1.0.0)

Edición turística instalable fiel a las 7 referencias del Kit Maestro: registro y pasaporte digital, exploración de distritos
de Cajamarca, historia/videos/audios/referencias, rutas, álbum privado, sellos, monedas simbólicas y compartir, en ES/EN.
Una sola interfaz web empaquetada como **web** (`/pasaporte`), **APK Android** e **instalador EXE de Windows**, sobre un
**API PHP 8.4** aditivo (tablas `pa_*`) preparado para `https://region.aprep.net`.

## Estructura
| Carpeta | Contenido |
|---|---|
| `web-tourism/` | Interfaz (Vite + JS, sin framework), recursos derivados del kit, i18n, pruebas unitarias |
| `backend-integration/` | API PHP 8.4, migraciones 001–002 reversibles, semillas, CLI de administración, 22 pruebas de integración |
| `android/` | Proyecto Capacitor 7.6 (plugin nativo `PaSecure` con Keystore) |
| `windows/` | Proyecto Electron 45 + NSIS |
| `instaladores/` | Binarios compilados por CI (ver estado abajo) |
| `qa/` | Capturas (6 tamaños, comparativas con referencias, Android emulador, Windows instalado), reportes y logs |
| `scripts/` | inspección, build Android/Windows, pruebas, despliegue a staging, rollback, workflow de CI |
| `docs/` | Arquitectura, API, datos y migraciones, instalación Android/Windows, despliegue a producción |

## Estado de los artefactos
Ver `MATRIZ_PRUEBAS_Y_RESULTADOS.md` (evidencias y enlaces a ejecuciones de CI) y `MANIFEST_SHA256.json` (hashes).

## Inicio rápido (desarrollo local)
```bash
cd backend-integration && composer install && . ./.env.test.sh && vendor/bin/phpunit
```
```bash
scripts/pruebas.sh
```

## Documentos
`MATRIZ_FIDELIDAD_VISUAL.md` · `AUDITORIA_REUTILIZACION_CE360.md` · `AUDITORIA_SEGURIDAD.md` · `MATRIZ_PRUEBAS_Y_RESULTADOS.md` ·
`LIMITACIONES_Y_PENDIENTES.md` · `CHANGELOG.md` · `docs/*.md`

## Avisos
- La integración con el código de Cultura Educa 360 está **BLOQUEADA** (código no entregado); ver auditoría.
- Las Monedas Andinas son simbólicas: sin valor monetario, no canjeables ni transferibles.
- Las ilustraciones del kit no son fotografías documentales; el contenido demo solo existe en staging.
- Generar el APK/EXE no actualiza producción: el despliegue en region.aprep.net requiere staging, aprobación y backup (`docs/DEPLOY_PRODUCCION.md`).
