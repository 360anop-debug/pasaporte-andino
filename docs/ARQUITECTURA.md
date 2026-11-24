# Arquitectura — Pasaporte Andino (edición turística)

```
                 ┌────────────── Una sola base de interfaz (web-tourism/, Vite + JS) ──────────────┐
                 │  hash-router · i18n ES/EN · componentes ornamentales · estados vacío/error      │
                 └───────┬──────────────────────────────┬─────────────────────────────┬────────────┘
             build:prod  │                    cap sync  │                 electron-builder
   https://region.aprep.net/pasaporte/      Android (Capacitor 7.6)        Windows (Electron 45, NSIS)
        (web, cookie HttpOnly+CSRF)     token → PaSecure (Keystore)     token → safeStorage (DPAPI)
                 │                              │                             │
                 └──────────────── HTTPS · CORS explícito · Bearer/Cookie ────┘
                                              ▼
                  https://region.aprep.net/pasaporte/api/v1   (backend-integration/, PHP 8.4)
                  App → Router → Servicios (Auth, Catalog, Passport, Gamification, Checkin, Album)
                                              ▼
                  MariaDB existente · SOLO tablas pa_* (migraciones aditivas y reversibles)
                  LibraryAdapter → Local (pa_lecturas) | CE360 (BLOQUEADO: código no entregado)
```

## Decisiones
| Tema | Decisión | Justificación |
|---|---|---|
| Interfaz | Web responsiva única, sin framework (ES modules + Vite 6) | Un solo código para web/APK/EXE, bundle pequeño (~60 kB JS inicial), sin dependencias de UI genéricas (Material/Bootstrap prohibidos por diseño). |
| Android | Capacitor 7.6.10 | Empaqueta el bundle local (funciona sin red para la interfaz), hoja de compartir nativa, botón Atrás, plugin nativo propio para almacenamiento cifrado. Permisos: solo `INTERNET`. |
| Windows | Electron 45 + NSIS (electron-builder 26) | Instalador EXE real con accesos directos y desinstalador; `safeStorage` (DPAPI) para el token; Chromium estable para la fidelidad visual. Tauri descartado: WebView2 varía por equipo y el toolchain no era verificable aquí. |
| Backend | PHP 8.4 sin framework, PSR-4, PDO con consultas preparadas | Se integra junto a CE360 sin imponer framework; carpeta y prefijo propios. |
| Datos | Prefijo `pa_`, sin FK hacia tablas de CE360 | No altera tablas existentes; reversible. |
| Aislamiento | El contenedor carga solo su bundle; enlaces externos al navegador del sistema; el API no enruta módulos educativos | Cumple «sin acceso a Arena/campeonato/ORCA/gestión académica». |
| Verdad | Servidor como única fuente de sellos, visitas y monedas | El cliente solo envía tipo de evento + referencia + Idempotency-Key. |

## Navegación (hash)
`#/bienvenida` registro · `#/inicio` · `#/distritos` · `#/distrito/:slug` · `/contenidos` · `/historia` · `/videos` · `/audios` · `/referencias` · `/galeria` · `#/destino/:slug` · `#/lectura/:id` · `#/rutas` · `#/ruta/:slug` · `#/mapa` · `#/pasaporte` · `#/pasaporte/sellos` · `#/album` · `#/monedas` · `#/monedas/coleccion` · `#/retos` · `#/checkin[/:codigo]` · `#/novedades` · `#/ajustes` · `#/privacidad` · `#/verificar/:token`.
«Mi Pasaporte» está en la barra inferior (móvil) y lateral (escritorio) de todas las pantallas con cromo y vuelve al contexto anterior con el botón ← o Atrás de Android.

## Escritorio
≥1024 px: navegación lateral (250 px) + contenido centrado (máx. 860–940 px, no se estira el móvil) + panel derecho con pasaporte, monedas, progreso y sellos. 640–1023 px: columna centrada de 720 px.

## Offline y sincronización
- Interfaz y recursos gráficos incluidos en el APK/EXE.
- Respuestas públicas (catálogo, contenidos) en caché local limitada (80 entradas) con aviso «Sin conexión · mostrando la última copia».
- Datos privados (pasaporte, sellos, monedas, álbum) no se cachean; sin red muestran error honesto.
- Eventos de actividad (audio/video/lectura) sin red quedan en cola con su Idempotency-Key y se reenvían al reconectar; la UI dice «pendiente», nunca «guardado».
- Check-in y subida de fotos requieren conexión.

## Actualizaciones y compatibilidad
- Contenido: se actualiza en el backend sin publicar nuevas versiones de la app.
- API versionada (`/v1`); cambios incompatibles irían a `/v2` manteniendo `/v1` mientras existan apps instaladas.
- Migraciones numeradas `NNN_*.up.sql`/`down.sql`, registradas en `pa_migraciones`.
- `versionCode`/`version` de APK/EXE se incrementan en cada publicación.
