# Auditoría de reutilización — Cultura Educa 360

## Estado de la entrada obligatoria n.º 2 (código vigente de CE360)
**NO ENTREGADO.** Los tres ZIP recibidos contienen solo el Kit Visual. No se recibió `ce360_app`, `public_html`, configuración,
migraciones ni vistas, y ningún repositorio accesible en la sesión corresponde a CE360. `region.aprep.net` no es alcanzable desde
el entorno de trabajo (bloqueo de red). Por decisión del propietario se construyó el módulo con **capa adaptadora** y la
integración real quedó **BLOQUEADA** y documentada. No se inventaron endpoints, tablas, claves ni contenidos de CE360.

## Matriz
| Área de CE360 | Decisión | Detalle |
|---|---|---|
| Autenticación / sesiones CE360 | NO INCLUIR (por ahora) | Autenticación propia del módulo (tablas `pa_usuarios`, `pa_sesiones`); no reemplaza ni lee la de CE360. Adaptable a SSO cuando se conozca el mecanismo real. |
| Biblioteca Viva | ADAPTAR (bloqueado) | `LibraryAdapter` con `LocalLibraryAdapter` (operativo) y `Ce360LibraryAdapter` (devuelve 503 `BIBLIOTECA_CE360_NO_CONFIGURADA`; la UI muestra estado honesto). Activar implementando `find()` en solo lectura sobre las tablas reales. |
| Medios (audio/video/imágenes) | ADAPTAR | `pa_contenidos.media_url` admite URL absolutas a los medios existentes de CE360 sin copiarlos. |
| Avatares / personajes | REUTILIZAR (kit) | Atahualpa, Delia y la llama del Kit Maestro (derivados con halo limpiado; originales intactos). No había audios/expresiones: no se promete voz. |
| Usuarios y permisos | CREAR (aislado) | Roles propios `viajero/editor/curador/admin`. |
| Migraciones | CREAR (aditivas) | Solo `pa_*`; reversibles; sin ALTER a tablas ajenas. |
| Campeonato escolar, Arena, ORCA 360, gestión académica, administración institucional | NO INCLUIR | Ninguna ruta del API ni de la app; prueba automatizada `testExcludedEducationalModulesAreNotRoutable`; el contenedor no navega fuera de su bundle. |
| Web actual de region.aprep.net | NO TOCAR | Despliegue en `/pasaporte` y `/pasaporte/api` con releases y symlink propios. |

## Inventario de recursos culturales reales
No se recibió inventario verificado (ID, título, distrito, licencia, fotografía, audio, vídeo, lectura). En consecuencia:
- Producción: solo organización territorial (13 provincias + Los Baños del Inca) y sellos/monedas por territorio.
- Staging: contenido `es_demo=1` marcado en pantalla «DEMO», con medios técnicos de prueba generados (no documentales).

## Adaptador preparado (sin inventar esquema)
`backend-integration/src/Library/Ce360LibraryAdapter.php` ya implementa la lectura **por configuración**:
- Mapeo de tablas/columnas reales en `config/ce360.php` (plantilla `config/ce360.example.php` con valores `<COMPLETAR>`; el archivo real queda fuera del repositorio).
- Lecturas con capítulos (tabla relacionada) o con texto único; filtro opcional de publicación; tipo de clave (`entero`/`texto`).
- Seguridad: identificadores validados `[A-Za-z0-9_]{1,64}` y citados; valores en consultas preparadas; solo `SELECT`; contraseña desde variable de entorno (`PA_CE360_DB_PASS`); se recomienda usuario MariaDB con `SELECT` exclusivo sobre esas tablas.
- Verificación previa: `php bin/ce360-verificar.php [id]` comprueba en `INFORMATION_SCHEMA` que existen tablas y columnas y lee una lectura de prueba.
- Pruebas: `tests/Integration/Ce360AdapterTest.php` con tablas ficticias de prueba `pa_test_ce360_*` (no representan el esquema real): mapeo, orden de capítulos, filtro de publicación, rechazo de inyección en identificadores, sin coerción de claves numéricas, detección de columnas inexistentes.
- Mientras `PA_LIBRARY_CE360` no sea `1` o el mapeo no sea válido, la API responde `503 BIBLIOTECA_CE360_NO_CONFIGURADA` y la interfaz lo muestra de forma honesta.

## Pasos para completar la integración
1. Entregar el código de CE360 (o acceso al repositorio) y un volcado anonimizado del esquema.
2. Ejecutar `scripts/inspeccion.sh <kit> <ruta-ce360>` e identificar la tabla real de lecturas/capítulos.
3. Copiar `config/ce360.example.php` a `config/ce360.php`, completar el mapeo y definir `PA_CE360_DB_PASS`.
4. `php bin/ce360-verificar.php <id_real>` → sin errores.
5. Activar `PA_LIBRARY_CE360=1` en staging, enlazar contenidos (`biblioteca_ref = ce360:<id>`) y validar con el lector.
6. Opcional: SSO con la sesión de CE360 si existe un mecanismo documentado.
