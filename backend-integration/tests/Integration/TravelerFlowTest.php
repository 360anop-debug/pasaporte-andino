<?php
declare(strict_types=1);

namespace PasaporteAndino\Tests\Integration;

use PasaporteAndino\Tests\ApiTestCase;

final class TravelerFlowTest extends ApiTestCase
{
    private function destinoId(string $slug): int
    {
        return (int)self::$app->db->scalar('SELECT id FROM pa_destinos WHERE slug = ?', [$slug]);
    }

    private function code(string $slug, int $days = 30, int $uses = 1000): string
    {
        return self::$app->checkin->issue($this->destinoId($slug), $days, $uses, null);
    }

    public function testPassportCreationValidatesAndMinimizesData(): void
    {
        $tok = $this->call('POST', '/v1/auth/invitado', null, ['X-PA-Client' => 'android'])->data()['token'];
        $noConsent = $this->call('POST', '/v1/pasaporte', ['nombres' => 'Ana', 'apellidos' => 'Rojas', 'nacionalidad' => 'PE'], $this->bearer($tok));
        self::assertSame(422, $noConsent->status);
        self::assertSame('consentimiento', $noConsent->data()['error']['campo']);
        $badName = $this->call('POST', '/v1/pasaporte', ['nombres' => '<script>', 'apellidos' => 'Rojas', 'nacionalidad' => 'PE', 'consentimiento' => true], $this->bearer($tok));
        self::assertSame('nombres', $badName->data()['error']['campo']);
        $minor = $this->call('POST', '/v1/pasaporte', ['nombres' => 'Luz', 'apellidos' => 'Rojas', 'nacionalidad' => 'PE', 'consentimiento' => true, 'menor_de_edad' => true], $this->bearer($tok));
        self::assertSame('TUTOR_REQUERIDO', $minor->data()['error']['codigo']);
        $ok = $this->call('POST', '/v1/pasaporte', ['nombres' => 'José Luis', 'apellidos' => "D'Ávila Ñique", 'nacionalidad' => 'pe', 'consentimiento' => true], $this->bearer($tok));
        self::assertSame(201, $ok->status, $ok->body);
        $p = $ok->data();
        self::assertMatchesRegularExpression('/^PA-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/', $p['codigo']);
        self::assertArrayNotHasKey('dni', $p);
        self::assertSame('PE', $p['nacionalidad']);
        self::assertStringNotContainsString('José', $p['qr_url']);
        self::assertSame(409, $this->call('POST', '/v1/pasaporte', ['nombres' => 'X', 'apellidos' => 'Y', 'nacionalidad' => 'PE', 'consentimiento' => true], $this->bearer($tok))->status);

        $token = substr($p['qr_url'], strrpos($p['qr_url'], '/') + 1);
        $v = $this->call('GET', '/v1/verificar/' . $token)->data();
        self::assertTrue($v['valido']);
        self::assertSame($p['codigo'], $v['codigo']);
        self::assertArrayNotHasKey('nombres', $v);
        self::assertFalse($this->call('GET', '/v1/verificar/inexistente')->data()['valido']);
    }

    public function testPassportCodesAreUniqueAndUnpredictable(): void
    {
        $codes = [];
        for ($i = 0; $i < 25; $i++) {
            $codes[] = \PasaporteAndino\Support\Ids::passportCode();
        }
        self::assertCount(25, array_unique($codes));
    }

    public function testUnauthenticatedAndNoPassportErrors(): void
    {
        self::assertSame(401, $this->call('GET', '/v1/pasaporte')->status);
        self::assertSame(401, $this->call('GET', '/v1/pasaporte/progreso', null, ['Authorization' => 'Bearer invalido'])->status);
        $tok = $this->call('POST', '/v1/auth/invitado', null, ['X-PA-Client' => 'android'])->data()['token'];
        self::assertSame('SIN_PASAPORTE', $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data()['error']['codigo']);
    }

