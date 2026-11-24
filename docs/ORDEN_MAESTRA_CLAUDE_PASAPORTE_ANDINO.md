# ORDEN MAESTRA INTEGRAL — PASAPORTE ANDINO
**Proyecto:** Cultura Educa 360 — Pasaporte Andino / Andean Passport
**Dominio definitivo:** https://region.aprep.net (sin tilde en DNS)
**Objetivo:** construir y verificar la experiencia turística íntegra, visualmente fiel a siete composiciones aprobadas, y generar APK Android + instalador EXE Windows + integración web segura.
**Destinatario:** Claude, agente implementador con acceso al repositorio, archivos, terminal y compiladores.
**Prioridad absoluta:** fidelidad visual, funcionalidad real, preservación de producción y entrega reproducible.

## 0. MANDATO OPERATIVO

Actúa como equipo completo de dirección de arte, frontend, backend PHP 8.4, integración, arquitectura, Android, Windows, QA, seguridad y despliegue. Ejecuta de principio a fin en el entorno disponible, sin generar una maqueta ni declarar terminado lo no probado. No trabajes por entregas parciales artificiales: organiza internamente tareas, comprueba resultados y entrega todos los artefactos solicitados en un único paquete final. No omitas pruebas por presión de tiempo. Si un compilador, certificado, credencial o acceso está ausente, documenta el bloqueo exacto y deja proyecto y comandos reproducibles; jamás renombres un ZIP como APK o EXE ni declares instaladores que no probaste.

### Entradas obligatorias
1. `PASAPORTE_ANDINO_KIT_MAESTRO_COMPLETO.zip` con carpeta `PASAPORTE_ANDINO_KIT_MAESTRO/`.
2. Código vigente de Cultura Educa 360 (`ce360_app`, `public_html`, configuración, migraciones, vistas, pruebas) facilitado por el propietario en repositorio o ZIP; inspeccionar la versión efectiva, no asumir que un parche empaquetado está aplicado.
3. Información de integración con `https://region.aprep.net`, obtenida de configuración legítima del proyecto; nunca inventar endpoints, claves, contraseñas, tablas o contenidos.

### Comprobación inicial obligatoria
- Descomprime los dos proyectos en directorios separados de trabajo, sin sobrescribir producción.
- Revisa `documentacion/LEEME_PARA_CLAUDE.txt`, `documentacion/MANIFEST.json`, calcula SHA-256 de cada recurso y comprueba la integridad del ZIP.
- Localiza las siete imágenes `referencias_visuales/01-concepto-general.png` a `07-monedas.png`, ábrelas a resolución original y extrae estructura visual, proporciones y elementos por pantalla. No dependas del contacto mosaico, que reduce detalles.
- Localiza `assets/` (50 recursos), `originales_png/` y detecta assets provisionales en manifiesto. El original PNG prima sobre SVG simplificado cuando se requiere ornamento detallado.
- Audita rutas, servicios, sesiones, mecanismos de autenticación, biblioteca, medios, avatares, permisos, migraciones y APIs existentes. Registra REUTILIZAR / ADAPTAR / CREAR / NO INCLUIR.
- Toma un inventario de recursos culturales reales: ID, título, región, distrito, ubicación geográfica si está acreditada, licencia, fotografía, audio, vídeo, lectura, relación con biblioteca. No uses contenidos ficticios como publicados.
- Audita rutas, almacenamiento, tipos de usuario, permisos y backups para impedir impacto en módulos educativos. Toda mutación de producción requiere respaldo y validación posterior; no editar producción a ciegas.

## 1. CONTRATO DE ALCANCE
**INCLUIR en APK y EXE:** registro/onboarding de viajero, identidad del pasaporte, exploración de distritos, destinos y fichas, historia cultural, fotografías, video/audio, Biblioteca Viva enlazada, referencias, mapas, rutas, álbum, sellos, progreso, monedas culturales coleccionables, compartir en redes, ajustes ES/EN, ayudas de Atahualpa/Delia y mascota del álbum o recompensas, cuando correspondan al diseño y al contenido verificado.
**EXCLUIR de APK y EXE sin afectar web:** campeonato escolar, Arena educativa, administración institucional, ORCA 360, gestión académica y cualquier otro módulo ajeno a edición turística. No son accesibles por ruta oculta o WebView genérica; delimitar allowlist de navegación y autorización backend.
**WEB:** conservar funcional la plataforma actual. Instalar edición turística en un espacio/ruta o aplicación independiente acordada por infraestructura; no reemplazar el sitio completo ni su autenticación. Integrar con servicios y recursos existentes de forma comprobada.
**No afirmar** que monedas tienen valor de mercado ni que visitar lugares físicos ocurrió basándose solo en pulsar un botón.

