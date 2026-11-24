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

## Pasos para completar la integración
1. Entregar el código de CE360 (o acceso al repositorio) y un volcado anonimizado de esquema.
2. Ejecutar `scripts/inspeccion.sh <kit> <ruta-ce360>` y completar esta matriz con rutas/tablas reales.
3. Implementar `Ce360LibraryAdapter::find()` (SELECT preparado, usuario de solo lectura) y su prueba de contrato.
4. Opcional: SSO con la sesión de CE360 si existe un mecanismo documentado.
