<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Support\Db;

/** Auditoría sin PII innecesaria: identificadores internos y motivo. */
final class Audit
{
    /** @param array<string,mixed> $detail */
    public static function log(Db $db, ?int $actor, string $action, string $targetType, string $targetId, array $detail = []): void
    {
        $db->exec(
            'INSERT INTO pa_auditoria (actor_usuario_id, accion, objetivo_tipo, objetivo_id, detalle) VALUES (?,?,?,?,?)',
            [$actor, $action, $targetType, $targetId, json_encode($detail, JSON_UNESCAPED_UNICODE)]
        );
    }
}
