# CLAUDE.md — Pasaporte Andino (Cultura Educa 360) · instrucciones para Claude Code

Lee este archivo completo antes de actuar. Trabajas sobre un proyecto **ya construido**: NO lo reinicies, NO lo
reescribas desde cero, NO sustituyas recursos del Kit Maestro por diseños simplificados. Tu misión es **terminarlo**:
verificar en la laptop del propietario lo que la nube no pudo verificar, corregir lo que falle y entregar.

Idioma de trabajo y de los documentos: **español**.

## 1. Fuente de verdad
- `docs/ORDEN_MAESTRA_CLAUDE_PASAPORTE_ANDINO.md` — especificación completa del propietario (obligatoria).
- `docs/referencias_visuales/01…07*.png` — las 7 composiciones aprobadas (especificación visual de primer orden).
- `MATRIZ_FIDELIDAD_VISUAL.md`, `MATRIZ_PRUEBAS_Y_RESULTADOS.md`, `LIMITACIONES_Y_PENDIENTES.md`, `AUDITORIA_*.md`, `docs/*.md`.

### Reglas no negociables (resumen de la Orden Maestra)
1. No declarar nada terminado sin haberlo **ejecutado y verificado**; registrar evidencia (capturas, logs, SHA-256).
2. Nunca renombrar un ZIP como APK/EXE ni entregar instaladores no compilados realmente.
3. No inventar tablas, endpoints, credenciales, contenidos culturales, ubicaciones ni cifras (los números de las
   referencias — 1,250 monedas, 8/13, 62 % — son ilustrativos; la app usa datos reales del servidor).
4. Sin DNI. Datos mínimos. QR con token opaco. Fotos privadas. Monedas simbólicas sin valor monetario.
5. Sellos/visitas solo por check-in con QR firmado o corrección administrativa auditada — nunca por un botón.
6. La plataforma educativa de CE360 no se toca; el módulo usa solo tablas `pa_*` y rutas `/pasaporte`, `/pasaporte/api`.
7. Módulos educativos (Arena, campeonato, ORCA 360, gestión académica) **no** accesibles desde la app.
8. Nada de secretos ni keystores en el repositorio ni en el ZIP.
9. Producción (`region.aprep.net`) solo tras staging, backup y **aprobación explícita del propietario**.

## 2. Estado actual (verificado en la nube)
| Componente | Estado | Evidencia |
|---|---|---|
| API PHP 8.4 + MariaDB (`backend-integration/`) | Probado | 25 pruebas / 176 aserciones; PHP 8.4 en CI (9 ejecuciones verdes) |
| Web (`web-tourism/`) | Probado | E2E 10/10 Chromium; 168 capturas en 6 tamaños sin errores JS |
| EXE Windows (`windows/`, Electron 45 + NSIS) | INSTALADO_Y_PROBADO en CI | instalación silenciosa, E2E 20/20 sobre la app instalada, desinstalación limpia |
| APK Android (`android/`, Capacitor 7.6) | PARCIAL | Flujo 10/10 en emulador Android 14; compartir nativo, rotación y sesión cifrada OK. **Pendiente**: botón Atrás (corregido en código, sin re-verificar), selector de fotos, retorno desde otra app |
| Integración CE360 | BLOQUEADA | Código de CE360 no entregado; adaptador configurable listo (`config/ce360.example.php`) |
| GitHub Actions | BLOQUEADO por facturación | «recent account payments have failed or your spending limit…» — no es fallo de código |

Por eso el trabajo restante se hace **en esta laptop**: aquí hay Windows real (EXE) y se puede usar un teléfono
Android real por USB o un emulador con aceleración por hardware.

## 3. Estructura
```
backend-integration/  API PHP (src/, migrations/, bin/migrate.php|seed.php|admin.php|ce360-verificar.php, tests/)
web-tourism/          Interfaz única (Vite). Modos: production, staging, android-staging (10.0.2.2), android-device (localhost + adb reverse)
android/              Capacitor (android/android = proyecto Gradle; plugin nativo PaSecure = Keystore)
windows/              Electron + electron-builder NSIS
qa/e2e/               flujo.cjs (compartido) · web.cjs · android.cjs · windows.cjs · staging-env.cjs
qa/scripts/           capturas.mjs (6 tamaños) · comparativas.py (referencia | implementación | mapa de diferencias)
scripts/              staging-router.php, staging.env.sh, empaquetar-entrega.sh, build-*.sh/ps1, deploy-staging.sh, rollback.md
scripts/local/        backend-staging.sh · probar-apk.sh · probar-exe-windows.ps1 · empaquetar-local.sh
scripts/assets/       pipeline del Kit → web-tourism/public/assets (no editar los assets a mano)
```