## 2. CONTRATO DE DISEÑO: FIDELIDAD A LAS SIETE IMÁGENES
Las imágenes aprobadas son especificación visual de primer orden. Se exige reproduccción fiel de composición, jerarquía, proporciones, ornamentación, texturas, paleta borgoña / oro imperial / pergamino, ilustraciones 3D, personajes, detalles andinos, tarjetas, sellos y navegación. NO reemplazar por una plantilla genérica Material/Bootstrap, ni reutilizar la imagen de referencia como captura de fondo con controles superpuestos. Cada vista debe construirse con elementos DOM reales, datos dinámicos y controles interactivos. Evitar textos rasterizados en fondos donde deban cambiar.

### Matriz exacta de referencias
- `01-concepto-general.png`: visión artística global, marca Pasaporte Andino / Andean Passport, homepage, personajes, portada, dashboard, catálogo de destinos y coleccionables. Sirve para identidad transversal, no es una sola pantalla literal.
- `02-registro.png`: portada/onboarding y formulario registro; identidad personal con foto, nombre, apellidos, código de pasaporte, nacionalidad, QR, datos dinámicos, botón de creación y pantalla de bienvenida. Usar permisos de cámara/galería seguros; minimización de datos personales.
- `03-distritos.png`: inicio con Atahualpa/Delia, selector ES/EN, accesos `Distritos de Cajamarca`, `Rutas Turísticas`, `Mi Pasaporte`, `Mi Álbum Fotográfico`, `Monedas Andinas`, `Retos y Recompensas`, barra inferior. Catálogo navegable, búsqueda y filtros. Nombres y número de distritos desde fuente oficial o datos validados: cifras de mockup no son fuente de verdad.
- `04-historia-contenidos.png`: portada de distrito (ej. Cajamarca), secciones historia, videos, audios, leyendas, referencias, galería y CTA `Explorar este distrito`; cada pestaña funcional y conectada con contenido real. Visualización legible de fuentes y créditos.
- `05-rutas-y-cultura.png`: secuencia de exploración: distritos, destino, historia, videos, audios, referencias literarias y rutas. Implementar navegación bidireccional, progreso de lectura, reproducción y pausa, listas filtrables, mapas y lugares vinculados.
- `06-album-y-sellos.png`: galería/álbum fotográfico personal, tarjetas con destinos visitados, sellos por distrito, estados bloqueado/desbloqueado, `Mi Progreso`, CTA `Ver mi Pasaporte de Sellos`, ilustración de llama y resumen. Progreso 8/13 y 62% de la imagen es ilustrativo: usar recuentos reales, sin precargar insignias falsas.
- `07-monedas.png`: panel `Mis Monedas Andinas`, total por actividades (visitas, rutas, cultura, actividades) y catálogo por distrito; estados de colección, monedas de oro, medallas, candados y recompensas. 1,250 y 69% del mockup no son valores reales. La moneda es simbólica, no canjeable por dinero salvo autorización regulatoria futura independiente.

### Recursos por sección (respetar nombres)
- Marca: `assets/marca/logo-pasaporte-andino.png`
- Personajes: `assets/personajes/atahualpa-guia.webp`, `delia-guia.webp`, `atahualpa-delia.webp`, `llama-recompensas.webp`
- Fondos: `assets/fondos_texturas/fondo-bienvenida.webp`, `fondo-interior.webp`, `textura-pergamino.webp`, `patron-textil.svg`
- Pasaporte: `assets/pasaporte/portada-pasaporte.webp`, `pagina-identidad.webp`, `insignia-bienvenida.webp`, `marco-foto.svg`, `sello-explorador.svg`
- Explorar: `assets/exploracion/cabecera-explorar.webp`, `tarjeta-*.webp`, `marcador-mapa.svg`, `marco-destino.svg`
- Cultura: `assets/cultura/cabecera-historia.webp`, `portada-video.webp`, `portada-leyendas.webp`, `biblioteca-cultural.webp`, `marco-audio.svg`, `marco-referencia.svg`
- Rutas: `assets/rutas/ruta-historica.webp`, `ruta-natural.webp`, `ruta-bienestar.webp`, `ruta-cultural.webp`, `insignia-ruta.svg`
- Álbum: `assets/album/portada-album.webp`, `pagina-album.webp`, `marco-polaroid.svg`, `sello-*.svg`, `medalla-album.webp`
- Monedas: `assets/monedas/moneda-base.webp`, `moneda-cajamarca.webp`, `moneda-banos-inca.webp`, `moneda-celendin.webp`, `moneda-oculta.webp`, `cofre-recompensas.webp`, `medalla-coleccion.webp`
- Consultar `originales_png/` para relieve, sellos, marcos, portada y calidad de detalle; SVG presentes pueden estar simplificados. Nunca sustituir personajes aprobados por imágenes de stock u otros personajes.

