<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Db;

/**
 * Eventos idempotentes + libro mayor de monedas simbólicas + sellos + visitas.
 * Reglas: el cliente nunca envía puntos; solo tipo de evento y referencia. El servidor decide.
 * Las monedas NO tienen valor monetario, no son canjeables ni transferibles.
 */
final class Gamification
{
    public const CLIENT_EVENTS = ['lectura_completada', 'audio_escuchado', 'video_visto'];

    public function __construct(private readonly Db $db, private readonly Catalog $catalog) {}

    /**
     * Registra un evento y aplica su regla. Debe llamarse dentro de una transacción.
     * @param array<string,mixed> $payload
     * @return array{evento_id:int,estado:string,monedas:int}
     */
    public function record(int $pid, string $tipo, ?string $refTipo, ?string $refId, string $idemKey, string $dedupeKey, string $origen, array $payload = []): array
    {
        $existing = $this->db->one('SELECT id FROM pa_eventos WHERE pasaporte_id = ? AND idempotency_key = ?', [$pid, $idemKey]);
        if ($existing !== null) {
            $mov = $this->db->scalar('SELECT cantidad FROM pa_monedas_movimientos WHERE evento_id = ?', [$existing['id']]);
            return ['evento_id' => (int)$existing['id'], 'estado' => 'repetido', 'monedas' => (int)($mov ?? 0)];
        }
        $dup = $this->db->one('SELECT id FROM pa_eventos WHERE pasaporte_id = ? AND dedupe_key = ?', [$pid, $dedupeKey]);
        if ($dup !== null) {
            return ['evento_id' => (int)$dup['id'], 'estado' => 'ya_registrado', 'monedas' => 0];
        }
        try {
            $this->db->exec(
                'INSERT INTO pa_eventos (pasaporte_id, tipo, ref_tipo, ref_id, idempotency_key, dedupe_key, origen, payload) VALUES (?,?,?,?,?,?,?,?)',
                [$pid, $tipo, $refTipo, $refId, $idemKey, $dedupeKey, $origen, $payload === [] ? null : json_encode($payload, JSON_UNESCAPED_UNICODE)]
            );
        } catch (\PDOException $e) {
            if (Db::isDuplicate($e)) { // carrera concurrente: otro proceso ganó
                return ['evento_id' => 0, 'estado' => 'ya_registrado', 'monedas' => 0];
            }
            throw $e;
        }
        $eventId = $this->db->lastId();
        $coins = 0;
        $rule = $this->db->one('SELECT codigo, categoria, monedas, descripcion_es FROM pa_reglas WHERE evento_tipo = ? AND activo = 1', [$tipo]);
        if ($rule !== null && (int)$rule['monedas'] !== 0) {
            $coins = (int)$rule['monedas'];
            $this->db->exec(
                'INSERT INTO pa_monedas_movimientos (pasaporte_id, evento_id, regla_codigo, categoria, cantidad, motivo) VALUES (?,?,?,?,?,?)',
                [$pid, $eventId, $rule['codigo'], $rule['categoria'], $coins, $rule['descripcion_es']]
            );
        }
        return ['evento_id' => $eventId, 'estado' => 'registrado', 'monedas' => $coins];
    }

    /**
     * Visita verificada (check-in QR o administración): registra visita, sello del territorio, monedas y rutas completadas.
     * Debe llamarse dentro de una transacción.
     * @return array<string,mixed>
     */
    public function verifiedVisit(int $pid, int $destinoId, string $metodo, string $idemKey, ?int $actor = null): array
    {
        $dest = $this->db->one('SELECT d.id, d.slug, d.territorio_id, s.id AS sello_id FROM pa_destinos d LEFT JOIN pa_sellos s ON s.territorio_id = d.territorio_id WHERE d.id = ?', [$destinoId]);
        if ($dest === null) {
            throw new ApiError(404, 'DESTINO_NO_ENCONTRADO', 'Lugar no encontrado.');
        }
        $origen = $metodo === 'admin' ? 'admin' : 'checkin';
        $ev = $this->record($pid, 'visita_destino', 'destino', (string)$destinoId, $idemKey, 'visita:' . $destinoId, $origen, ['metodo' => $metodo, 'actor' => $actor]);
        $result = ['visita' => $ev['estado'], 'monedas' => $ev['monedas'], 'sello_nuevo' => false, 'rutas_completadas' => []];
        if ($ev['estado'] !== 'registrado') {
            return $result;
        }
        $this->db->exec('INSERT INTO pa_visitas (pasaporte_id, destino_id, evento_id, metodo) VALUES (?,?,?,?)', [$pid, $destinoId, $ev['evento_id'], $metodo]);
        if ($dest['sello_id'] !== null) {
            $has = $this->db->one('SELECT id, revocado_at FROM pa_sellos_obtenidos WHERE pasaporte_id = ? AND sello_id = ?', [$pid, $dest['sello_id']]);
            if ($has === null) {
                $this->db->exec(
                    'INSERT INTO pa_sellos_obtenidos (pasaporte_id, sello_id, evento_id, metodo, destino_id) VALUES (?,?,?,?,?)',
                    [$pid, $dest['sello_id'], $ev['evento_id'], $metodo, $destinoId]
                );
                $result['sello_nuevo'] = true;
            }
        }
        // Rutas completadas: todas las paradas publicadas visitadas.
        $routes = $this->db->all('SELECT DISTINCT ruta_id FROM pa_ruta_destinos WHERE destino_id = ?', [$destinoId]);
        foreach ($routes as $r) {
            $rid = (int)$r['ruta_id'];
            $ids = $this->catalog->routeDestinationIds($rid);
            if ($ids === []) {
                continue;
            }
            $in = implode(',', array_fill(0, count($ids), '?'));
            $visited = (int)$this->db->scalar("SELECT COUNT(*) FROM pa_visitas WHERE pasaporte_id = ? AND destino_id IN ($in)", [$pid, ...$ids]);
            if ($visited === count($ids)) {
                $rc = $this->record($pid, 'ruta_completada', 'ruta', (string)$rid, 'sys-ruta-' . $rid, 'ruta:' . $rid, 'sistema');
                if ($rc['estado'] === 'registrado') {
                    $result['rutas_completadas'][] = $rid;
                    $result['monedas'] += $rc['monedas'];
                }
            }
        }
        return $result;
    }