    public function testWebCookieSessionRequiresCsrfForMutations(): void
    {
        $r = $this->call('POST', '/v1/auth/invitado');
        self::assertSame(201, $r->status);
        self::assertArrayNotHasKey('token', $r->data(), 'La web no recibe el token en JSON');
        $cookies = [];
        foreach ($r->cookies as $c) {
            [$kv] = explode(';', $c);
            [$k, $v] = explode('=', $kv, 2);
            $cookies[$k] = $v;
        }
        self::assertStringContainsString('HttpOnly', $r->cookies[0]);
        $body = ['nombres' => 'Rosa', 'apellidos' => 'Chávez', 'nacionalidad' => 'PE', 'consentimiento' => true];
        self::assertSame(403, $this->call('POST', '/v1/pasaporte', $body, [], $cookies)->status);
        self::assertSame(201, $this->call('POST', '/v1/pasaporte', $body, ['X-PA-CSRF' => $cookies['pa_csrf']], $cookies)->status);
        self::assertSame(200, $this->call('GET', '/v1/pasaporte', null, [], $cookies)->status);
    }

    public function testRegisterLoginLogoutAndRateLimit(): void
    {
        $tok = $this->traveler();
        $email = 'viajero' . bin2hex(random_bytes(3)) . '@example.org';
        self::assertSame('CLAVE_DEBIL', $this->call('POST', '/v1/auth/registro', ['email' => $email, 'password' => 'corta'], $this->bearer($tok))->data()['error']['codigo']);
        self::assertSame(200, $this->call('POST', '/v1/auth/registro', ['email' => $email, 'password' => 'clave-larga-segura'], $this->bearer($tok))->status);
        self::assertSame(409, $this->call('POST', '/v1/auth/registro', ['email' => $email, 'password' => 'clave-larga-segura'], $this->bearer($tok))->status);
        self::assertSame(401, $this->call('POST', '/v1/auth/login', ['email' => $email, 'password' => 'incorrecta-123'], ['X-PA-Client' => 'windows'])->status);
        $login = $this->call('POST', '/v1/auth/login', ['email' => strtoupper($email), 'password' => 'clave-larga-segura'], ['X-PA-Client' => 'windows'])->data();
        self::assertTrue($login['tiene_pasaporte']);
        $t2 = $login['token'];
        self::assertSame(200, $this->call('GET', '/v1/pasaporte', null, $this->bearer($t2))->status, 'persistencia entre dispositivos');
        $this->call('POST', '/v1/auth/logout', null, $this->bearer($t2));
        self::assertSame(401, $this->call('GET', '/v1/pasaporte', null, $this->bearer($t2))->status);
        $last = 0;
        for ($i = 0; $i < 12; $i++) {
            $last = $this->call('POST', '/v1/auth/login', ['email' => $email, 'password' => 'mala-mala-mala'], ['X-PA-Client' => 'windows'])->status;
        }
        self::assertSame(429, $last);
    }

