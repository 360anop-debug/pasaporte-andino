<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Http\Request;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;
use PasaporteAndino\Support\Ids;

/**
 * Autenticación propia del módulo turístico.
 * - Apps (Android/Windows): token Bearer opaco, guardado en almacenamiento seguro del sistema.
 * - Web: cookie HttpOnly + doble envío CSRF (cabecera X-PA-CSRF == cookie pa_csrf).
 * Solo se guarda el SHA-256 del token en base de datos.
 * NOTA: no reemplaza ni toca la autenticación de Cultura Educa 360.
 */
final class Auth
{
    public const COOKIE = 'pa_sess';
    public const CSRF_COOKIE = 'pa_csrf';

    public function __construct(private readonly Db $db, private readonly Config $config, private readonly RateLimiter $limiter) {}

    /** @return array{usuario_id:int,rol:string,es_invitado:bool,via:string,sesion_id:int}|null */
    public function current(Request $req): ?array
    {
        $via = 'bearer';
        $auth = $req->header('authorization');
        $token = '';
        if (str_starts_with($auth, 'Bearer ')) {
            $token = trim(substr($auth, 7));
        } elseif (isset($req->cookies[self::COOKIE])) {
            $token = $req->cookies[self::COOKIE];
            $via = 'cookie';
        }
        if ($token === '' || strlen($token) > 100) {
            return null;
        }
        $row = $this->db->one(
            'SELECT s.id, s.usuario_id, u.rol, u.es_invitado FROM pa_sesiones s JOIN pa_usuarios u ON u.id = s.usuario_id
             WHERE s.token_hash = ? AND s.revocado_at IS NULL AND s.expira_at > UTC_TIMESTAMP() AND u.eliminado_at IS NULL',
            [hash('sha256', $token)]
        );
        if ($row === null) {
            return null;
        }
        if ($via === 'cookie' && !in_array($req->method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            $csrf = $req->header('x-pa-csrf');
            if ($csrf === '' || !hash_equals($req->cookies[self::CSRF_COOKIE] ?? '', $csrf)) {
                throw new ApiError(403, 'CSRF_INVALIDO', 'Falta o no coincide el token CSRF.');
            }
        }
        return [
            'usuario_id' => (int)$row['usuario_id'],
            'rol' => (string)$row['rol'],
            'es_invitado' => (bool)$row['es_invitado'],
            'via' => $via,
            'sesion_id' => (int)$row['id'],
        ];
    }

    /** @return array{usuario_id:int,rol:string,es_invitado:bool,via:string,sesion_id:int} */
    public function require(Request $req): array
    {
        $u = $this->current($req);
        if ($u === null) {
            throw new ApiError(401, 'NO_AUTENTICADO', 'Inicia sesión o crea tu pasaporte para continuar.');
        }
        return $u;
    }

    /** @return array{usuario_id:int,rol:string,es_invitado:bool,via:string,sesion_id:int} */
    public function requireRole(Request $req, string ...$roles): array
    {
        $u = $this->require($req);
        if (!in_array($u['rol'], $roles, true)) {
            throw new ApiError(403, 'SIN_PERMISO', 'No tienes permiso para esta acción.');
        }
        return $u;
    }

    public static function client(Request $req): string
    {
        $c = $req->header('x-pa-client');
        return in_array($c, ['android', 'windows'], true) ? $c : 'web';
    }

    /** @return array{token:string,usuario_id:int} */
    public function createGuest(Request $req): array
    {
        $this->limiter->hit('invitado', $req->ip, 30, 3600);
        $this->db->exec('INSERT INTO pa_usuarios (rol, es_invitado) VALUES (\'viajero\', 1)');
        $uid = $this->db->lastId();
        return ['token' => $this->openSession($uid, self::client($req)), 'usuario_id' => $uid];
    }

    public function openSession(int $userId, string $client): string
    {
        $token = Ids::token(32);
        $days = max(1, $this->config->int('PA_SESSION_DAYS'));
        $this->db->exec(
            'INSERT INTO pa_sesiones (usuario_id, token_hash, cliente, expira_at) VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY)',
            [$userId, hash('sha256', $token), $client, $days]
        );
        return $token;
    }

    /** Convierte la cuenta invitada actual en cuenta persistente (email + contraseña). */
    public function register(Request $req, int $userId, string $email, string $password): void
    {
        $this->limiter->hit('registro', $req->ip, 10, 3600);
        $email = mb_strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
            throw new ApiError(422, 'EMAIL_INVALIDO', 'Correo electrónico no válido.', ['campo' => 'email']);
        }
        if (mb_strlen($password) < 10 || mb_strlen($password) > 200) {
            throw new ApiError(422, 'CLAVE_DEBIL', 'La contraseña debe tener al menos 10 caracteres.', ['campo' => 'password']);
        }
        $user = $this->db->one('SELECT es_invitado FROM pa_usuarios WHERE id = ?', [$userId]);
        if ($user === null || !(bool)$user['es_invitado']) {
            throw new ApiError(409, 'YA_REGISTRADO', 'Esta cuenta ya tiene correo asociado.');
        }
        try {
            $this->db->exec(
                'UPDATE pa_usuarios SET email = ?, password_hash = ?, es_invitado = 0 WHERE id = ?',
                [$email, password_hash($password, PASSWORD_DEFAULT), $userId]
            );
        } catch (\PDOException $e) {
            if (Db::isDuplicate($e)) {
                throw new ApiError(409, 'EMAIL_EN_USO', 'Ese correo ya está registrado. Inicia sesión.', ['campo' => 'email']);
            }
            throw $e;
        }
    }

