<?php
declare(strict_types=1);

namespace PasaporteAndino;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Http\Request;
use PasaporteAndino\Http\Response;
use PasaporteAndino\Http\Router;
use PasaporteAndino\Library\Ce360LibraryAdapter;
use PasaporteAndino\Library\LibraryAdapter;
use PasaporteAndino\Library\LocalLibraryAdapter;
use PasaporteAndino\Service\Album;
use PasaporteAndino\Service\Auth;
use PasaporteAndino\Service\Catalog;
use PasaporteAndino\Service\Checkin;
use PasaporteAndino\Service\Gamification;
use PasaporteAndino\Service\Passport;
use PasaporteAndino\Service\RateLimiter;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;

/**
 * API v1 del Pasaporte Andino. Prefijo público: /pasaporte/api/v1
 * Solo expone el módulo turístico. No enruta ni da acceso a módulos educativos de CE360
 * (campeonato, Arena, ORCA 360, gestión académica, administración institucional).
 */
final class App
{
    public const VERSION = '1.0.0';
    public readonly Db $db;
    public readonly Auth $auth;
    public readonly Catalog $catalog;
    public readonly Passport $passport;
    public readonly Gamification $game;
    public readonly Checkin $checkin;
    public readonly Album $album;
    public readonly RateLimiter $limiter;
    private Router $router;
    /** @var array<string,LibraryAdapter> */
    private array $libraries;

    public function __construct(public readonly Config $config)
    {
        $this->db = new Db($config);
        $this->limiter = new RateLimiter($this->db);
        $this->auth = new Auth($this->db, $config, $this->limiter);
        $this->catalog = new Catalog($this->db, $config->showDemo());
        $this->passport = new Passport($this->db, $config);
        $this->game = new Gamification($this->db, $this->catalog);
        $this->checkin = new Checkin($this->db, $config, $this->game, $this->limiter);
        $this->album = new Album($this->db, $config, $this->limiter);
        $this->libraries = [
            'local' => new LocalLibraryAdapter($this->db, $config->showDemo()),
            'ce360' => new Ce360LibraryAdapter($config->bool('PA_LIBRARY_CE360')),
        ];
        $this->router = new Router();
        $this->routes();
    }

    public function handle(Request $req): Response
    {
        $origin = $req->header('origin');
        $cors = [];
        if ($origin !== '' && in_array($origin, $this->config->corsOrigins(), true)) {
            $cors = [
                'Access-Control-Allow-Origin' => $origin,
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Allow-Headers' => 'Authorization, Content-Type, X-PA-CSRF, X-PA-Client, Idempotency-Key',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Max-Age' => '600',
                'Vary' => 'Origin',
            ];
        }
        if ($req->method === 'OPTIONS') {
            $res = new Response($cors === [] ? 403 : 204);
        } else {
            try {
                $res = $this->router->dispatch($req);
            } catch (ApiError $e) {
                $res = Response::json(['error' => ['codigo' => $e->errorCode, 'mensaje' => $e->getMessage()] + $e->extra], $e->status);
            } catch (\Throwable $e) {
                error_log('[pasaporte-api] ' . $e::class . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine());
                $res = Response::json(['error' => ['codigo' => 'ERROR_INTERNO', 'mensaje' => 'Ocurrió un error inesperado. Inténtalo de nuevo.']], 500);
            }
        }
        $res->headers += $cors + [
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'X-Frame-Options' => 'DENY',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; frame-ancestors 'none'",
            'X-PA-Version' => self::VERSION,
        ];
        if ($this->config->isProduction()) {
            $res->headers['Strict-Transport-Security'] = 'max-age=31536000';
        }
        return $res;
    }

    /** @return array<string,mixed> */
    private static function body(Request $req): array
    {
        return $req->json();
    }

    private function idem(Request $req): string
    {
        $k = $req->header('idempotency-key');
        if (!preg_match('/^[A-Za-z0-9_\-]{8,64}$/', $k)) {
            throw new ApiError(400, 'IDEMPOTENCY_KEY', 'Falta la cabecera Idempotency-Key (8-64 caracteres).');
        }
        return $k;
    }

    /** @return array{0:array{usuario_id:int,rol:string,es_invitado:bool,via:string,sesion_id:int},1:int} */
    private function traveler(Request $req): array
    {
        $u = $this->auth->require($req);
        return [$u, $this->passport->requireId($u['usuario_id'])];
    }