    /** @return array<string,mixed> */
    public function summary(int $pid): array
    {
        $byCat = ['visitas' => 0, 'retos' => 0, 'cultura' => 0, 'actividades' => 0];
        foreach ($this->db->all('SELECT categoria, SUM(cantidad) AS total FROM pa_monedas_movimientos WHERE pasaporte_id = ? GROUP BY categoria', [$pid]) as $r) {
            $byCat[$r['categoria']] = (int)$r['total'];
        }
        $stampsTotal = (int)$this->db->scalar('SELECT COUNT(*) FROM pa_sellos s JOIN pa_territorios t ON t.id = s.territorio_id WHERE t.estado = \'publicado\'');
        $stamps = (int)$this->db->scalar('SELECT COUNT(*) FROM pa_sellos_obtenidos WHERE pasaporte_id = ? AND revocado_at IS NULL', [$pid]);
        return [
            'monedas' => ['total' => array_sum($byCat), 'por_categoria' => $byCat],
            'sellos' => ['obtenidos' => $stamps, 'total' => $stampsTotal],
            'fotos' => (int)$this->db->scalar('SELECT COUNT(*) FROM pa_album_fotos WHERE pasaporte_id = ? AND eliminado_at IS NULL', [$pid]),
            'territorios_visitados' => (int)$this->db->scalar('SELECT COUNT(DISTINCT d.territorio_id) FROM pa_visitas v JOIN pa_destinos d ON d.id = v.destino_id WHERE v.pasaporte_id = ?', [$pid]),
            'lugares_visitados' => (int)$this->db->scalar('SELECT COUNT(*) FROM pa_visitas WHERE pasaporte_id = ?', [$pid]),
            'rutas_completadas' => (int)$this->db->scalar('SELECT COUNT(*) FROM pa_eventos WHERE pasaporte_id = ? AND tipo = \'ruta_completada\'', [$pid]),
            'lecturas_completadas' => (int)$this->db->scalar('SELECT COUNT(*) FROM pa_eventos WHERE pasaporte_id = ? AND tipo = \'lectura_completada\'', [$pid]),
        ];
    }

    /** @return list<array<string,mixed>> */
    public function stamps(int $pid): array
    {
        $rows = $this->db->all(
            'SELECT s.id, s.imagen, s.moneda_imagen, s.color, t.slug, t.nombre_es, t.nombre_en, t.orden, so.obtenido_at, so.metodo, so.revocado_at,
                    d.slug AS destino_slug
             FROM pa_sellos s JOIN pa_territorios t ON t.id = s.territorio_id
             LEFT JOIN pa_sellos_obtenidos so ON so.sello_id = s.id AND so.pasaporte_id = ?
             LEFT JOIN pa_destinos d ON d.id = so.destino_id
             WHERE t.estado = \'publicado\' ORDER BY t.orden, t.nombre_es',
            [$pid]
        );
        return array_map(static fn($r) => [
            'id' => (int)$r['id'],
            'territorio' => ['slug' => $r['slug'], 'nombre' => ['es' => $r['nombre_es'], 'en' => $r['nombre_en']]],
            'imagen' => $r['imagen'],
            'moneda_imagen' => $r['moneda_imagen'],
            'color' => $r['color'],
            'obtenido' => $r['obtenido_at'] !== null && $r['revocado_at'] === null,
            'obtenido_at' => $r['revocado_at'] === null ? $r['obtenido_at'] : null,
            'metodo' => $r['revocado_at'] === null ? $r['metodo'] : null,
            'destino_slug' => $r['destino_slug'],
        ], $rows);
    }

