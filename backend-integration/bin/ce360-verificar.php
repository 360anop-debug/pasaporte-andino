#!/usr/bin/env php
<?php
declare(strict_types=1);

/** Verifica el mapeo config/ce360.php contra la BD real de CE360 (solo lectura) antes de activar PA_LIBRARY_CE360=1.
 *  Uso: php bin/ce360-verificar.php [id_lectura_de_prueba] */
require dirname(__DIR__) . '/vendor/autoload.php';

use PasaporteAndino\Library\Ce360LibraryAdapter;

$map = Ce360LibraryAdapter::loadMap(dirname(__DIR__) . '/config');
$adapter = new Ce360LibraryAdapter(true, $map);
$problems = $adapter->verify();
if ($problems !== []) {
    fwrite(STDERR, "Mapeo NO listo:\n - " . implode("\n - ", $problems) . "\n");
    exit(1);
}
echo "Mapeo válido: tablas y columnas existen.\n";
if (isset($argv[1])) {
    $book = $adapter->find($argv[1]);
    echo $book === null ? "No se encontró la lectura {$argv[1]}\n" : "Lectura: {$book['titulo']} · capítulos: " . count($book['capitulos']) . "\n";
}
