<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Db;

/** Límite por ventana fija almacenado en MariaDB (sin dependencias externas). */
final class RateLimiter
{
    public function __construct(private readonly Db $db) {}

    public function hit(string $bucket, string $subject, int $max, int $windowSeconds): void
    {
        $key = hash('sha256', $bucket . '|' . $subject);
        $now = time();
        $window = $now - ($now % $windowSeconds);
        $this->db->exec(
            'INSERT INTO pa_rate_limit (clave, ventana_inicio, conteo) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE conteo = IF(ventana_inicio = VALUES(ventana_inicio), conteo + 1, 1),
                                     ventana_inicio = VALUES(ventana_inicio)',
            [$key, $window]
        );
        $count = (int)$this->db->scalar('SELECT conteo FROM pa_rate_limit WHERE clave = ?', [$key]);
        if ($count > $max) {
            throw new ApiError(429, 'DEMASIADAS_PETICIONES', 'Demasiados intentos. Espera unos minutos.', [
                'reintentar_en' => $window + $windowSeconds - $now,
            ]);
        }
    }
}
