<?php
declare(strict_types=1);

namespace PasaporteAndino\Tests\Integration;

use PasaporteAndino\App;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Tests\ApiTestCase;

final class PublicApiTest extends ApiTestCase
{
    public function testHealthAndConfig(): void
    {
        $r = $this->call('GET', '/v1/salud');
        self::assertSame(200, $r->status);
        self::assertTrue($r->data()['db']);
        $c = $this->call('GET', '/v1/config')->data();
        self::assertFalse($c['biblioteca']['ce360'], 'CE360 no conectado: debe declararse no disponible');
        self::assertStringContainsString('no tienen valor monetario', $c['monedas_aviso']['es']);
    }

    public function testTerritoriesFromSeedAndSearch(): void
    {
        $all = $this->call('GET', '/v1/territorios')->data()['datos'];
        self::assertCount(14, $all);
        self::assertSame('cajamarca', $all[0]['slug']);
        self::assertTrue($all[0]['imagen_es_ilustracion']);
        $q = $this->call('GET', '/v1/territorios?q=Cele')->data()['datos'];
        self::assertSame(['celendin'], array_column($q, 'slug'));
        $prov = $this->call('GET', '/v1/territorios?tipo=distrito')->data()['datos'];
        self::assertSame(['banos-del-inca'], array_column($prov, 'slug'));
        // Búsqueda por etiqueta de destino
        $byTag = $this->call('GET', '/v1/territorios?q=termales')->data()['datos'];
        self::assertContains('banos-del-inca', array_column($byTag, 'slug'));
    }

    public function testTerritoryDetailGroupsContent(): void
    {
        $t = $this->call('GET', '/v1/territorios/cajamarca')->data();
        self::assertSame('Cajamarca', $t['nombre']['es']);
        self::assertNotEmpty($t['destinos']);
        self::assertCount(1, $t['contenidos']['video']);
        self::assertCount(4, $t['contenidos']['galeria']);
        self::assertNotEmpty($t['rutas']);
        self::assertSame(404, $this->call('GET', '/v1/territorios/no-existe')->status);
    }

    public function testDemoContentHiddenWhenDemoDisabled(): void
    {
        $prodLike = new App(Config::load(['PA_SHOW_DEMO' => '0']));
        $t = $this->call('GET', '/v1/territorios/cajamarca', app: $prodLike)->data();
        self::assertSame([], $t['destinos']);
        self::assertSame([], $t['contenidos']['historia']);
        self::assertSame([], $this->call('GET', '/v1/rutas', app: $prodLike)->data()['datos']);
        self::assertCount(14, $this->call('GET', '/v1/territorios', app: $prodLike)->data()['datos']);
    }

    public function testProductionRefusesDemoAndWeakSecret(): void
    {
        $this->expectException(\RuntimeException::class);
        Config::load(['PA_ENV' => 'production', 'PA_SECRET' => 'corto']);
    }

    public function testRoutesAndDestinations(): void
    {
        $r = $this->call('GET', '/v1/rutas')->data()['datos'];
        self::assertSame(['historica', 'natural', 'bienestar', 'cultural'], array_column($r, 'tema'));
        $h = $this->call('GET', '/v1/rutas/ruta-historica')->data();
        self::assertSame('plaza-de-armas-cajamarca', $h['destinos'][0]['slug']);
        $d = $this->call('GET', '/v1/destinos?categoria=arqueologico')->data()['datos'];
        self::assertEqualsCanonicalizing(['cumbemayo', 'ventanillas-de-otuzco'], array_column($d, 'slug'));
    }

    public function testLibraryAdapters(): void
    {
        $r = $this->call('GET', '/v1/biblioteca/ce360-15');
        self::assertSame(503, $r->status);
        self::assertSame('BIBLIOTECA_CE360_NO_CONFIGURADA', $r->data()['error']['codigo']);
        $ref = $this->call('GET', '/v1/territorios/cajamarca')->data()['contenidos']['referencia'][0]['biblioteca_ref'];
        $book = $this->call('GET', '/v1/biblioteca/' . str_replace(':', '-', $ref))->data();
        self::assertSame('local', $book['origen']);
        self::assertCount(3, $book['capitulos']);
    }

    public function testExcludedEducationalModulesAreNotRoutable(): void
    {
        foreach (['/v1/arena', '/v1/campeonato', '/v1/orca360', '/v1/admin/institucion', '/v1/academico/notas'] as $p) {
            self::assertSame(404, $this->call('GET', $p)->status, $p);
        }
    }

    public function testCorsAllowlist(): void
    {
        $ok = $this->call('OPTIONS', '/v1/territorios', null, ['Origin' => 'https://localhost']);
        self::assertSame(204, $ok->status);
        self::assertSame('https://localhost', $ok->headers['Access-Control-Allow-Origin']);
        $bad = $this->call('OPTIONS', '/v1/territorios', null, ['Origin' => 'https://evil.example']);
        self::assertSame(403, $bad->status);
        $get = $this->call('GET', '/v1/territorios', null, ['Origin' => 'https://evil.example']);
        self::assertArrayNotHasKey('Access-Control-Allow-Origin', $get->headers);
        self::assertSame('nosniff', $get->headers['X-Content-Type-Options']);
    }

    public function testSharePageHasOpenGraphAndNoPii(): void
    {
        $r = $this->call('GET', '/v1/compartir/territorio/cajamarca');
        self::assertSame(200, $r->status);
        self::assertStringContainsString('og:title', $r->body);
        self::assertStringContainsString('#/distrito/cajamarca', $r->body);
        $x = $this->call('GET', '/v1/compartir/territorio/%3Cscript%3E');
        self::assertSame(404, $x->status);
    }

    public function testInvalidJsonAndMethod(): void
    {
        $t = $this->traveler();
        $req = new \PasaporteAndino\Http\Request('POST', '/v1/checkin', [], ['authorization' => "Bearer $t", 'content-type' => 'application/json', 'idempotency-key' => $this->idem()], '{bad');
        self::assertSame(400, self::$app->handle($req)->status);
        self::assertSame(405, $this->call('DELETE', '/v1/territorios')->status);
    }
}