### Sistema visual
Crear tokens de colores extraídos de las referencias (con justificación y muestra), tipografías legibles apropiadas al diseño, ornamentos y bordes de oro, gradientes sutiles, fondos de ilustración, jerarquía clara, botones con estados presionado/activo/deshabilitado, transiciones suaves, overlays con contraste suficiente. Evitar sobrecarga que afecte comprensión. Toda interacción debe tener estados loading/vacío/error/éxito. Optimizar imágenes: versiones adaptativas, lazy loading, tamaños correctos y cache; no comprimir en exceso oro, rostros o bordes. Respetar safe areas, barras Android, notch y teclado. Para Windows diseñar una experiencia de escritorio con panel adaptable, no estirar una pantalla de móvil a todo el ancho; mantener protagonismo del pasaporte y aprovechar espacio lateral para contenidos secundarios, galería o progreso.

### Pruebas visuales obligatorias
Automatizar capturas de las pantallas en Android al menos 360x800, 393x852 y 412x915 CSS px, tablet 768x1024, laptop 1366x768 y escritorio 1920x1080, verificando densidad y escalado. Tomar referencias y capturas lado a lado, mapas de diferencias y una checklist por cada pantalla. Evaluar: disposición, ornamentación, proporciones, foto/imagen, legibilidad, interacciones, recortes, desplazamiento, barra inferior, jerarquía y accesibilidad. Corregir hasta que no haya desajustes críticos. No inventar un porcentaje de similitud visual: informar criterios, capturas y discrepancias remanentes. Las composiciones son conceptuales; para fidelidad pixel a pixel en distintos tamaños, documentar adaptaciones responsivas inevitables.