    public function testCheckinGrantsVisitStampCoinsAndIsIdempotent(): void
    {
        $tok = $this->traveler();
        $h = fn(string $k) => $this->bearer($tok, ['Idempotency-Key' => $k]);
        $before = $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data();
        self::assertSame(0, $before['monedas']['total'], 'sin saldo inicial inventado');
        self::assertSame(0, $before['sellos']['obtenidos']);

        // Abrir el detalle NO otorga nada
        $this->call('GET', '/v1/destinos/complejo-banos-del-inca');
        self::assertSame(0, $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data()['lugares_visitados']);

        $code = $this->code('complejo-banos-del-inca');
        $tampered = substr($code, 0, -2) . (str_ends_with($code, 'AA') ? 'BB' : 'AA');
        self::assertSame('CODIGO_INVALIDO', $this->call('POST', '/v1/checkin', ['codigo' => $tampered], $h($this->idem()))->data()['error']['codigo']);
        self::assertSame(400, $this->call('POST', '/v1/checkin', ['codigo' => $code], $this->bearer($tok))->status, 'Idempotency-Key obligatoria');

        $k = $this->idem();
        $r1 = $this->call('POST', '/v1/checkin', ['codigo' => 'https://region.aprep.net/pasaporte/#/checkin/' . rawurlencode($code)], $h($k))->data();
        self::assertSame('registrado', $r1['visita']);
        self::assertTrue($r1['sello_nuevo']);
        self::assertSame(300, $r1['monedas'], '100 visita + 200 ruta de bienestar (1 parada)');
        $r2 = $this->call('POST', '/v1/checkin', ['codigo' => $code], $h($k))->data();
        self::assertSame('repetido', $r2['visita']);
        $r3 = $this->call('POST', '/v1/checkin', ['codigo' => $code], $h($this->idem()))->data();
        self::assertSame('ya_registrado', $r3['visita']);
        self::assertSame(0, $r3['monedas']);

        $p = $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data();
        self::assertSame(['visitas' => 100, 'retos' => 200, 'cultura' => 0, 'actividades' => 0], $p['monedas']['por_categoria']);
        self::assertSame(1, $p['sellos']['obtenidos']);
        self::assertSame(14, $p['sellos']['total']);
        self::assertSame(1, $p['rutas_completadas']);
        $stamps = $this->call('GET', '/v1/pasaporte/sellos', null, $this->bearer($tok))->data()['datos'];
        $got = array_values(array_filter($stamps, fn($s) => $s['obtenido']));
        self::assertSame('banos-del-inca', $got[0]['territorio']['slug']);
        $ledger = $this->call('GET', '/v1/pasaporte/monedas', null, $this->bearer($tok))->data();
        self::assertSame(300, array_sum(array_column($ledger['movimientos'], 'cantidad')));
        self::assertSame($ledger['resumen']['total'], array_sum(array_column($ledger['movimientos'], 'cantidad')));
    }

    public function testExpiredRevokedAndExhaustedCodes(): void
    {
        $tok = $this->traveler();
        $did = $this->destinoId('cumbemayo');
        $app = self::$app;
        $expired = (new \ReflectionClass($app->checkin))->getMethod('sign');
        $exp = time() - 10;
        $nonce = 'nonceexpirado1';
        $app->db->exec('INSERT INTO pa_checkin_codigos (destino_id, nonce, expira_at) VALUES (?,?,FROM_UNIXTIME(?))', [$did, $nonce, $exp]);
        $code = "PA1.$did.$nonce.$exp." . $expired->invoke($app->checkin, $did, $nonce, $exp);
        self::assertSame(410, $this->call('POST', '/v1/checkin', ['codigo' => $code], $this->bearer($tok, ['Idempotency-Key' => $this->idem()]))->status);

        $one = $this->code('cumbemayo', 1, 1);
        self::assertSame('registrado', $this->call('POST', '/v1/checkin', ['codigo' => $one], $this->bearer($tok, ['Idempotency-Key' => $this->idem()]))->data()['visita']);
        $other = $this->traveler();
        self::assertSame('CODIGO_AGOTADO', $this->call('POST', '/v1/checkin', ['codigo' => $one], $this->bearer($other, ['Idempotency-Key' => $this->idem()]))->data()['error']['codigo']);

        $rev = $this->code('cumbemayo');
        $nonce2 = explode('.', $rev)[2];
        $app->db->exec('UPDATE pa_checkin_codigos SET revocado_at = UTC_TIMESTAMP() WHERE nonce = ?', [$nonce2]);
        self::assertSame('CODIGO_REVOCADO', $this->call('POST', '/v1/checkin', ['codigo' => $rev], $this->bearer($other, ['Idempotency-Key' => $this->idem()]))->data()['error']['codigo']);
    }

