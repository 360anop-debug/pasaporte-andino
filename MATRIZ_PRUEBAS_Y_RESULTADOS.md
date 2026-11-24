# Matriz de pruebas y resultados

Estados: **COMPILADO** · **INSTALADO_Y_PROBADO** · **PARCIAL** (instalado, parte de las verificaciones pendientes) · **BLOQUEADO** · **NO_ENTREGADO**.
Repositorio CI: `360anop-debug/pasaporte-andino` (GitHub Actions, workflow «Pasaporte Andino CI»).

## Estado de artefactos
| Artefacto | Estado | Evidencia |
|---|---|---|
| Backend PHP 8.4 | INSTALADO_Y_PROBADO | PHPUnit 22 pruebas / 163 aserciones con PHP 8.4.x + MariaDB 11.4; migraciones up→down→up (CI, 9 ejecuciones verdes) |
| Web (`/pasaporte`) | INSTALADO_Y_PROBADO (staging local) | E2E 10/10 en Chromium contra API real; 168 capturas en 6 tamaños sin errores JS |
| `PasaporteAndino-Setup.exe` | INSTALADO_Y_PROBADO | Windows Server 2022 (runner real): instalación silenciosa, accesos directos, registro de desinstalación, E2E 20/20 sobre la app instalada, desinstalación limpia; EXE de producción instalado, abierto y desinstalado (6 ejecuciones verdes) |
| `PasaporteAndino-Android.apk` | ver sección Android | Firma v1+v2 verificada (apksigner), solo permiso INTERNET (aapt2) |
| `PasaporteAndino-Android.aab` | COMPILADO | Para Google Play (firma del propietario pendiente) |

## Android (emulador, imagen AOSP, renderizado por software)
| Verificación | Resultado | Ejecución |
|---|---|---|
| Instalación / desinstalación (staging y release) | OK | todas las ejecuciones con emulador |
| Flujo funcional completo 10/10 (registro con foto, pasaporte, catálogo, distrito, video/audio, lector, check-in QR → sello+monedas, álbum, rutas, ES/EN) | OK en API 34 | run 45365077942 (`api34-flujo`) |
| Hoja de compartir nativa (ChooserActivity) | OK | run 45365077942 (`api34-nativo`) |
| Orientación horizontal | OK | run 45365077942 |
| Sesión persistente tras cierre forzado (EncryptedSharedPreferences, sin token en localStorage) | OK | run 45365077942 |
| Aviso de WebView antigua (Chromium 83, API 30) | OK | runs 45360561570 y 45365077942 |
| Botón Atrás de Android | **PENDIENTE de re-verificar**: se corrigió un error real (cerraba la app tras navegar con enlaces) y el teclado abierto en la prueba; la ejecución de verificación no pudo iniciarse (bloqueo de facturación de GitHub Actions) | — |
| Selector de fotos del sistema | **PENDIENTE** (misma causa) | — |
| Retorno desde otra app | **PENDIENTE** (prueba ajustada a reciclaje de proceso por Android) | — |
| Primer arranque del APK de producción sin API desplegada | Mejorado: tiempo máximo de 5 s y pantalla de bienvenida; pendiente de capturar en emulador | — |

## Backend (PHPUnit, MariaDB real)
Públicos (salud, config, territorios, búsqueda, filtros, demo oculto en producción, rutas, biblioteca local/CE360 bloqueada, módulos educativos no enrutables, CORS, Open Graph, JSON inválido/método) · Viajero (minimización de datos sin DNI, códigos no predecibles, QR sin PII, 401/409, cookie+CSRF, registro/login/logout/rate limit, check-in firmado idempotente, códigos expirados/revocados/agotados, eventos validados en servidor, reversión y revocación auditadas, álbum privado con aislamiento, foto de perfil y eliminación de cuenta).

## Web E2E (Chromium, staging local) — 10/10
Arranque · validación cliente · registro con foto · inicio y Mi Pasaporte desde la barra · catálogo/búsqueda/filtro · distrito/historia/video/audio · lector con progreso en servidor · check-in QR → sello y monedas · álbum privado · rutas e idioma EN/ES.

## Windows instalado — 20/20
Las 10 anteriores + escritorio con navegación lateral y panel (1366×768) · sin desbordes a 1920×1080, 1024×700, 900×620 · maximizar/restaurar · enlaces externos fuera de la app · sesión cifrada tras reiniciar · DPI 125 % y 150 % · sin red (corte real del backend): aviso honesto y caché pública.

## Visual
Capturas en 360×800, 393×852, 412×915, 768×1024, 1366×768, 1920×1080 (`qa/capturas/web`), comparativas con mapas de diferencias (`qa/capturas/comparativas`), capturas del EXE instalado y del APK en emulador.

## Defectos encontrados por las pruebas y corregidos
1. Botón Atrás de Android cerraba la app tras navegar con enlaces → pila de historial real en el router.
2. Arranque bloqueado si el API no responde → tiempo máximo por petición y memoria offline del pasaporte.
3. Pantalla en blanco con WebView antigua → aviso de actualización.
4. Carrera de arranque (formulario re-renderizado) → «lista» solo tras el primer render.
5. Menús/hojas abiertos persistían al navegar → se cierran en cada cambio de ruta.
6. Desbordes horizontales en 360 px y título del saldo → corregidos.
7. Vulnerabilidades de dependencias (Capacitor crítica, Vite, Electron, tar) → actualizadas.

## Bloqueo actual de CI
Desde la ejecución #23 GitHub no inicia trabajos: «The job was not started because recent account payments have failed or your spending limit needs to be increased». No es un fallo de código (0 pasos, sin runner). Requiere acción del propietario en *Settings → Billing and plans* o hacer público el repositorio.