    /** @return array{token:string,usuario_id:int} */
    public function login(Request $req, string $email, string $password): array
    {
        $email = mb_strtolower(trim($email));
        $this->limiter->hit('login-ip', $req->ip, 30, 900);
        $this->limiter->hit('login-email', $email, 10, 900);
        $row = $this->db->one('SELECT id, password_hash FROM pa_usuarios WHERE email = ? AND eliminado_at IS NULL', [$email]);
        $hash = $row['password_hash'] ?? null;
        // Verificación en tiempo constante aunque el usuario no exista.
        $ok = password_verify($password, is_string($hash) ? $hash : '$2y$10$usesomesillystringforsaltOGq1CvNTWnFJmJ8ejTzbVaJh7RGhcW');
        if (!$ok || $row === null) {
            throw new ApiError(401, 'CREDENCIALES', 'Correo o contraseña incorrectos.');
        }
        if (password_needs_rehash((string)$hash, PASSWORD_DEFAULT)) {
            $this->db->exec('UPDATE pa_usuarios SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $row['id']]);
        }
        return ['token' => $this->openSession((int)$row['id'], self::client($req)), 'usuario_id' => (int)$row['id']];
    }

    public function logout(int $sessionId): void
    {
        $this->db->exec('UPDATE pa_sesiones SET revocado_at = UTC_TIMESTAMP() WHERE id = ?', [$sessionId]);
    }

    /** @return list<string> Set-Cookie para la web */
    public function cookiesFor(string $token): array
    {
        $secure = $this->config->bool('PA_COOKIE_SECURE') ? '; Secure' : '';
        $maxAge = 86400 * max(1, $this->config->int('PA_SESSION_DAYS'));
        $csrf = Ids::token(24);
        return [
            self::COOKIE . '=' . $token . '; Path=/; Max-Age=' . $maxAge . '; HttpOnly; SameSite=Lax' . $secure,
            self::CSRF_COOKIE . '=' . $csrf . '; Path=/; Max-Age=' . $maxAge . '; SameSite=Lax' . $secure,
        ];
    }

    /** @return list<string> */
    public function clearCookies(): array
    {
        return [
            self::COOKIE . '=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
            self::CSRF_COOKIE . '=; Path=/; Max-Age=0; SameSite=Lax',
        ];
    }
}
