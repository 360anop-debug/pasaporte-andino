#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Semillas.
 *   base : organización territorial de la región Cajamarca (13 provincias, INEI) + distrito Los Baños del Inca,
 *          con sellos/monedas. Sin textos históricos: el contenido se carga por gestión editorial.
 *   demo : contenido de VALIDACIÓN DE DISEÑO (es_demo=1). Prohibido en producción; la API nunca lo expone allí.
 * Idempotente (INSERT IGNORE / upsert por slug).
 */
require dirname(__DIR__) . '/vendor/autoload.php';

use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;

$cfg = Config::load();
$db = new Db($cfg);
$what = $argv[1] ?? 'base';

$FUENTE = 'Organización político-administrativa del Perú (INEI). Pendiente de validación editorial.';
// slug, nombre_es, nombre_en, tipo, imagen, sello_img, moneda_img, color, orden
$territorios = [
    ['cajamarca', 'Cajamarca', 'Cajamarca', 'provincia', 'assets/exploracion/tarjeta-cajamarca.webp', 'assets/sellos/sello-cajamarca.webp', 'assets/monedas/moneda-cajamarca.webp', '#b3262e', 1],
    ['banos-del-inca', 'Baños del Inca', 'Baños del Inca', 'distrito', 'assets/exploracion/tarjeta-banos-inca.webp', 'assets/sellos/sello-banos-inca.webp', 'assets/monedas/moneda-banos-inca.webp', '#1f5fa8', 2],
    ['celendin', 'Celendín', 'Celendín', 'provincia', 'assets/exploracion/tarjeta-celendin.webp', 'assets/sellos/sello-celendin.webp', 'assets/monedas/moneda-celendin.webp', '#2e7d32', 3],
    ['chota', 'Chota', 'Chota', 'provincia', 'assets/exploracion/tarjeta-chota.webp', null, null, '#7b3fa0', 4],
    ['cutervo', 'Cutervo', 'Cutervo', 'provincia', 'assets/exploracion/tarjeta-cutervo.webp', null, null, '#b35a1f', 5],
    ['jaen', 'Jaén', 'Jaén', 'provincia', 'assets/exploracion/tarjeta-jaen.webp', null, null, '#7a4a24', 6],
    ['san-ignacio', 'San Ignacio', 'San Ignacio', 'provincia', 'assets/exploracion/tarjeta-san-ignacio.webp', null, null, '#a0236b', 7],
    ['san-marcos', 'San Marcos', 'San Marcos', 'provincia', null, null, null, '#1f7a6e', 8],
    ['san-miguel', 'San Miguel', 'San Miguel', 'provincia', null, null, null, '#5b6b2a', 9],
    ['contumaza', 'Contumazá', 'Contumazá', 'provincia', null, null, null, '#8a5a12', 10],
    ['hualgayoc', 'Hualgayoc', 'Hualgayoc', 'provincia', null, null, null, '#4a4f8a', 11],
    ['santa-cruz', 'Santa Cruz', 'Santa Cruz', 'provincia', null, null, null, '#2f6b3a', 12],
    ['cajabamba', 'Cajabamba', 'Cajabamba', 'provincia', null, null, null, '#9a3d2a', 13],
    ['san-pablo', 'San Pablo', 'San Pablo', 'provincia', null, null, null, '#6a2f5a', 14],
];