    private function uploaded(Request $req, string $field): string
    {
        $f = $req->files[$field] ?? null;
        if (!is_array($f) || !isset($f['tmp_name'], $f['error']) || is_array($f['tmp_name'])) {
            throw new ApiError(422, 'ARCHIVO_VACIO', 'No se recibió ninguna imagen.', ['campo' => $field]);
        }
        if ((int)$f['error'] === UPLOAD_ERR_INI_SIZE || (int)$f['error'] === UPLOAD_ERR_FORM_SIZE) {
            throw new ApiError(413, 'ARCHIVO_GRANDE', 'La imagen supera el tamaño máximo permitido.');
        }
        if ((int)$f['error'] !== UPLOAD_ERR_OK) {
            throw new ApiError(422, 'ARCHIVO_VACIO', 'No se recibió ninguna imagen.', ['campo' => $field]);
        }
        $tmp = (string)$f['tmp_name'];
        if (PHP_SAPI !== 'cli' && !is_uploaded_file($tmp)) {
            throw new ApiError(422, 'ARCHIVO_VACIO', 'No se recibió ninguna imagen.');
        }
        return $tmp;
    }

    private function sessionResponse(Request $req, string $token, int $status, array $extra = []): Response
    {
        if (Auth::client($req) === 'web') {
            $res = Response::json(['ok' => true] + $extra, $status);
            $res->cookies = $this->auth->cookiesFor($token);
            return $res;
        }
        return Response::json(['ok' => true, 'token' => $token] + $extra, $status);
    }