## 3. FLUJOS FUNCIONALES COMPLETOS
### 3.1 Bienvenida / registro
- Logo, personajes, portada, idioma ES/EN, acción de empezar.
- Permitir descubrir información pública sin exigir identidad innecesaria. Para guardar pasaporte/álbum, autenticación segura o cuenta invitado con ruta de conversión a cuenta persistente.
- Recoger únicamente datos necesarios; NO exigir DNI o información sensible si no es imprescindible, especialmente para menores. Si el diseño muestra DNI de ejemplo, reemplazar con campo opcional solo si existe una base legal y finalidad clara. Validación cliente+servidor; consentimiento y política de privacidad.
- Número único de pasaporte no predecible y QR firmado o token opaco; no revelar DNI o PII en QR. Fotografía optativa y permisos granulares.
### 3.2 `Mi Pasaporte`
- Desde cualquier pantalla, pulsar `Mi Pasaporte` navega al Pasaporte Andino personal, **no** a home genérica: portada, identidad, QR, logros, sellos, distritos, rutas, monedas, visitas y galería, con pestañas o páginas y botón claro para volver al contexto anterior.
- Persistencia entre sesiones y dispositivos por identidad/autorización, políticas de tratamiento de datos, exportación si está aprobada y control de privacidad.
### 3.3 Exploración
- Inicio → distritos → ficha distrito → destinos → detalle destino. Búsqueda por título, distrito, categoría y etiquetas; filtros y ordenamiento. Fotografías verificadas donde se presenten como reales, atribuciones y licencias.
- Detalle destino: galería, historia, leyendas, recursos audiovisuales y biblioteca vinculada, localización validada, mapa, rutas relacionadas y compartir. No inventar ubicación ni información de seguridad.
### 3.4 Biblioteca Viva y contenidos existentes
- Crear capa adaptadora sobre repositorio real: lectura y ficha de medios por ID, metadatos, fuente, autor, licencia y relación temática con distrito/destino. No copiar la biblioteca completa ni duplicar tablas sin necesidad.
- Lector con tipografía ajustable, reanudación, navegación por capítulos cuando existan, texto alternativo, reproductor audio/video, subtítulos cuando disponibles y referencias de procedencia.
- Si un destino no tiene lecturas reales, mostrar estado vacío útil y permitir gestión editorial; no generar leyendas o referencias como si estuvieran documentadas.
### 3.5 Avatares y guía
- Atahualpa: bienvenida, historia, rutas y destinos. Delia: lectura, recomendaciones y explicación de materiales. Llama: álbum y recompensas. Preferir los activos reales del proyecto; si existen audios/expresiones, asociarlos; si no, no prometer voz animada. Configuración para silenciar o reducir animación, sin bloquear interacción. No introducir chat IA sin petición explícita.
### 3.6 Álbum, fotos, sellos
- Fotos del usuario con consentimiento, permisos, límites de tamaño, verificación MIME, almacenamiento aislado, miniaturas y posibilidad de eliminar; por defecto privadas, nunca públicas automáticamente.
- Sellos por hitos definidos en configuración, con evidencia y validación server-side; estado bloqueado, conseguido, historial, corrección administrativa auditada, idempotencia.
- No otorgar verificación presencial exclusivamente por `Abrir detalle`, `Ver mapa` o botón sin evidencia. Si se habilita check-in QR/GPS, incluir firma, expiración, control de fraude, permisos, alternativa manual y protección de ubicación.
### 3.7 Monedas y gamificación
- Contabilidad simbólica por eventos idempotentes (lectura aprobada, ruta validada, sello, actividad), libro mayor auditable, total derivado, deduplicación de eventos, reglas configurables y reversión autorizada. No inventar saldos iniciales. Señalar claramente que las monedas NO tienen valor monetario ni son transferibles salvo reglas futuras aprobadas.
### 3.8 Compartir Facebook/Instagram
- Para Android usar hoja nativa de compartir texto, enlaces públicos e imágenes cuando plataforma destino lo soporte; Instagram Stories/Feed por integración permitida o composición exportable y menú compartir, con degradación elegante. No prometer auto-publicación en cuentas personales ni APIs no disponibles.
- En Windows usar enlace público, copiar URL, descargar imagen/card cuando esté autorizado, compartir mediante navegador o API soportada. No filtrar fotos privadas, ubicaciones sensibles, nombres completos ni QR personal. Preparar Open Graph de URL pública para previsualizaciones.
### 3.9 Offline, sincronización y errores
- Cache local limitada de recursos públicos y lecturas autorizadas; mostrar con claridad qué está disponible sin conexión. Colas de acciones con idempotency keys y sincronización segura si se aprueba; no declarar lectura / sellos / visitas como guardados hasta confirmación. Manejar reconexión, cierre forzado y sesión vencida.

## 4. BACKEND / SEGURIDAD / DATOS
- PHP 8.4 estricto y tipado cuando sea compatible con código base; MariaDB existente. Migraciones aditivas, versionadas, reversibles cuando sea viable, respaldos verificados y mínimos privilegios. No sobrescribir tablas previas ni modificar reglas ajenas.
- Endpoints documentados para destinos, distritos, colecciones, biblioteca, fichas, rutas, identidad del pasaporte, sellos, fotos, monedas, compartir metadatos, idiomas y settings. Reutilizar endpoints existentes validados. APIs seguras con control de autorización en servidor; no confiar en estados o puntos enviados por cliente.
- Sesiones por cliente y tokens almacenados en Android secure storage / Windows storage apropiado; no guardar credenciales en JS plano ni bundle. TLS, CORS explícito, CSRF donde aplique, rate limiting, validación de entrada, consultas preparadas, XSS/SQLi, controles de subida y descarga, auditoría sin PII innecesaria.
- Base de datos: diseñar relación pasaporte_usuario ↔ sellos ↔ eventos ↔ destinos ↔ rutas ↔ biblioteca; entidad medios con atribución/licencia; eventos inmutables o reversión auditada; índices, claves únicas, transacciones y bloqueo frente a duplicados. Respetar identificadores actuales.
- Establecer roles y permisos de administración editorial, curación histórica, publicación de fotos y permisos de menores. No publicar datos personales en clasificaciones sin consentimiento.
- Separar configuration/env para staging y producción, secretos fuera del ZIP de distribución y compilados.