## 4. Preparar la laptop (una vez)
Comprueba cada herramienta con `--version` y anota las versiones en `qa/logs/entorno-laptop.txt`.
- **Git** (en Windows, Git for Windows: aporta Git Bash, que usan los scripts `.sh`).
- **Node.js 22 LTS** y npm.
- **PHP 8.4** con extensiones `pdo_mysql, gd, fileinfo, mbstring, exif, intl` (Windows: zip oficial de windows.php.net o Laragon/XAMPP con PHP 8.4; habilitar las extensiones en `php.ini`). **Composer 2**.
- **MariaDB 10.6+** (o MySQL 8). Crear BD/usuario como indica la cabecera de `scripts/local/backend-staging.sh`.
- **Android**: Android Studio (SDK Platform 35, Build-Tools, Platform-Tools en PATH), **JDK 21**. Teléfono con
  «Opciones de desarrollador → Depuración USB» o un AVD Android 14 (Google APIs x86_64) con aceleración por hardware.
- **Windows**: PowerShell 7 para `probar-exe-windows.ps1`.
- **Python 3** con `pillow` (solo para `qa/scripts/comparativas.py`).
- **Playwright** (QA): `npm --prefix qa install` y `npx --prefix qa playwright install chromium`.
Si algo no se puede instalar, **detente y díselo al propietario** con el comando exacto que falla.

## 5. Plan de trabajo (en este orden; no saltes pasos)
Al terminar cada tarea: actualiza `MATRIZ_PRUEBAS_Y_RESULTADOS.md` con el resultado real y haz commit.

### T1 — Backend local y pruebas
1. `cd backend-integration && composer install`
2. Crea la BD de pruebas `pa_test` (mismo usuario `pa_app`/`pa_local_dev`; `phpunit.xml` ya trae esos valores por defecto) → `vendor/bin/phpunit` (Windows: `vendor\bin\phpunit.bat`).
   **Criterio**: todas las pruebas en verde con PHP 8.4 (anota la versión exacta).
3. Terminal aparte: `bash scripts/local/backend-staging.sh` → `http://127.0.0.1:8080/pasaporte/` responde y `/pasaporte/api/v1/salud` da `{"ok":true,...}`.

### T2 — Web
`cd web-tourism && npm ci && npm test`, luego `node qa/e2e/web.cjs http://127.0.0.1:8080/pasaporte/ qa/capturas/web-e2e 393 852`.
**Criterio**: 10/10 OK y sin errores JS.

### T3 — Windows (EXE real en esta máquina)
Con el backend en marcha: `pwsh scripts/local/probar-exe-windows.ps1`.
**Criterio**: instalación silenciosa, accesos directos, entrada en «Aplicaciones», E2E 20/20 sobre la app instalada,
desinstalación sin restos, EXE de producción abre la bienvenida. Prueba también **manual**: instalar con doble clic
(asistente, aviso SmartScreen documentado), abrir, navegar, cerrar, reabrir (sesión persistente), desinstalar.
Nota: la prueba «sin red» detiene `php.exe` a propósito → vuelve a lanzar el backend después.

### T4 — Android (APK real)
Conecta el teléfono (o arranca el AVD), backend en marcha, y en Git Bash: `bash scripts/local/probar-apk.sh`.
**Criterio**: instalación, flujo 10/10 y comprobaciones nativas **todas OK**: botón Atrás vuelve a la pantalla
anterior (no cierra la app), selector de fotos del sistema se abre, hoja de compartir nativa, retorno desde otra app
conserva la sesión, orientación horizontal, sesión persistente tras cierre forzado sin token en localStorage;
APK de producción se instala, abre la bienvenida y se desinstala. Repite **manualmente** en el teléfono: registro con
foto (cámara y galería), denegar permisos, compartir a WhatsApp/Facebook/Instagram (tarjeta), Atrás en varias pantallas.
Si falla algo: lee `qa/capturas/android-local/resultado.json` y `adb logcat`, corrige la **causa real**, repite.