    public function testClientEventsAreValidatedServerSide(): void
    {
        $tok = $this->traveler();
        $t = $this->call('GET', '/v1/territorios/cajamarca')->data();
        $video = $t['contenidos']['video'][0]['id'];
        $ref = $t['contenidos']['referencia'][0]['id'];
        $h = fn() => $this->bearer($tok, ['Idempotency-Key' => $this->idem()]);

        self::assertSame('EVENTO_NO_PERMITIDO', $this->call('POST', '/v1/eventos', ['tipo' => 'visita_destino', 'contenido_id' => $video], $h())->data()['error']['codigo']);
        self::assertSame('EVENTO_NO_PERMITIDO', $this->call('POST', '/v1/eventos', ['tipo' => 'monedas', 'cantidad' => 99999], $h())->data()['error']['codigo']);
        self::assertSame('EVENTO_INCOHERENTE', $this->call('POST', '/v1/eventos', ['tipo' => 'audio_escuchado', 'contenido_id' => $video], $h())->data()['error']['codigo']);
        self::assertSame(5, $this->call('POST', '/v1/eventos', ['tipo' => 'video_visto', 'contenido_id' => $video], $h())->data()['monedas']);
        self::assertSame(0, $this->call('POST', '/v1/eventos', ['tipo' => 'video_visto', 'contenido_id' => $video], $h())->data()['monedas']);

        self::assertSame('LECTURA_INCOMPLETA', $this->call('POST', '/v1/eventos', ['tipo' => 'lectura_completada', 'contenido_id' => $ref], $h())->data()['error']['codigo']);
        $p = $this->call('PUT', "/v1/lecturas/$ref/progreso", ['capitulo' => 2, 'posicion' => 0.5], $this->bearer($tok))->data();
        self::assertSame(3, $p['capitulos_total']);
        self::assertSame('LECTURA_INCOMPLETA', $this->call('POST', '/v1/eventos', ['tipo' => 'lectura_completada', 'contenido_id' => $ref], $h())->data()['error']['codigo']);
        $this->call('PUT', "/v1/lecturas/$ref/progreso", ['capitulo' => 99], $this->bearer($tok));
        self::assertSame(3, $this->call('GET', "/v1/lecturas/$ref/progreso", null, $this->bearer($tok))->data()['capitulo'], 'capítulo acotado al total real');
        $done = $this->call('POST', '/v1/eventos', ['tipo' => 'lectura_completada', 'contenido_id' => $ref], $h())->data();
        self::assertSame(20, $done['monedas']);
        self::assertTrue($this->call('GET', "/v1/lecturas/$ref/progreso", null, $this->bearer($tok))->data()['completada']);
        $s = $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data();
        self::assertSame(['visitas' => 0, 'retos' => 0, 'cultura' => 20, 'actividades' => 5], $s['monedas']['por_categoria']);
        self::assertSame(0, $s['sellos']['obtenidos'], 'leer no otorga sellos');
    }

    public function testAdminReversalAndRoles(): void
    {
        $tok = $this->traveler();
        $this->call('POST', '/v1/checkin', ['codigo' => $this->code('plaza-de-celendin')], $this->bearer($tok, ['Idempotency-Key' => $this->idem()]));
        $mov = $this->call('GET', '/v1/pasaporte/monedas', null, $this->bearer($tok))->data()['movimientos'][0];
        self::assertSame(403, $this->call('POST', '/v1/admin/monedas/revertir', ['movimiento_id' => $mov['id'], 'motivo' => 'x'], $this->bearer($tok))->status);

        $db = self::$app->db;
        $db->exec("INSERT INTO pa_usuarios (email, password_hash, rol, es_invitado) VALUES (?, ?, 'admin', 0)", ['admin' . bin2hex(random_bytes(3)) . '@example.org', password_hash('x', PASSWORD_DEFAULT)]);
        $admin = self::$app->auth->openSession($db->lastId(), 'web');
        $r = $this->call('POST', '/v1/admin/monedas/revertir', ['movimiento_id' => $mov['id'], 'motivo' => 'Prueba de corrección'], $this->bearer($admin));
        self::assertSame(200, $r->status, $r->body);
        self::assertSame(409, $this->call('POST', '/v1/admin/monedas/revertir', ['movimiento_id' => $mov['id'], 'motivo' => 'otra'], $this->bearer($admin))->status);
        self::assertSame(100, $mov['cantidad']);
        self::assertSame(0, $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data()['monedas']['total'], 'saldo derivado tras reversión');
        $code = $this->call('GET', '/v1/pasaporte', null, $this->bearer($tok))->data()['codigo'];
        $sello = (int)$db->scalar("SELECT s.id FROM pa_sellos s JOIN pa_territorios t ON t.id=s.territorio_id WHERE t.slug='celendin'");
        self::assertSame(200, $this->call('POST', '/v1/admin/sellos/revocar', ['pasaporte_codigo' => $code, 'sello_id' => $sello, 'motivo' => 'Check-in erróneo'], $this->bearer($admin))->status);
        self::assertSame(0, $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data()['sellos']['obtenidos']);
        self::assertGreaterThanOrEqual(2, (int)$db->scalar("SELECT COUNT(*) FROM pa_auditoria WHERE accion IN ('monedas.revertir','sello.revocar')"));
    }