## 5. APK ANDROID VERDADERO
- Elegir y justificar stack (por ejemplo Capacitor con interfaz web responsiva, plugins mínimos y backend remoto). Android Studio/SDK y versiones compatibles verificadas en entorno. Definir package ID único, nombre `Pasaporte Andino`, iconos adaptativos, splash, políticas de URLs permitidas, intents/deep links si aplica, permisos mínimos, tratamiento de cámara y selector de fotos, compartir nativo, archivo/descarga, back navigation, safe areas, gestión offline y conexiones interrumpidas.
- Emisión de APK instalable real; distinguir debug y release firmado. Para publicación pública, gestionar firma privada de propietario y AAB si fuera requerido, sin incluir keystore privado ni contraseñas en paquete.
- Probar instalación/desinstalación, primer arranque, navegación, orientación, Android Back, permisos denegados, subir fotografía, leer/audio/video, compartir y retorno desde otra app en emulador y, si está disponible, dispositivo real. Adjuntar logs y resultado de instalación.

## 6. EXE WINDOWS VERDADERO
- Elegir y justificar stack (Tauri, Electron u otro verificado y compatible con frontend y CI). Empaquetar instalador Windows real EXE; no renombrar ejecutables ni entregar solo acceso directo. Nombre `Pasaporte Andino`, logo, metadatos, instalador con acceso directo y desinstalador, rutas de configuración/caché, permisos mínimos, navegaciones externas, archivos, descargas, abrir mapas y enlaces compartir.
- En pantalla grande diseñar layout adaptativo fiel a imagen y usar ancho disponible sin pixelar el móvil. Probar ventana redimensionada, DPI 100/125/150%, maximizar/restaurar, sin red, instalación y desinstalación limpia.
- Si compilación se ejecuta desde Linux sin toolchain Windows reproducible, usar Windows runner/CI o entorno Windows real. No asegurar que un EXE funciona sin verificarlo. Documentar firma de código o advertencia SmartScreen si no existe certificado.

## 7. ARQUITECTURA Y ACTUALIZACIONES
- Una única base de interfaz compartida y testable (web responsiva) empaquetada por plataforma; backend existente PHP 8.4 como fuente de verdad. La experiencia instalable NO debe abrir la web general sin filtro: navegación turística aislada y acceso a APIs/recurso autorizado. Mantener posibilidad de actualizaciones de contenido vía backend, y nuevas versiones de aplicación para cambios nativos.
- Configuración explícita de URLs y ambientes, sin secretos y sin redirigir a localhost en release. Normalizar rutas HTTPS, CSP y deep links. Evitar duplicar biblioteca ni recursos enormes dentro del APK/EXE salvo assets esenciales y offline aprobado.
- Definir estrategia de migración de datos entre versiones y mantenimiento de backward compatibility del API.

## 8. QA AUTOMATIZADO Y ACEPTACIÓN
Preparar pruebas de instalación, unitarias, integración, contrato de API, E2E en dispositivos, carga básica, seguridad, SQL, migraciones, accesibilidad, internacionalización, contenido y rendimiento. Matriz de pruebas por flujo y dispositivo, evidencias de capturas y errores corregidos. No considerar listo si hay rutas 404, placeholders, botones inertes, datos falsos o pantallas distintas de referencias sin justificación.

**Criterios de salida no negociables**:
1. Las siete referencias tienen implementación reconocible y fidelidad validada visualmente.
2. Registro y pasaporte, fotografía, QR y navegación a `Mi Pasaporte` funcionan con datos reales.
3. Exploración, biblioteca vinculada, audios/videos disponibles, rutas y compartir funcionan o muestran estados vacíos honestos si no existe contenido.
4. Sellos, álbum, monedas y progreso utilizan reglas y persistencia del servidor.
5. Avatares y activos aprobados se conservan; assets provisionales quedan trazados.
6. Ningún módulo educativo excluido aparece o queda accesible desde contenedor turístico.
7. APK y EXE son archivos binarios realmente compilados e instalados en entornos de prueba; si no se logra alguna compilación, registrar no cumplido.
8. Integración no destruye ni altera producción; staging verificado, backup, plan de despliegue y rollback.
9. Logs, dependencias y pruebas reproducibles; proyecto funciona en PHP 8.4.
10. Ninguna credencial ni PII real se incluye en el ZIP final o pruebas públicas.