### T5 — Fidelidad visual
1. `node qa/scripts/capturas.mjs http://127.0.0.1:8080/pasaporte/ qa/capturas/web 360x800 393x852 412x915 768x1024 1366x768 1920x1080`
2. `python qa/scripts/comparativas.py docs/referencias_visuales qa/capturas/web/393x852 qa/capturas/comparativas`
3. Abre cada hoja de `qa/capturas/comparativas/` y compárala con su referencia: disposición, ornamentación, proporciones,
   personajes, legibilidad, barra inferior, recortes. Corrige diferencias **críticas** en `web-tourism/src/styles/*.css`
   y pantallas; nunca reemplaces arte del kit por formas simples. Actualiza `MATRIZ_FIDELIDAD_VISUAL.md`.
   No inventes un «% de similitud».

### T6 — Entrega
1. `bash scripts/local/empaquetar-local.sh` → `entrega/PASAPORTE_ANDINO_ENTREGA_FINAL.zip` (+ `MANIFEST_SHA256.json`).
   Solo incluye APK/EXE que **tú** compilaste e instalaste en T3/T4.
2. Actualiza README, CHANGELOG, MATRIZ_PRUEBAS (estado por artefacto: COMPILADO / INSTALADO_Y_PROBADO / BLOQUEADO /
   NO_ENTREGADO con SHA-256), LIMITACIONES.
3. Publicación descargable: si GitHub Actions sigue bloqueado, crea una **Release** (no consume minutos):
   `gh release create v1.0.0 instaladores/PasaporteAndino-Android.apk instaladores/PasaporteAndino-Setup.exe entrega/PASAPORTE_ANDINO_ENTREGA_FINAL.zip --title "Pasaporte Andino 1.0.0" --notes-file CHANGELOG.md`
   (si un archivo supera 2 GB, divídelo). Si Actions vuelve a funcionar: `gh workflow run ci.yml` genera los artefactos
   `PasaporteAndino-Android`, `PasaporteAndino-Windows` y `PASAPORTE_ANDINO_ENTREGA_FINAL`.
4. Commit y push a `main`. Informa al propietario: qué quedó verificado, SHA-256 y enlaces de descarga.

### T7 — CE360 (solo cuando el propietario entregue su código/esquema)
Sigue «Pasos para completar la integración» de `AUDITORIA_REUTILIZACION_CE360.md`. Nunca inventes el esquema.

### T8 — Staging/Producción (solo con aprobación explícita)
`docs/DEPLOY_PRODUCCION.md` + `scripts/deploy-staging.sh` + `scripts/rollback.md`. Backup antes; no tocar CE360.

## 6. Trampas ya conocidas (no repitas estos errores)
- **Atrás de Android**: si el teclado en pantalla está abierto, el primer «Atrás» solo lo oculta (la prueba hace `blur()`).
- **Emuladores con GPU por software** se caen en pantallas pesadas: usa teléfono real o AVD con aceleración por
  hardware (`-gpu host`); en CI se usa `-gpu guest`.
- **WebView antigua** (< Chromium 88, p. ej. AOSP API 30): la app muestra aviso de actualización; es lo esperado.
- **La app marca `window.__paReady` solo tras el primer render** — no cambies eso (las pruebas dependen de ello).
- **CORS**: el origen del APK de pruebas es `http://localhost` (staging) y el del EXE `app://pasaporte`; están en `PA_CORS_ORIGINS`.
- **PHP en Windows**: un proceso iniciado en otra terminal se detiene si cierras esa terminal.
- **`demo-media/` y `es_demo=1`** existen solo en staging; el build de producción los excluye (no lo cambies).
- **Firma**: sin `PA_KEYSTORE_*` se usa un keystore de PRUEBA local (no publicable en Play). El keystore real del
  propietario nunca se versiona.
- **Assets**: se regeneran con `scripts/assets/*.py` desde el Kit Maestro; no edites `web-tourism/public/assets` a mano.
- **Commits**: no incluyas identificadores de modelo en mensajes; no subas `instaladores/`, `entrega/`, keystores ni `.env.local`.

## 7. Definición de terminado
Solo puedes decir «terminado» cuando: T1–T6 estén en verde con evidencia en el repositorio, el APK y el EXE hayan sido
**instalados, abiertos, navegados, reabiertos con sesión persistente y desinstalados** en esta laptop/teléfono, el ZIP
esté publicado y descargable, y los documentos reflejen el estado real. Lo que dependa del propietario (código CE360,
contenido cultural real, keystore y certificado, despliegue en producción) se entrega documentado como pendiente
con su causa — no como terminado.
