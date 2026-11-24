# Auditoría de seguridad

## Controles implementados y verificados
| Riesgo | Control | Evidencia |
|---|---|---|
| SQLi | PDO con `ATTR_EMULATE_PREPARES=false`, consultas preparadas; la única interpolación es la lista de marcadores `?` | revisión + `qa/reportes/auditoria-automatica.txt` |
| XSS | Cliente inserta datos solo con `textContent`; `innerHTML` limitado a SVG estáticos y QR generado localmente; CSP sin `unsafe-inline` para scripts; API con `Content-Security-Policy: default-src 'none'` | `src/ui.js`, `vite.config.js` |
| CSRF (web) | Cookie HttpOnly SameSite=Lax + doble envío `X-PA-CSRF` | `testWebCookieSessionRequiresCsrfForMutations` |
| CORS | Lista explícita de orígenes; OPTIONS de origen no permitido → 403 | `testCorsAllowlist` |
| Tokens | 256 bits aleatorios; en BD solo SHA-256; Android: EncryptedSharedPreferences/Keystore; Windows: safeStorage/DPAPI; web: nunca accesible a JS; nunca en localStorage | `PaSecurePlugin.java`, `windows/src/main.js`, E2E «sesión persistente» |
| Fuerza bruta | Rate limit en invitado, registro, login (IP y correo), check-in, subidas, foto | `testRegisterLoginLogoutAndRateLimit` |
| Contraseñas | `password_hash` (bcrypt/argon según PHP), mínimo 10, rehash, verificación en tiempo constante con usuario inexistente | `Auth.php` |
| Fraude de visitas/sellos | QR firmado HMAC-SHA256 con expiración, nonce revocable, límite de usos; una visita por lugar; abrir detalle/mapa no otorga nada | `testCheckinGrantsVisitStampCoinsAndIsIdempotent`, `testExpiredRevokedAndExhaustedCodes` |
| Puntos manipulados | El cliente no envía cantidades; eventos permitidos acotados; lectura requiere último capítulo + tiempo mínimo; deduplicación por contenido | `testClientEventsAreValidatedServerSide` |
| Idempotencia / carreras | `UNIQUE(pasaporte, idempotency_key)` y `UNIQUE(pasaporte, dedupe_key)`; transacciones y `FOR UPDATE` en códigos | esquema 001 |
| Subidas | Tamaño máx., tipo real (finfo + getimagesize), dimensiones, re-codificación GD (elimina EXIF/GPS y cargas útiles), nombres aleatorios, almacenamiento fuera del webroot, servido solo al propietario con `nosniff` | `testAlbumPrivateUploadListServeDelete` |
| IDOR | Todas las consultas privadas filtran por `pasaporte_id` de la sesión | prueba de aislamiento entre viajeros |
| PII | Sin DNI; QR con token opaco; verificación pública sin nombre; compartir solo datos públicos; exportación y borrado de cuenta; auditoría sin PII | `testPassportCreationValidatesAndMinimizesData`, `testProfilePhotoAndAccountDeletion` |
| Menores | Declaración de minoría + autorización de tutor obligatoria; fotos siempre privadas | idem |
| Configuración | Secretos solo por entorno; producción exige `PA_SECRET` ≥32 y prohíbe demo; build de producción verificado sin URLs locales ni `demo-media` | `testProductionRefusesDemoAndWeakSecret`, job CI *web* |
| Contenedores | Android: solo permiso INTERNET, sin backup del almacén, FileProvider limitado a `cache/compartir`; Electron: contextIsolation, sandbox, sin nodeIntegration, permisos denegados, navegación bloqueada, IPC con validación | manifiesto, `main.js` |
| Módulos excluidos | Sin rutas; prueba automatizada | `testExcludedEducationalModulesAreNotRoutable` |

## Dependencias
- Composer: sin avisos (`composer audit`).
- Corregidos durante el trabajo: Capacitor Android 7.4.2 → **7.6.10** (aviso crítico: contenido remoto en el origen de la app vía proxy interno), Vite 6.3.5 → 6.4.6, Electron 35 → **45.4.1**, electron-builder 25 → 26.18.0 (tar, extract-zip).
- Pendiente aceptado: `minimatch` (moderado, ReDoS) dentro de las herramientas de *build* de electron-builder para macOS/DMG; no se distribuye en el instalador.

## Pendientes de seguridad
- Firma de código Windows y firma de release Android con claves del propietario.
- HSTS/TLS y cabeceras en el servidor real; revisión del virtual host.
- Política de privacidad: completar datos del responsable y publicarla en URL pública.
- Pentest externo previo a la publicación masiva.
