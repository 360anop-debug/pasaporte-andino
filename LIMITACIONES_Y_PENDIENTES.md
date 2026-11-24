# Limitaciones y pendientes reales

| # | Pendiente | Causa | Impacto | Cómo resolver |
|---|---|---|---|---|
| 1 | Integración con Cultura Educa 360 (Biblioteca Viva, sesiones, medios) | Código/esquema de CE360 **no entregado**; `region.aprep.net` inaccesible desde el entorno de trabajo | La biblioteca muestra «no conectada» honestamente; autenticación propia del módulo | Entregar código/esquema → completar `Ce360LibraryAdapter` (ver AUDITORIA_REUTILIZACION_CE360.md) |
| 2 | Contenido cultural real (historia, leyendas, audios, videos, referencias, fotos con licencia, ubicaciones validadas) | No se entregó inventario verificado; prohibido inventar | Producción arranca solo con territorios, sellos y monedas | Carga editorial con fuente/licencia (`pa_contenidos`, `pa_destinos`) |
| 3 | Firma de release Android del propietario y publicación en Google Play | Keystore del propietario no disponible (correcto: no debe estar en el repo) | APK entregado firmado con clave de PRUEBA efímera | `scripts/build-android.sh` con `PA_KEYSTORE_*`; AAB para Play |
| 4 | Firma de código Windows | Sin certificado | Aviso SmartScreen al instalar | `CSC_LINK`/`CSC_KEY_PASSWORD` en `build-windows.ps1` |
| 5 | Despliegue en region.aprep.net | Requiere acceso al servidor, staging y aprobación del propietario (gate obligatorio) | API de producción aún no existe → APK/EXE de producción muestran estado «sin conexión» en datos remotos | `docs/DEPLOY_PRODUCCION.md` |
| 6 | Prueba en dispositivo Android físico | No disponible | Validado en emulador Android 14 (CI) | Instalar APK en teléfonos reales y repetir checklist |
| 7 | Arte de sellos/monedas para 11 territorios; halo residual en `atahualpa-delia` | No incluidos/perfectos en el kit | Sello/moneda genéricos con nombre real | Encargar arte al ilustrador y reemplazar en `pa_sellos` |
| 8 | Ilustraciones provisionales (Chota, Jaén, San Ignacio) | Marcadas «provisional» en el manifiesto del kit | Se rotulan «Ilustración» | Sustituir por fotografías con licencia |
| 9 | Notificaciones push, chat IA, voz animada de guías | Fuera de alcance / sin activos | — | Solo si se aprueba explícitamente |
| 10 | Pentest externo y revisión legal de privacidad (datos del responsable) | Requiere terceros | — | Antes de publicación masiva |
| 11 | Aviso moderado `minimatch` en tooling de electron-builder (DMG macOS) | Dependencia de compilación | No se distribuye | Actualizar cuando electron-builder lo publique |
