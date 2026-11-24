# Changelog

## 1.0.0 — 2026-11-24
### Añadido
- Edición turística **Pasaporte Andino / Andean Passport**: interfaz web única (ES/EN) fiel a las 7 referencias del Kit Maestro,
  empaquetada como web (`/pasaporte`), APK Android (Capacitor) e instalador Windows (Electron/NSIS).
- API PHP 8.4 `/pasaporte/api/v1`: catálogo de territorios, lugares, rutas, contenidos, biblioteca (adaptador),
  pasaporte (sin DNI, QR opaco), check-in con QR firmado, sellos, libro mayor de monedas simbólicas, álbum privado,
  exportación y eliminación de cuenta, administración auditada.
- Migraciones aditivas `pa_*` 001–002 reversibles; semillas `base` (producción) y `demo` (solo staging).
- Pipeline de assets del kit (alfa de monedas/medallas, limpieza de halo de personajes, sellos desde originales, manifiesto trazable).
- QA: 22 pruebas de integración PHP, unitarias i18n, E2E compartido web/Android/Windows, capturas en 6 tamaños y comparativas con mapas de diferencias.
- CI GitHub Actions: backend PHP 8.4 + MariaDB 11.4, build web, APK/AAB + emulador Android 14, EXE + instalación/desinstalación en Windows.
### Seguridad
- Capacitor 7.6.10, Vite 6.4.6, Electron 45.4.1, electron-builder 26.18.0 (corrección de avisos críticos/altos).
