<?php
declare(strict_types=1);

namespace PasaporteAndino\Tests\Integration;

use PasaporteAndino\Library\Ce360LibraryAdapter;
use PasaporteAndino\Tests\ApiTestCase;

/**
 * Prueba del adaptador configurable con tablas FICTICIAS DE PRUEBA (prefijo pa_test_ce360_).
 * No representan el esquema real de Cultura Educa 360 (desconocido); solo demuestran que el mapeo funciona.
 */
final class Ce360AdapterTest extends ApiTestCase
{
    private const MAP = [
        'dsn' => 'no-usado', 'usuario' => 'no-usado',
        'lecturas' => ['tabla' => 'pa_test_ce360_libros', 'id' => 'libro_id', 'id_tipo' => 'entero', 'titulo' => 'nombre', 'autor' => 'autoria',
            'fuente' => null, 'licencia' => 'lic', 'idioma' => null, 'cuerpo' => null,
            'filtro_publicado' => ['columna' => 'visible', 'valor' => 1]],
        'capitulos' => ['tabla' => 'pa_test_ce360_caps', 'fk' => 'libro', 'orden' => 'n', 'titulo' => 'encabezado', 'cuerpo' => 'texto'],
    ];

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        $db = self::$app->db;
        $db->exec('DROP TABLE IF EXISTS pa_test_ce360_caps');
        $db->exec('DROP TABLE IF EXISTS pa_test_ce360_libros');
        $db->exec('CREATE TABLE pa_test_ce360_libros (libro_id INT PRIMARY KEY, nombre VARCHAR(100), autoria VARCHAR(100), lic VARCHAR(40), visible TINYINT)');
        $db->exec('CREATE TABLE pa_test_ce360_caps (libro INT, n INT, encabezado VARCHAR(100), texto TEXT)');
        $db->exec("INSERT INTO pa_test_ce360_libros VALUES (7, 'Libro de prueba', 'Autor de prueba', 'CC-BY', 1), (8, 'Oculto', 'X', 'CC0', 0)");
        $db->exec("INSERT INTO pa_test_ce360_caps VALUES (7, 2, 'Dos', 'Texto 2'), (7, 1, 'Uno', 'Texto 1')");
    }

    public static function tearDownAfterClass(): void
    {
        self::$app->db->exec('DROP TABLE IF EXISTS pa_test_ce360_caps');
        self::$app->db->exec('DROP TABLE IF EXISTS pa_test_ce360_libros');
    }

    private function adapter(array $map = self::MAP, bool $enabled = true): Ce360LibraryAdapter
    {
        return new Ce360LibraryAdapter($enabled, $map, self::$app->db->pdo());
    }

    public function testBlockedWithoutConfigOrFlag(): void
    {
        self::assertFalse((new Ce360LibraryAdapter(true, null))->available());
        self::assertFalse($this->adapter(self::MAP, false)->available());
        self::assertNull($this->adapter(self::MAP, false)->find('7'));
    }

    public function testMappedReadingWithOrderedChaptersAndPublicationFilter(): void
    {
        $a = $this->adapter();
        self::assertSame([], $a->verify());
        $book = $a->find('7');
        self::assertSame('Libro de prueba', $book['titulo']);
        self::assertSame('CC-BY', $book['licencia']);
        self::assertSame(['Uno', 'Dos'], array_column($book['capitulos'], 'titulo'));
        self::assertNull($a->find('8'), 'no publicado');
        self::assertNull($a->find("7' OR '1'='1"));
        self::assertNull($a->find('7abc'), 'sin coerción a entero');
    }

    public function testRejectsIdentifierInjectionAndDetectsMissingColumns(): void
    {
        $bad = self::MAP;
        $bad['lecturas']['tabla'] = 'libros; DROP TABLE pa_usuarios';
        self::assertNotSame([], Ce360LibraryAdapter::validMap($bad));
        self::assertFalse($this->adapter($bad)->available());
        $missing = self::MAP;
        $missing['lecturas']['autor'] = 'no_existe';
        self::assertContains('no existe la columna pa_test_ce360_libros.no_existe', $this->adapter($missing)->verify());
    }
}
