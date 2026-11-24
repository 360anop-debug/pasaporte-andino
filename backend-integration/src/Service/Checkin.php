<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;
use PasaporteAndino\Support\Ids;

/**
 * Check-in presencial con QR firmado impreso en el lugar.
 * Formato: PA1.<destino_id>.<nonce>.<expira_unix>.<firma>
 * firma = base64url(HMAC-SHA256(PA_SECRET, "PA1|destino|nonce|expira"))[0..21]
 * Controles: firma, expiración, revocación, límite de usos, rate-limit por usuario, una visita por lugar.
 * Pulsar "Ver detalle" o "Ver mapa" NUNCA otorga visita ni sello.
 */
final class Checkin
{
    public function __construct(
        private readonly Db $db,
        private readonly Config $config,
        private readonly Gamification $game,
        private readonly RateLimiter $limiter,
    ) {}

    private function sign(int $destino, string $nonce, int $exp): string
    {
        $mac = hash_hmac('sha256', "PA1|$destino|$nonce|$exp", $this->config->get('PA_SECRET'), true);
        return substr(Ids::b64url($mac), 0, 22);
    }

    public function issue(int $destinoId, int $days, int $maxUses, ?int $actor): string
    {
        if ($this->db->scalar('SELECT id FROM pa_destinos WHERE id = ?', [$destinoId]) === null) {
            throw new ApiError(404, 'DESTINO_NO_ENCONTRADO', 'Lugar no encontrado.');
        }
        $nonce = Ids::token(12);
        $exp = time() + max(1, $days) * 86400;
        $this->db->exec(
            'INSERT INTO pa_checkin_codigos (destino_id, nonce, expira_at, usos_max, creado_por) VALUES (?,?,FROM_UNIXTIME(?),?,?)',
            [$destinoId, $nonce, $exp, max(1, $maxUses), $actor]
        );
        Audit::log($this->db, $actor, 'checkin.emitir', 'destino', (string)$destinoId, ['nonce_prefix' => substr($nonce, 0, 4), 'expira' => $exp]);
        return "PA1.$destinoId.$nonce.$exp." . $this->sign($destinoId, $nonce, $exp);
    }

    /** @return array<string,mixed> */
    public function redeem(int $pid, int $userId, string $code, string $idemKey): array
    {
        $this->limiter->hit('checkin', (string)$userId, 12, 600);
        $code = trim($code);
        if (str_contains($code, '#/checkin/')) { // admite la URL completa del QR
            $code = rawurldecode(substr($code, strrpos($code, '/') + 1));
        }
        $parts = explode('.', $code);
        if (count($parts) !== 5 || $parts[0] !== 'PA1' || !ctype_digit($parts[1]) || !ctype_digit($parts[3])) {
            throw new ApiError(422, 'CODIGO_INVALIDO', 'El código no corresponde a un punto de control del Pasaporte Andino.');
        }
        [, $dest, $nonce, $exp, $sig] = $parts;
        if (!hash_equals($this->sign((int)$dest, $nonce, (int)$exp), $sig)) {
            throw new ApiError(422, 'CODIGO_INVALIDO', 'El código no corresponde a un punto de control del Pasaporte Andino.');
        }
        if ((int)$exp < time()) {
            throw new ApiError(410, 'CODIGO_EXPIRADO', 'Este código ha expirado. Solicita uno vigente en el lugar.');
        }
        return $this->db->tx(function () use ($pid, $dest, $nonce, $idemKey): array {
            $row = $this->db->one('SELECT id, destino_id, usos, usos_max, revocado_at FROM pa_checkin_codigos WHERE nonce = ? FOR UPDATE', [$nonce]);
            if ($row === null || (int)$row['destino_id'] !== (int)$dest || $row['revocado_at'] !== null) {
                throw new ApiError(410, 'CODIGO_REVOCADO', 'Este código ya no es válido.');
            }
            if ((int)$row['usos'] >= (int)$row['usos_max']) {
                throw new ApiError(410, 'CODIGO_AGOTADO', 'Este código alcanzó su límite de usos.');
            }
            $res = $this->game->verifiedVisit($pid, (int)$dest, 'checkin_qr', $idemKey);
            if ($res['visita'] === 'registrado') {
                $this->db->exec('UPDATE pa_checkin_codigos SET usos = usos + 1 WHERE id = ?', [$row['id']]);
            }
            $res['destino_id'] = (int)$dest;
            return $res;
        });
    }
}