    private function routes(): void
    {
        $r = $this->router;

        // ---------- Público ----------
        $r->add('GET', '/v1/salud', fn() => Response::json(['ok' => true, 'version' => self::VERSION, 'db' => (int)$this->db->scalar('SELECT 1') === 1]));
        $r->add('GET', '/v1/config', fn() => Response::json([
            'version' => self::VERSION,
            'idiomas' => ['es', 'en'],
            'demo' => $this->config->showDemo(),
            'biblioteca' => ['local' => true, 'ce360' => $this->libraries['ce360']->available()],
            'consentimiento_version' => Passport::CONSENT_VERSION,
            'subida_max_bytes' => $this->config->int('PA_UPLOAD_MAX_BYTES'),
            'monedas_aviso' => [
                'es' => 'Las Monedas Andinas son simbólicas: no tienen valor monetario, no son canjeables por dinero ni transferibles.',
                'en' => 'Andean Coins are symbolic: they have no monetary value and cannot be exchanged for money or transferred.',
            ],
        ]));
        $r->add('GET', '/v1/territorios', fn(Request $q) => Response::json(['datos' => $this->catalog->territories($q->q('q'), $q->q('tipo'), $q->q('orden', 'orden'))]));
        $r->add('GET', '/v1/territorios/{slug}', fn(Request $q, array $p) => Response::json($this->catalog->territory($p['slug'])));
        $r->add('GET', '/v1/destinos', fn(Request $q) => Response::json(['datos' => $this->catalog->destinations($q->q('q'), $q->q('territorio'), $q->q('categoria'), $q->q('orden', 'orden'))]));
        $r->add('GET', '/v1/destinos/{slug}', fn(Request $q, array $p) => Response::json($this->catalog->destination($p['slug'])));
        $r->add('GET', '/v1/rutas', fn(Request $q) => Response::json(['datos' => $this->catalog->routes(tema: $q->q('tema'))]));
        $r->add('GET', '/v1/rutas/{slug}', fn(Request $q, array $p) => Response::json($this->catalog->route($p['slug'])));
        $r->add('GET', '/v1/contenidos/{id}', function (Request $q, array $p) {
            if (!ctype_digit($p['id'])) {
                throw new ApiError(404, 'CONTENIDO_NO_ENCONTRADO', 'Contenido no encontrado.');
            }
            return Response::json($this->catalog->content((int)$p['id']));
        });
        $r->add('GET', '/v1/coleccionables', fn() => Response::json(['datos' => $this->catalog->collectibles()]));
        $r->add('GET', '/v1/reglas', fn() => Response::json(['datos' => $this->game->rules()]));
        $r->add('GET', '/v1/biblioteca/{ref}', function (Request $q, array $p) {
            [$src, $id] = array_pad(explode(':', str_replace('-', ':', $p['ref']), 2), 2, '');
            $lib = $this->libraries[$src] ?? null;
            if ($lib === null) {
                throw new ApiError(404, 'LECTURA_NO_ENCONTRADA', 'Lectura no encontrada.');
            }
            if (!$lib->available()) {
                throw new ApiError(503, 'BIBLIOTECA_CE360_NO_CONFIGURADA', 'La Biblioteca Viva de Cultura Educa 360 aún no está conectada a esta edición.');
            }
            $book = $lib->find($id);
            if ($book === null) {
                throw new ApiError(404, 'LECTURA_NO_ENCONTRADA', 'Lectura no encontrada.');
            }
            return Response::json(['origen' => $lib->name()] + $book);
        });
        $r->add('GET', '/v1/verificar/{token}', fn(Request $q, array $p) => Response::json($this->passport->verify($p['token'])));
        $r->add('GET', '/v1/compartir/{tipo}/{slug}', fn(Request $q, array $p) => $this->sharePage($q, $p['tipo'], $p['slug']));

        // ---------- Sesión ----------
        $r->add('POST', '/v1/auth/invitado', function (Request $q) {
            $g = $this->auth->createGuest($q);
            return $this->sessionResponse($q, $g['token'], 201, ['invitado' => true]);
        });
        $r->add('POST', '/v1/auth/registro', function (Request $q) {
            $u = $this->auth->require($q);
            $b = self::body($q);
            $this->auth->register($q, $u['usuario_id'], (string)($b['email'] ?? ''), (string)($b['password'] ?? ''));
            return Response::json(['ok' => true]);
        });
        $r->add('POST', '/v1/auth/login', function (Request $q) {
            $b = self::body($q);
            $s = $this->auth->login($q, (string)($b['email'] ?? ''), (string)($b['password'] ?? ''));
            return $this->sessionResponse($q, $s['token'], 200, ['tiene_pasaporte' => $this->passport->idFor($s['usuario_id']) !== null]);
        });
        $r->add('POST', '/v1/auth/logout', function (Request $q) {
            $u = $this->auth->require($q);
            $this->auth->logout($u['sesion_id']);
            $res = Response::json(['ok' => true]);
            $res->cookies = $this->auth->clearCookies();
            return $res;
        });
        $r->add('GET', '/v1/auth/sesion', function (Request $q) {
            $u = $this->auth->current($q);
            return Response::json($u === null ? ['autenticado' => false] : [
                'autenticado' => true, 'invitado' => $u['es_invitado'], 'rol' => $u['rol'],
                'tiene_pasaporte' => $this->passport->idFor($u['usuario_id']) !== null,
            ]);
        });

        // ---------- Mi Pasaporte ----------
        $r->add('POST', '/v1/pasaporte', function (Request $q) {
            $u = $this->auth->require($q);
            return Response::json($this->passport->create($u['usuario_id'], self::body($q)), 201);
        });
        $r->add('GET', '/v1/pasaporte', function (Request $q) {
            $u = $this->auth->require($q);
            return Response::json($this->passport->get($u['usuario_id']));
        });
        $r->add('PATCH', '/v1/pasaporte', function (Request $q) {
            $u = $this->auth->require($q);
            return Response::json($this->passport->update($u['usuario_id'], self::body($q)));
        });
        $r->add('POST', '/v1/pasaporte/foto', function (Request $q) {
            $u = $this->auth->require($q);
            $this->limiter->hit('foto-perfil', (string)$u['usuario_id'], 20, 3600);
            $this->passport->setPhoto($u['usuario_id'], $this->uploaded($q, 'foto'), ($q->form['consentimiento_tutor'] ?? '') === '1');
            return Response::json($this->passport->get($u['usuario_id']));
        });
        $r->add('DELETE', '/v1/pasaporte/foto', function (Request $q) {
            $u = $this->auth->require($q);
            $this->passport->deletePhoto($u['usuario_id']);
            return Response::json(['ok' => true]);
        });
        $r->add('GET', '/v1/pasaporte/foto', function (Request $q) {
            $u = $this->auth->require($q);
            $path = $this->passport->photoPath($u['usuario_id']);
            if ($path === null) {
                throw new ApiError(404, 'SIN_FOTO', 'Sin foto.');
            }
            return Response::file($path, 'image/jpeg');
        });
        $r->add('GET', '/v1/pasaporte/progreso', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json($this->game->summary($pid));
        });
        $r->add('GET', '/v1/pasaporte/sellos', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json(['datos' => $this->game->stamps($pid)]);
        });
        $r->add('GET', '/v1/pasaporte/visitas', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json(['datos' => $this->db->all(
                'SELECT d.slug, d.nombre_es, d.nombre_en, d.imagen, t.nombre_es AS territorio_es, t.nombre_en AS territorio_en, v.metodo, v.creado_at
                 FROM pa_visitas v JOIN pa_destinos d ON d.id = v.destino_id JOIN pa_territorios t ON t.id = d.territorio_id WHERE v.pasaporte_id = ? ORDER BY v.id DESC',
                [$pid]
            )]);
        });
        $r->add('GET', '/v1/pasaporte/monedas', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json(['resumen' => $this->game->summary($pid)['monedas'], 'movimientos' => $this->game->ledger($pid, (int)$q->q('limite', '50'))]);
        });
        $r->add('GET', '/v1/pasaporte/exportar', function (Request $q) {
            [$u, $pid] = $this->traveler($q);
            return Response::json([
                'pasaporte' => $this->passport->get($u['usuario_id']),
                'progreso' => $this->game->summary($pid),
                'sellos' => array_values(array_filter($this->game->stamps($pid), static fn($s) => $s['obtenido'])),
                'movimientos' => $this->game->ledger($pid, 200),
                'album' => $this->album->list($pid),
                'exportado_at' => gmdate('c'),
            ]);
        });
        $r->add('DELETE', '/v1/cuenta', function (Request $q) {
            $u = $this->auth->require($q);
            $b = self::body($q);
            if (($b['confirmar'] ?? '') !== 'ELIMINAR') {
                throw new ApiError(422, 'CONFIRMACION_REQUERIDA', 'Escribe ELIMINAR para confirmar.');
            }
            $this->passport->deleteAccount($u['usuario_id']);
            $res = Response::json(['ok' => true]);
            $res->cookies = $this->auth->clearCookies();
            return $res;
        });

        // ---------- Actividad y check-in ----------
        $r->add('POST', '/v1/checkin', function (Request $q) {
            [$u, $pid] = $this->traveler($q);
            $b = self::body($q);
            return Response::json($this->checkin->redeem($pid, $u['usuario_id'], (string)($b['codigo'] ?? ''), $this->idem($q)));
        });
        $r->add('PUT', '/v1/lecturas/{id}/progreso', function (Request $q, array $p) {
            [, $pid] = $this->traveler($q);
            $c = $this->catalog->content((int)$p['id']);
            if ($c['tipo'] !== 'referencia' && $c['tipo'] !== 'historia' && $c['tipo'] !== 'leyenda') {
                throw new ApiError(422, 'NO_ES_LECTURA', 'Este contenido no es una lectura.');
            }
            $total = $this->chapterCount($c);
            $b = self::body($q);
            $cap = max(1, min($total, (int)($b['capitulo'] ?? 1)));
            $pos = max(0.0, min(1.0, (float)($b['posicion'] ?? 0)));
            $this->db->exec(
                'INSERT INTO pa_lectura_progreso (pasaporte_id, contenido_id, capitulo, capitulos_total, posicion) VALUES (?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE capitulo = GREATEST(capitulo, VALUES(capitulo)), capitulos_total = VALUES(capitulos_total), posicion = VALUES(posicion), actualizada_at = UTC_TIMESTAMP()',
                [$pid, $c['id'], $cap, $total, $pos]
            );
            return Response::json($this->readingProgress($pid, (int)$c['id']));
        });
        $r->add('GET', '/v1/lecturas/{id}/progreso', function (Request $q, array $p) {
            [, $pid] = $this->traveler($q);
            return Response::json($this->readingProgress($pid, (int)$p['id']));
        });
        $r->add('POST', '/v1/eventos', function (Request $q) {
            [, $pid] = $this->traveler($q);
            $b = self::body($q);
            $tipo = (string)($b['tipo'] ?? '');
            if (!in_array($tipo, Gamification::CLIENT_EVENTS, true)) {
                throw new ApiError(422, 'EVENTO_NO_PERMITIDO', 'Tipo de evento no permitido desde el cliente.');
            }
            $c = $this->catalog->content((int)($b['contenido_id'] ?? 0));
            $expected = ['lectura_completada' => ['referencia', 'historia', 'leyenda'], 'audio_escuchado' => ['audio', 'leyenda'], 'video_visto' => ['video']][$tipo];
            if (!in_array($c['tipo'], $expected, true) || ($tipo !== 'lectura_completada' && $c['media_url'] === null)) {
                throw new ApiError(422, 'EVENTO_INCOHERENTE', 'El contenido no corresponde al tipo de evento.');
            }
            if ($tipo === 'lectura_completada') {
                $prog = $this->db->one(
                    'SELECT capitulo, capitulos_total, TIMESTAMPDIFF(SECOND, iniciada_at, UTC_TIMESTAMP()) AS segundos FROM pa_lectura_progreso WHERE pasaporte_id = ? AND contenido_id = ?',
                    [$pid, $c['id']]
                );
                $min = $this->config->int('PA_MIN_READING_SECONDS');
                if ($prog === null || (int)$prog['capitulo'] < (int)$prog['capitulos_total'] || (int)$prog['segundos'] < $min) {
                    throw new ApiError(422, 'LECTURA_INCOMPLETA', 'Aún no has terminado esta lectura.', ['segundos_minimos' => $min]);
                }
            }
            $res = $this->db->tx(fn() => $this->game->record($pid, $tipo, 'contenido', (string)$c['id'], $this->idem($q), $tipo . ':' . $c['id'], 'cliente'));
            if ($tipo === 'lectura_completada' && $res['estado'] === 'registrado') {
                $this->db->exec('UPDATE pa_lectura_progreso SET completada_at = UTC_TIMESTAMP() WHERE pasaporte_id = ? AND contenido_id = ?', [$pid, $c['id']]);
            }
            return Response::json($res);
        });

        // ---------- Álbum ----------
        $r->add('GET', '/v1/album', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json(['datos' => $this->album->list($pid)]);
        });
        $r->add('POST', '/v1/album', function (Request $q) {
            [, $pid] = $this->traveler($q);
            return Response::json($this->album->add($pid, $this->uploaded($q, 'foto'), $q->form['destino'] ?? null, $q->form['titulo'] ?? null), 201);
        });
        $r->add('GET', '/v1/album/{id}/archivo', function (Request $q, array $p) {
            [, $pid] = $this->traveler($q);
            return Response::file($this->album->filePath($pid, (int)$p['id'], $q->q('tam') === 'mini'), 'image/jpeg');
        });
        $r->add('DELETE', '/v1/album/{id}', function (Request $q, array $p) {
            [, $pid] = $this->traveler($q);
            $this->album->delete($pid, (int)$p['id']);
            return Response::json(['ok' => true]);
        });

        // ---------- Administración editorial (roles) ----------
        $r->add('POST', '/v1/admin/checkin-codigos', function (Request $q) {
            $u = $this->auth->requireRole($q, 'admin', 'editor');
            $b = self::body($q);
            return Response::json(['codigo' => $this->checkin->issue((int)($b['destino_id'] ?? 0), (int)($b['dias'] ?? 365), (int)($b['usos_max'] ?? 10000), $u['usuario_id'])], 201);
        });
        $r->add('POST', '/v1/admin/visitas', function (Request $q) {
            $u = $this->auth->requireRole($q, 'admin');
            $b = self::body($q);
            $pid = (int)$this->db->scalar('SELECT id FROM pa_pasaportes WHERE codigo = ?', [(string)($b['pasaporte_codigo'] ?? '')]);
            if ($pid === 0 || trim((string)($b['motivo'] ?? '')) === '') {
                throw new ApiError(422, 'DATOS_INVALIDOS', 'Indica pasaporte_codigo, destino_id y motivo.');
            }
            $res = $this->db->tx(fn() => $this->game->verifiedVisit($pid, (int)($b['destino_id'] ?? 0), 'admin', $this->idem($q), $u['usuario_id']));
            \PasaporteAndino\Service\Audit::log($this->db, $u['usuario_id'], 'visita.manual', 'pasaporte', (string)$pid, ['destino_id' => (int)$b['destino_id'], 'motivo' => (string)$b['motivo']]);
            return Response::json($res);
        });
        $r->add('POST', '/v1/admin/sellos/revocar', function (Request $q) {
            $u = $this->auth->requireRole($q, 'admin');
            $b = self::body($q);
            $pid = (int)$this->db->scalar('SELECT id FROM pa_pasaportes WHERE codigo = ?', [(string)($b['pasaporte_codigo'] ?? '')]);
            $this->game->revokeStamp($pid, (int)($b['sello_id'] ?? 0), $u['usuario_id'], (string)($b['motivo'] ?? ''));
            return Response::json(['ok' => true]);
        });
        $r->add('POST', '/v1/admin/monedas/revertir', function (Request $q) {
            $u = $this->auth->requireRole($q, 'admin');
            $b = self::body($q);
            return Response::json(['reversion_id' => $this->game->reverse((int)($b['movimiento_id'] ?? 0), $u['usuario_id'], (string)($b['motivo'] ?? ''))]);
        });
    }

    /** @param array<string,mixed> $c */
    private function chapterCount(array $c): int
    {
        $ref = (string)($c['biblioteca_ref'] ?? '');
        if ($ref === '') {
            return 1;
        }
        [$src, $id] = array_pad(explode(':', $ref, 2), 2, '');
        $lib = $this->libraries[$src] ?? null;
        if ($lib === null || !$lib->available()) {
            throw new ApiError(503, 'BIBLIOTECA_CE360_NO_CONFIGURADA', 'La Biblioteca Viva de Cultura Educa 360 aún no está conectada a esta edición.');
        }
        $book = $lib->find($id);
        return max(1, count($book['capitulos'] ?? []));
    }

    /** @return array<string,mixed> */
    private function readingProgress(int $pid, int $contentId): array
    {
        $r = $this->db->one('SELECT capitulo, capitulos_total, posicion, completada_at FROM pa_lectura_progreso WHERE pasaporte_id = ? AND contenido_id = ?', [$pid, $contentId]);
        return $r === null ? ['capitulo' => 1, 'capitulos_total' => null, 'posicion' => 0, 'completada' => false] : [
            'capitulo' => (int)$r['capitulo'], 'capitulos_total' => (int)$r['capitulos_total'], 'posicion' => (float)$r['posicion'], 'completada' => $r['completada_at'] !== null,
        ];
    }

    /** Página pública Open Graph para compartir (sin PII). */
    private function sharePage(Request $req, string $tipo, string $slug): Response
    {
        $lang = $req->lang();
        $item = match ($tipo) {
            'territorio' => $this->catalog->territory($slug),
            'destino' => $this->catalog->destination($slug),
            'ruta' => $this->catalog->route($slug),
            default => throw new ApiError(404, 'NO_ENCONTRADO', 'No encontrado.'),
        };
        $base = rtrim($this->config->get('PA_PUBLIC_BASE_URL'), '/');
        $hash = ['territorio' => 'distrito', 'destino' => 'destino', 'ruta' => 'ruta'][$tipo];
        $target = $base . '/#/' . $hash . '/' . rawurlencode($slug);
        $e = static fn(?string $s) => htmlspecialchars((string)$s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $title = ($item['nombre'][$lang] ?? $item['nombre']['es']) . ' · Pasaporte Andino';
        $desc = $item['resumen'][$lang] ?? $item['resumen']['es'] ?? ($lang === 'en' ? 'Explore Cajamarca with your Andean Passport.' : 'Explora Cajamarca con tu Pasaporte Andino.');
        $img = $item['imagen'] ? $base . '/' . ltrim((string)$item['imagen'], '/') : $base . '/assets/marca/logo-pasaporte-andino.png';
        $html = '<!doctype html><html lang="' . $lang . '"><head><meta charset="utf-8"><title>' . $e($title) . '</title>'
            . '<meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<meta property="og:type" content="website"><meta property="og:title" content="' . $e($title) . '">'
            . '<meta property="og:description" content="' . $e($desc) . '"><meta property="og:image" content="' . $e($img) . '">'
            . '<meta property="og:url" content="' . $e($target) . '"><meta name="twitter:card" content="summary_large_image">'
            . '<meta http-equiv="refresh" content="0;url=' . $e($target) . '"></head><body><a href="' . $e($target) . '">' . $e($title) . '</a></body></html>';
        $res = Response::html($html);
        return $res;
    }
}