## 9. ENTREGA FINAL OBLIGATORIA
Entregar `PASAPORTE_ANDINO_ENTREGA_FINAL.zip` con:
```
PASAPORTE_ANDINO_ENTREGA_FINAL/
  README.md
  CHANGELOG.md
  MATRIZ_FIDELIDAD_VISUAL.md
  AUDITORIA_REUTILIZACION_CE360.md
  AUDITORIA_SEGURIDAD.md
  MATRIZ_PRUEBAS_Y_RESULTADOS.md
  LIMITACIONES_Y_PENDIENTES.md
  MANIFEST_SHA256.json
  web-tourism/                 # interfaz y recursos del cliente
  backend-integration/         # migraciones/adaptadores/endpoints PHP 8.4
  android/                     # proyecto Android compilable
  windows/                     # proyecto Windows compilable
  instaladores/
    PasaporteAndino-Android.apk # solo si fue realmente compilado
    PasaporteAndino-Setup.exe   # solo si fue realmente compilado
  qa/
    capturas/
    reportes/
    logs-sanitizados/
  scripts/
    inspeccion.sh
    build-android.sh
    build-windows.*
    pruebas.*
    deploy-staging.sh
    rollback.md
  docs/
    ARQUITECTURA.md
    API.md
    DATOS_Y_MIGRACIONES.md
    INSTALACION_ANDROID.md
    INSTALACION_WINDOWS.md
    DEPLOY_PRODUCCION.md
```
No incluir secretos ni keystores privados. Entregar SHA-256 verificables de instaladores, hashes de dependencias y comandos de compilación. Identificar estado de cada artefacto: COMPILADO, INSTALADO_Y_PROBADO, BLOQUEADO o NO_ENTREGADO. Evidencias y ruta precisa de resultados.

## 10. PUBLICACIÓN Y CONTROL DE CAMBIOS
- Primera implementación en staging equivalente a producción con copia anonimizada/segura y backups; nunca tocar dominio en vivo sin validar dependencias, permisos y rutas.
- Ejecutar QA, obtener aceptación del propietario del diseño y flujos, respaldar, desplegar con cambios atómicos y monitoreo, verificar rutas y métricas y documentar rollback probado.
- El hecho de generar APK/EXE NO equivale a tener producción actualizada. La publicación final de region.aprep.net ocurre después de aprobación y validación; no omitir este gate.
- La aprobación para desarrollar no autoriza eliminar datos, reconfigurar toda la web, ni activar módulos ajenos.

## 11. FORMA DE TRABAJAR Y REPORTE FINAL A USUARIO
Completa el trabajo integralmente. Usa inspección rápida para localizar puntos reales y después modificaciones quirúrgicas. No empieces de cero si ya existe código reutilizable. Mantén la identidad artística de las referencias, prioriza accesibilidad y respuesta a cada clic, y evita falsa sensación de 'terminado'. Al finalizar entrega informe ejecutivo con (a) reutilizado, (b) desarrollado, (c) evidencia visual pantalla por pantalla, (d) backend/servicios, (e) estado y SHA-256 de APK, (f) estado y SHA-256 del EXE, (g) QA, (h) instrucciones instalación y despliegue, (i) pendientes reales y causa.

### NOTA SOBRE VERACIDAD DE LAS REFERENCIAS
Los valores, nombres de usuario y documentos de las imágenes son ilustrativos y NO deben utilizarse como datos reales. Las ilustraciones geográficas del kit no equivalen a fotografías verificadas. Nunca codificar un número fijo de distritos o geolocalizaciones basándose únicamente en dibujos. El registro no debe exigir documento nacional sin justificación. Respetar derechos de autor y licencias para distribución binaria de medios.

**INSTRUCCIÓN FINAL:** Desarrolla la edición turística fiel a las siete referencias, con código funcional, pruebas, archivos instalables verdaderos cuando puedan compilarse y verificarse, e integración segura con los servicios existentes de Cultura Educa 360. No aceptes una maqueta, una web genérica o archivos falsamente llamados APK/EXE como entrega final.
