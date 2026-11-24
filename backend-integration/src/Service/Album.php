<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;
use PasaporteAndino\Support\Ids;

/** Álbum fotográfico personal. Fotos PRIVADAS por defecto; se sirven solo al propietario autenticado. */
final class Album
{
    private const MAX_PHOTOS = 500;

    public function __construct(private readonly Db $db, private readonly Config $config, private readonly RateLimiter $limiter) {}

    /** @return list<array<string,mixed>> */
    public function list(int $pid): array
    {
        return array_map(static fn($r) => [
            'id' => (int)$r['id'],
            'titulo' => $r['titulo'],
            'ancho' => (int)$r['ancho'],
            'alto' => (int)$r['alto'],
            'creado_at' => $r['creado_at'],
            'privada' => (bool)$r['privada'],
            'destino' => $r['d_slug'] ? ['slug' => $r['d_slug'], 'nombre' => ['es' => $r['d_nombre_es'], 'en' => $r['d_nombre_en']]] : null,
            'verificado' => $r['visitado'] !== null,
        ], $this->db->all(
            'SELECT f.*, d.slug AS d_slug, d.nombre_es AS d_nombre_es, d.nombre_en AS d_nombre_en, v.id AS visitado
             FROM pa_album_fotos f LEFT JOIN pa_destinos d ON d.id = f.destino_id
             LEFT JOIN pa_visitas v ON v.pasaporte_id = f.pasaporte_id AND v.destino_id = f.destino_id
             WHERE f.pasaporte_id = ? AND f.eliminado_at IS NULL ORDER BY f.id DESC',
            [$pid]
        ));
    }

    /** @return array<string,mixed> */
    public function add(int $pid, string $tmpPath, ?string $destinoSlug, ?string $title): array
    {
        $this->limiter->hit('album', (string)$pid, 40, 3600);
        if ((int)$this->db->scalar('SELECT COUNT(*) FROM pa_album_fotos WHERE pasaporte_id = ? AND eliminado_at IS NULL', [$pid]) >= self::MAX_PHOTOS) {
            throw new ApiError(422, 'ALBUM_LLENO', 'Alcanzaste el máximo de fotos del álbum.');
        }
        $destinoId = null;
        if ($destinoSlug !== null && $destinoSlug !== '') {
            $destinoId = $this->db->scalar('SELECT id FROM pa_destinos WHERE slug = ?', [$destinoSlug]);
            if ($destinoId === null) {
                throw new ApiError(422, 'DESTINO_INVALIDO', 'Lugar no válido.', ['campo' => 'destino']);
            }
        }
        $title = $title !== null ? mb_substr(trim(strip_tags($title)), 0, 120) : null;
        [$img] = Images::load($tmpPath, $this->config->int('PA_UPLOAD_MAX_BYTES'));
        $dir = $this->config->storageDir() . '/album';
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        $name = Ids::token(18);
        [$w, $h] = Images::resizeTo($img, 2048, "$dir/$name.jpg");
        Images::resizeTo($img, 480, "$dir/{$name}_t.jpg");
        $this->db->exec(
            'INSERT INTO pa_album_fotos (pasaporte_id, destino_id, archivo, miniatura, mime, bytes, ancho, alto, titulo, privada) VALUES (?,?,?,?,?,?,?,?,?,1)',
            [$pid, $destinoId, "$name.jpg", "{$name}_t.jpg", 'image/jpeg', (int)filesize("$dir/$name.jpg"), $w, $h, $title === '' ? null : $title]
        );
        $id = $this->db->lastId();
        foreach ($this->list($pid) as $p) {
            if ($p['id'] === $id) {
                return $p;
            }
        }
        throw new \RuntimeException('Foto no encontrada tras guardarla.');
    }

    public function filePath(int $pid, int $photoId, bool $thumb): string
    {
        $r = $this->db->one('SELECT archivo, miniatura FROM pa_album_fotos WHERE id = ? AND pasaporte_id = ? AND eliminado_at IS NULL', [$photoId, $pid]);
        if ($r === null) {
            throw new ApiError(404, 'FOTO_NO_ENCONTRADA', 'Foto no encontrada.');
        }
        $path = $this->config->storageDir() . '/album/' . ($thumb ? $r['miniatura'] : $r['archivo']);
        if (!is_file($path)) {
            throw new ApiError(404, 'FOTO_NO_ENCONTRADA', 'Foto no encontrada.');
        }
        return $path;
    }

    public function delete(int $pid, int $photoId): void
    {
        $r = $this->db->one('SELECT archivo, miniatura FROM pa_album_fotos WHERE id = ? AND pasaporte_id = ? AND eliminado_at IS NULL', [$photoId, $pid]);
        if ($r === null) {
            throw new ApiError(404, 'FOTO_NO_ENCONTRADA', 'Foto no encontrada.');
        }
        $this->db->exec('UPDATE pa_album_fotos SET eliminado_at = UTC_TIMESTAMP() WHERE id = ?', [$photoId]);
        @unlink($this->config->storageDir() . '/album/' . $r['archivo']);
        @unlink($this->config->storageDir() . '/album/' . $r['miniatura']);
    }
}