if ($what === 'base') {
    foreach ($territorios as [$slug, $es, $en, $tipo, $img, $sello, $moneda, $color, $orden]) {
        $db->exec(
            'INSERT INTO pa_territorios (slug, nombre_es, nombre_en, tipo, imagen, imagen_es_ilustracion, fuente, estado, orden)
             VALUES (?,?,?,?,?,1,?,\'publicado\',?)
             ON DUPLICATE KEY UPDATE nombre_es = VALUES(nombre_es), nombre_en = VALUES(nombre_en), tipo = VALUES(tipo), imagen = VALUES(imagen), orden = VALUES(orden)',
            [$slug, $es, $en, $tipo, $img, $FUENTE, $orden]
        );
        $tid = (int)$db->scalar('SELECT id FROM pa_territorios WHERE slug = ?', [$slug]);
        $db->exec(
            'INSERT INTO pa_sellos (territorio_id, imagen, moneda_imagen, color) VALUES (?,?,?,?)
             ON DUPLICATE KEY UPDATE imagen = VALUES(imagen), moneda_imagen = VALUES(moneda_imagen), color = VALUES(color)',
            [$tid, $sello, $moneda, $color]
        );
    }
    $cajamarca = (int)$db->scalar('SELECT id FROM pa_territorios WHERE slug = ?', ['cajamarca']);
    $db->exec('UPDATE pa_territorios SET padre_id = ? WHERE slug = ?', [$cajamarca, 'banos-del-inca']);
    echo "Semilla base: " . count($territorios) . " territorios con sello y moneda coleccionable.\n";
    exit(0);
}

if ($what !== 'demo') {
    fwrite(STDERR, "Uso: seed.php base|demo\n");
    exit(2);
}
if ($cfg->isProduction()) {
    fwrite(STDERR, "La semilla demo está prohibida en producción.\n");
    exit(3);
}

$NOTA = 'DEMO · contenido de validación de diseño, pendiente de curaduría';
$tid = static fn(string $slug): int => (int)$db->scalar('SELECT id FROM pa_territorios WHERE slug = ?', [$slug]);

// Resúmenes cortos de territorios (demo)
$res = [
    'cajamarca' => ['Capital de la región, escenario del encuentro de 1532 entre el Inca Atahualpa y la hueste de Francisco Pizarro.', 'Capital of the region, setting of the 1532 encounter between Inca Atahualpa and Francisco Pizarro\'s forces.'],
    'banos-del-inca' => ['Distrito conocido por sus aguas termales, a pocos kilómetros de la ciudad de Cajamarca.', 'District known for its hot springs, a few kilometres from the city of Cajamarca.'],
    'celendin' => ['Provincia andina conocida por su tradición artesanal en sombreros de paja.', 'Andean province known for its straw hat craftsmanship.'],
];
foreach ($res as $slug => [$es, $en]) {
    $db->exec('UPDATE pa_territorios SET resumen_es = ?, resumen_en = ? WHERE slug = ? AND resumen_es IS NULL', [$es, $en, $slug]);
}

// Destinos demo: slug, territorio, nombre_es, nombre_en, categoria, etiquetas, resumen_es, resumen_en, imagen
$destinos = [
    ['plaza-de-armas-cajamarca', 'cajamarca', 'Plaza de Armas de Cajamarca', 'Cajamarca Main Square', 'historico', 'centro histórico,catedral,arquitectura', 'Centro histórico de la ciudad, rodeado por la Catedral y la iglesia de San Francisco.', 'Historic centre of the city, framed by the Cathedral and the church of San Francisco.', 'assets/rutas/ruta-historica.webp'],
    ['cuarto-del-rescate', 'cajamarca', 'Cuarto del Rescate', 'Ransom Room', 'historico', 'inca,atahualpa,historia', 'Recinto inca asociado al ofrecimiento de rescate de Atahualpa.', 'Inca chamber associated with Atahualpa\'s ransom offer.', 'assets/cultura/cabecera-historia.webp'],
    ['cumbemayo', 'cajamarca', 'Cumbemayo', 'Cumbemayo', 'arqueologico', 'canal,formaciones rocosas,arqueología', 'Complejo arqueológico con un antiguo canal tallado en roca y formaciones rocosas.', 'Archaeological complex with an ancient rock-carved canal and rock formations.', 'assets/rutas/ruta-natural.webp'],
    ['cerro-santa-apolonia', 'cajamarca', 'Cerro Santa Apolonia', 'Santa Apolonia Hill', 'mirador', 'mirador,vista panorámica', 'Mirador sobre la ciudad de Cajamarca.', 'Viewpoint over the city of Cajamarca.', 'assets/exploracion/cabecera-explorar.webp'],
    ['complejo-banos-del-inca', 'banos-del-inca', 'Complejo Termal Baños del Inca', 'Baños del Inca Thermal Complex', 'bienestar', 'aguas termales,bienestar', 'Complejo de aguas termales del distrito.', 'Hot springs complex of the district.', 'assets/rutas/ruta-bienestar.webp'],
    ['ventanillas-de-otuzco', 'banos-del-inca', 'Ventanillas de Otuzco', 'Otuzco Windows', 'arqueologico', 'necrópolis,arqueología', 'Necrópolis con nichos funerarios excavados en la roca.', 'Necropolis with burial niches carved into the rock.', 'assets/exploracion/tarjeta-banos-inca.webp'],
    ['plaza-de-celendin', 'celendin', 'Plaza de Armas de Celendín', 'Celendín Main Square', 'cultural', 'artesanía,sombreros', 'Centro de la ciudad de Celendín.', 'Centre of the town of Celendín.', 'assets/exploracion/tarjeta-celendin.webp'],
    ['feria-artesanal-cajamarca', 'cajamarca', 'Artesanía cajamarquina', 'Cajamarca crafts', 'cultural', 'textiles,artesanía,gastronomía', 'Tradiciones textiles y artesanales de la región.', 'Textile and craft traditions of the region.', 'assets/rutas/ruta-cultural.webp'],
];
foreach ($destinos as $i => [$slug, $t, $es, $en, $cat, $tags, $rEs, $rEn, $img]) {
    $db->exec(
        'INSERT INTO pa_destinos (territorio_id, slug, nombre_es, nombre_en, categoria, etiquetas, resumen_es, resumen_en, imagen, imagen_es_ilustracion, fuente, estado, es_demo, orden)
         VALUES (?,?,?,?,?,?,?,?,?,1,?,\'publicado\',1,?) ON DUPLICATE KEY UPDATE nombre_es = VALUES(nombre_es)',
        [$tid($t), $slug, $es, $en, $cat, $tags, $rEs, $rEn, $img, $NOTA, $i + 1]
    );
}
$did = static fn(string $slug): int => (int)$db->scalar('SELECT id FROM pa_destinos WHERE slug = ?', [$slug]);

// Lectura demo (Biblioteca local)
if ($db->scalar('SELECT id FROM pa_lecturas WHERE titulo = ?', ['Lectura de prueba del lector (DEMO)']) === null) {
    $db->exec('INSERT INTO pa_lecturas (titulo, autor, fuente, licencia, idioma, estado, es_demo) VALUES (?,?,?,?,?,\'publicado\',1)',
        ['Lectura de prueba del lector (DEMO)', 'Equipo Pasaporte Andino', 'Texto técnico de prueba, no es una referencia literaria', 'CC0', 'es']);
    $lid = $db->lastId();
    $caps = [
        ['Capítulo 1 · Cómo funciona el lector', "Este texto es un contenido técnico de prueba. Sirve para validar el lector de la Biblioteca Viva: tamaño de letra ajustable, reanudación en el capítulo donde te quedaste y navegación entre capítulos.\n\nCuando la Biblioteca Viva de Cultura Educa 360 esté conectada, aquí aparecerán lecturas reales con su autor, fuente y licencia."],
        ['Capítulo 2 · Progreso y reanudación', "El progreso se guarda en el servidor. Si cierras la aplicación y vuelves, retomarás desde este capítulo.\n\nLas monedas de cultura solo se otorgan cuando el servidor comprueba que llegaste al último capítulo y que transcurrió un tiempo mínimo de lectura."],
        ['Capítulo 3 · Final', "Has llegado al final de la lectura de prueba. Pulsa «Marcar como leída» para registrar la lectura. El servidor validará el progreso antes de otorgar monedas."],
    ];
    foreach ($caps as $n => [$tt, $body]) {
        $db->exec('INSERT INTO pa_lectura_capitulos (lectura_id, orden, titulo, cuerpo) VALUES (?,?,?,?)', [$lid, $n + 1, $tt, $body]);
    }
}
$lid = (int)$db->scalar('SELECT id FROM pa_lecturas WHERE titulo = ?', ['Lectura de prueba del lector (DEMO)']);

$caj = $tid('cajamarca');
$banos = $tid('banos-del-inca');
if ((int)$db->scalar('SELECT COUNT(*) FROM pa_contenidos WHERE es_demo = 1') === 0) {
    $c = [
        // territorio, destino, tipo, titulo_es, titulo_en, cuerpo_es, cuerpo_en, autor, fuente, media, poster, dur, ref, ilustr, orden
        [$caj, null, 'historia', 'La historia de Cajamarca', 'The history of Cajamarca',
            'Cajamarca fue escenario del encuentro entre el Inca Atahualpa y los españoles en 1532, un hecho que marcó profundamente la historia del Perú y de los Andes.',
            'Cajamarca was the setting of the encounter between Inca Atahualpa and the Spaniards in 1532, a pivotal event in the history of Peru and the Andes.',
            null, $NOTA, null, 'assets/cultura/cabecera-historia.webp', null, null, 1, 1],
        [$caj, null, 'dato', 'Sabías que…', 'Did you know…',
            'En Cajamarca se encuentra el llamado Cuarto del Rescate, asociado al rescate ofrecido por Atahualpa durante su captura.',
            'Cajamarca is home to the so-called Ransom Room, associated with the ransom offered by Atahualpa during his captivity.',
            null, $NOTA, null, null, null, null, 0, 1],
        [$caj, null, 'linea_tiempo', '1532 · Encuentro en Cajamarca', '1532 · Encounter in Cajamarca',
            'Atahualpa es capturado en la plaza de Cajamarca por la hueste de Francisco Pizarro.', 'Atahualpa is captured in the Cajamarca square by Francisco Pizarro\'s forces.',
            null, $NOTA, null, null, null, null, 0, 1],
        [$caj, null, 'linea_tiempo', '1533 · Muerte de Atahualpa', '1533 · Death of Atahualpa',
            'Atahualpa es ejecutado en Cajamarca.', 'Atahualpa is executed in Cajamarca.', null, $NOTA, null, null, null, null, 0, 2],
        [$caj, null, 'personaje', 'Atahualpa', 'Atahualpa',
            'Último soberano del Tahuantinsuyo antes de la conquista española.', 'Last sovereign of Tawantinsuyu before the Spanish conquest.',
            null, $NOTA, null, 'assets/personajes/atahualpa-guia.webp', null, null, 1, 1],
        [$caj, null, 'video', 'Video de prueba técnica · Centro histórico', 'Technical test video · Historic centre',
            'Video técnico generado a partir de ilustraciones del kit para validar el reproductor. No es material documental.', 'Technical video generated from kit illustrations to validate the player. Not documentary footage.',
            'Equipo Pasaporte Andino', $NOTA, 'demo-media/video-prueba.mp4', 'assets/rutas/ruta-historica.webp', 12, null, 1, 1],
        [$caj, null, 'audio', 'Audio de prueba técnica', 'Technical test audio',
            'Pista técnica para validar reproducción, pausa y avance. No es una leyenda real.', 'Technical track to validate play, pause and seek. Not a real legend.',
            'Equipo Pasaporte Andino', $NOTA, 'demo-media/audio-prueba.m4a', 'assets/cultura/portada-leyendas.webp', 15, null, 1, 1],
        [$caj, null, 'referencia', 'Lectura de prueba del lector', 'Reader test text',
            'Texto técnico para validar el lector de la Biblioteca Viva.', 'Technical text to validate the Living Library reader.',
            'Equipo Pasaporte Andino', $NOTA, null, 'assets/cultura/biblioteca-cultural.webp', null, 'local:' . $lid, 1, 1],
        [$caj, null, 'galeria', 'Plaza de Armas (ilustración)', 'Main Square (illustration)', null, null, null, $NOTA, 'assets/rutas/ruta-historica.webp', null, null, null, 1, 1],
        [$caj, null, 'galeria', 'Cumbemayo (ilustración)', 'Cumbemayo (illustration)', null, null, null, $NOTA, 'assets/rutas/ruta-natural.webp', null, null, null, 1, 2],
        [$caj, null, 'galeria', 'Aguas termales (ilustración)', 'Hot springs (illustration)', null, null, null, $NOTA, 'assets/rutas/ruta-bienestar.webp', null, null, null, 1, 3],
        [$caj, null, 'galeria', 'Textiles (ilustración)', 'Textiles (illustration)', null, null, null, $NOTA, 'assets/rutas/ruta-cultural.webp', null, null, null, 1, 4],
        [$banos, null, 'historia', 'Baños del Inca', 'Baños del Inca',
            'Distrito conocido por sus fuentes termales.', 'District known for its thermal springs.', null, $NOTA, null, 'assets/rutas/ruta-bienestar.webp', null, null, 1, 1],
    ];
    foreach ($c as [$t, $d, $tipo, $tes, $ten, $ces, $cen, $autor, $fuente, $media, $poster, $dur, $ref, $il, $ord]) {
        $db->exec(
            'INSERT INTO pa_contenidos (territorio_id, destino_id, tipo, titulo_es, titulo_en, cuerpo_es, cuerpo_en, autor, fuente, licencia, credito, media_url, poster_url, duracion_seg, biblioteca_ref, es_ilustracion, estado, es_demo, orden)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'publicado\',1,?)',
            [$t, $d, $tipo, $tes, $ten, $ces, $cen, $autor, $fuente, 'Uso interno de prueba', 'Kit Maestro Pasaporte Andino (ilustración)', $media, $poster, $dur, $ref, $il, $ord]
        );
    }
}

$rutas = [
    ['ruta-historica', 'historica', 'Ruta Histórica', 'Historic Route', 'Sigue los pasos del Inca Atahualpa.', 'Follow in the footsteps of Inca Atahualpa.', '1 día', '1 day', 'assets/rutas/ruta-historica.webp', ['plaza-de-armas-cajamarca', 'cuarto-del-rescate', 'cerro-santa-apolonia']],
    ['ruta-natural', 'natural', 'Ruta Natural', 'Nature Route', 'Paisajes, formaciones y aventura.', 'Landscapes, formations and adventure.', '1 día', '1 day', 'assets/rutas/ruta-natural.webp', ['cumbemayo', 'ventanillas-de-otuzco']],
    ['ruta-bienestar', 'bienestar', 'Ruta de Bienestar', 'Wellness Route', 'Relajación en aguas termales.', 'Relaxation in hot springs.', 'Medio día', 'Half day', 'assets/rutas/ruta-bienestar.webp', ['complejo-banos-del-inca']],
    ['ruta-cultural', 'cultural', 'Ruta Cultural', 'Cultural Route', 'Tradiciones, artesanía y gastronomía.', 'Traditions, crafts and gastronomy.', '1 día', '1 day', 'assets/rutas/ruta-cultural.webp', ['feria-artesanal-cajamarca', 'plaza-de-celendin']],
];
foreach ($rutas as $i => [$slug, $tema, $es, $en, $rEs, $rEn, $dEs, $dEn, $img, $stops]) {
    $db->exec(
        'INSERT INTO pa_rutas (slug, tema, nombre_es, nombre_en, resumen_es, resumen_en, duracion_es, duracion_en, imagen, estado, es_demo, orden)
         VALUES (?,?,?,?,?,?,?,?,?,\'publicado\',1,?) ON DUPLICATE KEY UPDATE nombre_es = VALUES(nombre_es)',
        [$slug, $tema, $es, $en, $rEs, $rEn, $dEs, $dEn, $img, $i + 1]
    );
    $rid = (int)$db->scalar('SELECT id FROM pa_rutas WHERE slug = ?', [$slug]);
    foreach ($stops as $o => $s) {
        $db->exec('INSERT IGNORE INTO pa_ruta_destinos (ruta_id, destino_id, orden) VALUES (?,?,?)', [$rid, $did($s), $o + 1]);
    }
}
echo "Semilla demo cargada (es_demo=1).\n";