    public function testAlbumPrivateUploadListServeDelete(): void
    {
        $tok = $this->traveler();
        $other = $this->traveler();
        $f = $this->jpeg(1600, 1000);
        $up = $this->call('POST', '/v1/album', null, $this->bearer($tok), [], ['foto' => ['tmp_name' => $f, 'error' => UPLOAD_ERR_OK, 'name' => 'x.jpg', 'size' => filesize($f)]], ['destino' => 'cumbemayo', 'titulo' => '<b>Mi foto</b>']);
        self::assertSame(201, $up->status, $up->body);
        $photo = $up->data();
        self::assertTrue($photo['privada']);
        self::assertSame('Mi foto', $photo['titulo']);
        self::assertFalse($photo['verificado'], 'subir una foto no verifica la visita');
        self::assertLessThanOrEqual(2048, max($photo['ancho'], $photo['alto']));
        $file = $this->call('GET', '/v1/album/' . $photo['id'] . '/archivo?tam=mini', null, $this->bearer($tok));
        self::assertSame(200, $file->status);
        self::assertSame('image/jpeg', $file->headers['Content-Type']);
        self::assertSame(404, $this->call('GET', '/v1/album/' . $photo['id'] . '/archivo', null, $this->bearer($other))->status, 'aislamiento entre viajeros');
        self::assertSame(404, $this->call('DELETE', '/v1/album/' . $photo['id'], null, $this->bearer($other))->status);
        self::assertSame(1, $this->call('GET', '/v1/pasaporte/progreso', null, $this->bearer($tok))->data()['fotos']);

        $txt = tempnam(sys_get_temp_dir(), 'pa');
        file_put_contents($txt, '<?php echo 1; ?>' . str_repeat('A', 200));
        $bad = $this->call('POST', '/v1/album', null, $this->bearer($tok), [], ['foto' => ['tmp_name' => $txt, 'error' => UPLOAD_ERR_OK]]);
        self::assertSame(415, $bad->status);
        self::assertSame(200, $this->call('DELETE', '/v1/album/' . $photo['id'], null, $this->bearer($tok))->status);
        self::assertSame([], $this->call('GET', '/v1/album', null, $this->bearer($tok))->data()['datos']);
    }

    public function testProfilePhotoAndAccountDeletion(): void
    {
        $tok = $this->traveler();
        $f = $this->jpeg(900, 1200);
        $r = $this->call('POST', '/v1/pasaporte/foto', null, $this->bearer($tok), [], ['foto' => ['tmp_name' => $f, 'error' => UPLOAD_ERR_OK]]);
        self::assertTrue($r->data()['tiene_foto']);
        $img = $this->call('GET', '/v1/pasaporte/foto', null, $this->bearer($tok));
        self::assertSame(200, $img->status);
        [$w, $h] = getimagesize($img->filePath);
        self::assertSame($w, $h, 'foto de pasaporte recortada cuadrada');
        $qr = $this->call('GET', '/v1/pasaporte', null, $this->bearer($tok))->data()['qr_url'];
        $export = $this->call('GET', '/v1/pasaporte/exportar', null, $this->bearer($tok));
        self::assertSame(200, $export->status);
        self::assertSame(422, $this->call('DELETE', '/v1/cuenta', ['confirmar' => 'no'], $this->bearer($tok))->status);
        self::assertSame(200, $this->call('DELETE', '/v1/cuenta', ['confirmar' => 'ELIMINAR'], $this->bearer($tok))->status);
        self::assertSame(401, $this->call('GET', '/v1/pasaporte', null, $this->bearer($tok))->status);
        self::assertFalse($this->call('GET', '/v1/verificar/' . substr($qr, strrpos($qr, '/') + 1))->data()['valido']);
        self::assertFileDoesNotExist($img->filePath);
    }
}
