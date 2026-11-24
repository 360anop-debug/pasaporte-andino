# Matriz de fidelidad visual

Método: cada referencia se abrió a resolución original; se recortó cada pantalla de teléfono y se comparó con la captura
equivalente a 393×852 (`qa/capturas/comparativas/*.jpg`: referencia | implementación | mapa de diferencias).
**No se declara porcentaje de similitud**: las referencias son composiciones conceptuales con datos ficticios y marco de teléfono;
el mapa de diferencias es indicativo. Capturas de todas las pantallas en 360×800, 393×852, 412×915, 768×1024, 1366×768 y
1920×1080: `qa/capturas/web/<tamaño>/`. 0 errores de consola en las 168 capturas.

## Sistema visual (tokens extraídos por muestreo de píxeles)
| Token | Valor | Origen |
|---|---|---|
| Borgoña cabecera | `#670b2a` | 03, cabecera de distritos |
| Borgoña CTA | `#7b0027` | 06, botón «Ver mi Pasaporte de Sellos» |
| Borgoña activo | `#8a0728` | 03, ítem activo de la barra |
| Crema tarjeta | `#fcd993` | 03, mosaicos de inicio |
| Oro moneda | `#fce04f` | 07, moneda |
| Pergamino | `#f9e6cc` | 02, formulario |
| Tinta | `#4d1e1a` | 07, títulos |
| Verde progreso | `#11a900` | 07, barra de colección |
Tipografías (OFL, empaquetadas offline): Alegreya 700/800 (títulos dorados y ornamentales), Cinzel (mayúsculas del pasaporte),
Nunito (interfaz, mosaicos y etiquetas en sans como en las referencias).

## Por pantalla
Leyenda: ✔ fiel · ◐ fiel con adaptación justificada · ✖ discrepancia.

| Ref. | Pantalla | Disposición | Ornamento | Proporciones | Imagen/personajes | Legibilidad | Interacción | Barra inf. | Notas / adaptaciones |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Identidad global | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | ✔ | Concepto transversal (marca, personajes, catálogo, coleccionables, compartir). El panel de administración del concepto no se incluye en APK/EXE (excluido por contrato). |
| 02-izq | Registro | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | n/a | **DNI sustituido** por foto opcional (minimización de datos, Orden §3.1). Se añaden consentimiento, menor de edad y «Explorar sin registrarme». Fondo: plaza del kit (no hay fondo de ruinas como el de la referencia). |
| 02-der | Pasaporte + bienvenida | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Grabado inferior recortado de `pagina-identidad.webp`; QR real con token opaco; código PA-XXXX-XXXX no predecible. |
| 03-izq | Inicio | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Añadida franja con nombre y monedas reales (como en 01). Campana → novedades reales del libro mayor. |
| 03-der | Distritos | ✔ | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | Recuentos «N lugares» reales (no 12/8/7…). 14 territorios (13 provincias + Los Baños del Inca), no 13 de mockup. Territorios sin ilustración: tarjeta textil honesta. Chota/Jaén/San Ignacio usan ilustraciones **provisionales** del kit. |
| 04-izq | Portada distrito | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Texto bilingüe principal + secundario en cursiva como la referencia. |
| 04-der | Contenidos | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | ✔ | Pestañas desplazan a secciones; con un solo video/audio demo se muestran menos miniaturas que en la referencia (datos reales). Se añade «Lugares para visitar». |
| 05 | Historia | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Resumen / Línea de tiempo / Personajes funcionales; «Sabías que…» desde el servidor. |
| 05 | Videos | ✔ | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | Reproductor real con play/pausa/avance/pantalla completa y subtítulos si existen. Video demo técnico. |
| 05 | Audios | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Onda de progreso real, avance y lista. |
| 05 | Referencias | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Enlazadas por ID al adaptador de biblioteca; lector con capítulos, tamaño de letra, reanudación. |
| 05 | Rutas | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Recuentos y duraciones del servidor; detalle con paradas y progreso verificado. |
| 06-izq | Álbum | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | ✔ | Contadores reales (sellos x/14, fotos, distritos). Fotos privadas del usuario en polaroid con chincheta; ✔ solo si la visita está verificada. |
| 06-der | Pasaporte de sellos | ✔ | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | Sellos de Cajamarca, Baños del Inca y Celendín desde `originales_png`; el kit no trae arte para los otros 11 → sello vectorial generado con nombre real; bloqueados en gris con candado. Progreso real (no 8/13 · 62 %). |
| 07-izq | Mis Monedas | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Saldo y categorías derivados del libro mayor (no 1,250). Aviso legal de valor simbólico. |
| 07-der | Colección | ✔ | ✔ | ✔ | ◐ | ✔ | ✔ | ✔ | Monedas del kit para 3 territorios; el resto usa `moneda-base` con inicial; bloqueadas con `moneda-oculta`. |

## Escritorio (Windows/web ≥1024 px)
Navegación lateral con logo, contenido centrado sin estirar el móvil (máx. 860–940 px) y panel derecho con pasaporte, monedas,
progreso y sellos (`qa/capturas/web/1366x768`, `1920x1080`). Tablet: columna de 720 px centrada con fondo textil.

## Discrepancias remanentes (no críticas)
1. Pequeño residuo de halo bajo el brazo de Atahualpa en `atahualpa-delia` (recorte original del kit; limpiado de forma automática sin herramientas de IA por bloqueo de red). Requiere retoque manual del ilustrador.
2. La moneda del saldo usa `moneda-base` (el emblema de pirámide de la referencia no existe en el kit).
3. Sellos/monedas de 11 territorios sin arte específico en el kit.
4. Fondos de bienvenida/álbum/monedas usan las ilustraciones disponibles del kit (plaza, Cumbemayo), no exactamente los paisajes de las composiciones.