    /** @return list<array<string,mixed>> */
    public function ledger(int $pid, int $limit = 50): array
    {
        $rows = $this->db->all(
            'SELECT m.id, m.categoria, m.cantidad, m.motivo, m.regla_codigo, m.revierte_id, m.creado_at, e.tipo, e.ref_tipo, e.ref_id,
                    d.slug AS d_slug, d.nombre_es AS d_nombre_es, d.nombre_en AS d_nombre_en, d.imagen AS d_imagen,
                    t.nombre_es AS t_nombre_es, t.nombre_en AS t_nombre_en
             FROM pa_monedas_movimientos m
             LEFT JOIN pa_eventos e ON e.id = m.evento_id
             LEFT JOIN pa_destinos d ON e.ref_tipo = \'destino\' AND d.id = e.ref_id
             LEFT JOIN pa_territorios t ON t.id = d.territorio_id
             WHERE m.pasaporte_id = ? ORDER BY m.id DESC LIMIT ' . max(1, min(200, $limit)),
            [$pid]
        );
        return array_map(static fn($r) => [
            'id' => (int)$r['id'],
            'categoria' => $r['categoria'],
            'cantidad' => (int)$r['cantidad'],
            'motivo' => $r['motivo'],
            'regla' => $r['regla_codigo'],
            'es_reversion' => $r['revierte_id'] !== null,
            'creado_at' => $r['creado_at'],
            'evento' => $r['tipo'],
            'destino' => $r['d_slug'] ? ['slug' => $r['d_slug'], 'nombre' => ['es' => $r['d_nombre_es'], 'en' => $r['d_nombre_en']], 'imagen' => $r['d_imagen'], 'territorio' => ['es' => $r['t_nombre_es'], 'en' => $r['t_nombre_en']]] : null,
        ], $rows);
    }

    /** @return list<array<string,mixed>> */
    public function rules(): array
    {
        return array_map(static fn($r) => [
            'codigo' => $r['codigo'], 'evento' => $r['evento_tipo'], 'categoria' => $r['categoria'], 'monedas' => (int)$r['monedas'],
            'descripcion' => ['es' => $r['descripcion_es'], 'en' => $r['descripcion_en']],
        ], $this->db->all('SELECT * FROM pa_reglas WHERE activo = 1 ORDER BY monedas DESC'));
    }

    /** Reversión auditada de un movimiento (fila negativa enlazada). */
    public function reverse(int $movementId, int $actor, string $reason): int
    {
        return $this->db->tx(function () use ($movementId, $actor, $reason): int {
            $m = $this->db->one('SELECT * FROM pa_monedas_movimientos WHERE id = ? FOR UPDATE', [$movementId]);
            if ($m === null || $m['revierte_id'] !== null) {
                throw new ApiError(404, 'MOVIMIENTO_NO_REVERSIBLE', 'Movimiento inexistente o ya es una reversión.');
            }
            try {
                $this->db->exec(
                    'INSERT INTO pa_monedas_movimientos (pasaporte_id, categoria, cantidad, motivo, revierte_id, autor_usuario_id) VALUES (?,?,?,?,?,?)',
                    [$m['pasaporte_id'], $m['categoria'], -(int)$m['cantidad'], 'Reversión: ' . mb_substr($reason, 0, 200), $movementId, $actor]
                );
            } catch (\PDOException $e) {
                if (Db::isDuplicate($e)) {
                    throw new ApiError(409, 'YA_REVERTIDO', 'Este movimiento ya fue revertido.');
                }
                throw $e;
            }
            $id = $this->db->lastId();
            Audit::log($this->db, $actor, 'monedas.revertir', 'movimiento', (string)$movementId, ['motivo' => $reason, 'reversion_id' => $id]);
            return $id;
        });
    }

    public function revokeStamp(int $pid, int $stampId, int $actor, string $reason): void
    {
        $n = $this->db->exec(
            'UPDATE pa_sellos_obtenidos SET revocado_at = UTC_TIMESTAMP(), revocado_por = ?, motivo_revocacion = ? WHERE pasaporte_id = ? AND sello_id = ? AND revocado_at IS NULL',
            [$actor, mb_substr($reason, 0, 250), $pid, $stampId]
        );
        if ($n === 0) {
            throw new ApiError(404, 'SELLO_NO_ACTIVO', 'El viajero no tiene ese sello activo.');
        }
        Audit::log($this->db, $actor, 'sello.revocar', 'pasaporte', (string)$pid, ['sello_id' => $stampId, 'motivo' => $reason]);
    }
}
