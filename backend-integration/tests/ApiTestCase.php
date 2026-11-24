<?php
declare(strict_types=1);

namespace PasaporteAndino\Tests;

use PasaporteAndino\App;
use PasaporteAndino\Http\Request;
use PasaporteAndino\Http\Response;
use PasaporteAndino\Support\Config;
use PHPUnit\Framework\TestCase;

abstract class ApiTestCase extends TestCase
{
    protected static App $app;
    private static bool $booted = false;

    public static function setUpBeforeClass(): void
    {
        if (!self::$booted) {
            $root = dirname(__DIR__);
            foreach (['down --to=000', 'up'] as $cmd) {
                exec("php $root/bin/migrate.php $cmd 2>&1", $o, $rc);
                if ($rc !== 0) { throw new \RuntimeException(implode("\n", $o)); }
            }
            exec("php $root/bin/seed.php base 2>&1 && php $root/bin/seed.php demo 2>&1", $o, $rc);
            if ($rc !== 0) { throw new \RuntimeException(implode("\n", $o)); }
            self::$booted = true;
        }
        self::$app = new App(Config::load(['PA_STORAGE_DIR' => sys_get_temp_dir() . '/pa-test-storage']));
    }

    protected function setUp(): void
    {
        self::$app->db->exec('DELETE FROM pa_rate_limit');
    }

    /** @param array<string,mixed>|null $json @param array<string,string> $headers */
    protected function call(string $method, string $path, ?array $json = null, array $headers = [], array $cookies = [], array $files = [], array $form = [], ?App $app = null): Response
    {
        $parts = parse_url($path);
        parse_str($parts['query'] ?? '', $query);
        $h = [];
        foreach ($headers as $k => $v) { $h[strtolower($k)] = $v; }
        if ($json !== null) { $h['content-type'] = 'application/json'; }
        $req = new Request($method, $parts['path'], $query, $h, $json === null ? '' : (string)json_encode($json), $cookies, $files, '10.0.0.1', $form);
        return ($app ?? self::$app)->handle($req);
    }

    /** @return string token de un viajero con pasaporte */
    protected function traveler(array $data = []): string
    {
        $r = $this->call('POST', '/v1/auth/invitado', null, ['X-PA-Client' => 'android']);
        self::assertSame(201, $r->status);
        $token = $r->data()['token'];
        $p = $this->call('POST', '/v1/pasaporte', $data + ['nombres' => 'Ana María', 'apellidos' => 'Quispe Rojas', 'nacionalidad' => 'PE', 'idioma' => 'es', 'consentimiento' => true], $this->bearer($token));
        self::assertSame(201, $p->status, $p->body);
        return $token;
    }

    /** @return array<string,string> */
    protected function bearer(string $token, array $extra = []): array
    {
        return ['Authorization' => 'Bearer ' . $token, 'X-PA-Client' => 'android'] + $extra;
    }

    protected function idem(): string
    {
        return bin2hex(random_bytes(10));
    }

    protected function jpeg(int $w = 800, int $h = 600): string
    {
        $img = imagecreatetruecolor($w, $h);
        imagefilledrectangle($img, 0, 0, $w, $h, imagecolorallocate($img, 122, 31, 43));
        $f = tempnam(sys_get_temp_dir(), 'pa') . '.jpg';
        imagejpeg($img, $f);
        return $f;
    }
}
