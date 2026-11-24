<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Db;

/**
 * Contenido público del módulo turístico. Solo se exponen registros publicados.
 * Los registros es_demo=1 (contenido de validación de diseño) jamás se exponen en producción.
 * Los textos se devuelven en ambos idiomas {es,en} para permitir cambio de idioma sin red.
 */
final class Catalog
{
    public function __construct(private readonly Db $db, private readonly bool $showDemo) {}

    private function vis(string $alias): string
    {
        return "{$alias}.estado = 'publicado' AND ({$alias}.es_demo = 0 OR " . ($this->showDemo ? '1' : '0') . ')';
    }

    /** @param array<string,mixed> $r */
    private static function i18n(array $r, string $field): array
    {
        return ['es' => $r[$field . '_es'] ?? null, 'en' => $r[$field . '_en'] ?? $r[$field . '_es'] ?? null];
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private function territoryRow(array $r): array
    {
        return [
            'id' => (int)$r['id'],
            'slug' => $r['slug'],
            'nombre' => self::i18n($r, 'nombre'),
            'tipo' => $r['tipo'],
            'resumen' => self::i18n($r, 'resumen'),
            'imagen' => $r['imagen'],
            'imagen_es_ilustracion' => (bool)$r['imagen_es_ilustracion'],
            'ubicacion' => $r['lat'] !== null ? ['lat' => (float)$r['lat'], 'lng' => (float)$r['lng'], 'validada' => (bool)$r['ubicacion_validada']] : null,
            'fuente' => $r['fuente'],
            'es_demo' => (bool)$r['es_demo'],
            'num_lugares' => (int)($r['num_lugares'] ?? 0),
            'sello' => isset($r['sello_id']) ? ['id' => (int)$r['sello_id'], 'imagen' => $r['sello_imagen'], 'moneda_imagen' => $r['moneda_imagen'], 'color' => $r['sello_color']] : null,
        ];
    }

    /** @return list<array<string,mixed>> */
    public function territories(string $q = '', string $tipo = '', string $orden = 'orden'): array
    {
        $sql = 'SELECT t.*, s.id AS sello_id, s.imagen AS sello_imagen, s.moneda_imagen, s.color AS sello_color,
                  (SELECT COUNT(*) FROM pa_destinos d WHERE d.territorio_id = t.id AND ' . $this->vis('d') . ') AS num_lugares
                FROM pa_territorios t LEFT JOIN pa_sellos s ON s.territorio_id = t.id
                WHERE ' . $this->vis('t');
        $p = [];
        if ($q !== '') {
            $sql .= ' AND (t.nombre_es LIKE ? OR t.nombre_en LIKE ? OR EXISTS (SELECT 1 FROM pa_destinos d2 WHERE d2.territorio_id = t.id AND ' . $this->vis('d2') . ' AND (d2.nombre_es LIKE ? OR d2.etiquetas LIKE ?)))';
            $like = '%' . addcslashes(mb_substr($q, 0, 60), '%_\\') . '%';
            array_push($p, $like, $like, $like, $like);
        }
        if (in_array($tipo, ['provincia', 'distrito'], true)) {
            $sql .= ' AND t.tipo = ?';
            $p[] = $tipo;
        }
        $sql .= match ($orden) {
            'nombre' => ' ORDER BY t.nombre_es',
            'lugares' => ' ORDER BY num_lugares DESC, t.nombre_es',
            default => ' ORDER BY t.orden, t.nombre_es',
        };
        return array_map(fn($r) => $this->territoryRow($r), $this->db->all($sql, $p));
    }

    /** @return array<string,mixed> */
    public function territory(string $slug): array
    {
        $r = $this->db->one(
            'SELECT t.*, s.id AS sello_id, s.imagen AS sello_imagen, s.moneda_imagen, s.color AS sello_color, 0 AS num_lugares
             FROM pa_territorios t LEFT JOIN pa_sellos s ON s.territorio_id = t.id WHERE t.slug = ? AND ' . $this->vis('t'),
            [$slug]
        );
        if ($r === null) {
            throw new ApiError(404, 'TERRITORIO_NO_ENCONTRADO', 'Distrito no encontrado.');
        }
        $t = $this->territoryRow($r);
        $t['destinos'] = $this->destinations(territorio: $slug);
        $t['num_lugares'] = count($t['destinos']);
        $t['contenidos'] = $this->contentsFor('territorio_id', (int)$r['id']);
        $t['rutas'] = $this->routes(territorioId: (int)$r['id']);
        return $t;
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private function destinationRow(array $r): array
    {
        return [
            'id' => (int)$r['id'],
            'slug' => $r['slug'],
            'territorio' => ['slug' => $r['t_slug'], 'nombre' => ['es' => $r['t_nombre_es'], 'en' => $r['t_nombre_en']]],
            'nombre' => self::i18n($r, 'nombre'),
            'categoria' => $r['categoria'],
            'etiquetas' => $r['etiquetas'] ? array_map('trim', explode(',', (string)$r['etiquetas'])) : [],
            'resumen' => self::i18n($r, 'resumen'),
            'imagen' => $r['imagen'],
            'imagen_es_ilustracion' => (bool)$r['imagen_es_ilustracion'],
            'ubicacion' => $r['lat'] !== null ? ['lat' => (float)$r['lat'], 'lng' => (float)$r['lng'], 'validada' => (bool)$r['ubicacion_validada']] : null,
            'fuente' => $r['fuente'],
            'es_demo' => (bool)$r['es_demo'],
        ];
    }

    /** @return list<array<string,mixed>> */
    public function destinations(string $q = '', string $territorio = '', string $categoria = '', string $orden = 'orden'): array
    {
        $sql = 'SELECT d.*, t.slug AS t_slug, t.nombre_es AS t_nombre_es, t.nombre_en AS t_nombre_en
                FROM pa_destinos d JOIN pa_territorios t ON t.id = d.territorio_id WHERE ' . $this->vis('d') . ' AND ' . $this->vis('t');
        $p = [];
        if ($q !== '') {
            $like = '%' . addcslashes(mb_substr($q, 0, 60), '%_\\') . '%';
            $sql .= ' AND (d.nombre_es LIKE ? OR d.nombre_en LIKE ? OR d.etiquetas LIKE ? OR t.nombre_es LIKE ?)';
            array_push($p, $like, $like, $like, $like);
        }
        if ($territorio !== '') {
            $sql .= ' AND t.slug = ?';
            $p[] = $territorio;
        }
        if ($categoria !== '') {
            $sql .= ' AND d.categoria = ?';
            $p[] = $categoria;
        }
        $sql .= $orden === 'nombre' ? ' ORDER BY d.nombre_es' : ' ORDER BY d.orden, d.nombre_es';
        return array_map(fn($r) => $this->destinationRow($r), $this->db->all($sql, $p));
    }

    /** @return array<string,mixed> */
    public function destination(string $slug): array
    {
        $r = $this->db->one(
            'SELECT d.*, t.slug AS t_slug, t.nombre_es AS t_nombre_es, t.nombre_en AS t_nombre_en
             FROM pa_destinos d JOIN pa_territorios t ON t.id = d.territorio_id WHERE d.slug = ? AND ' . $this->vis('d') . ' AND ' . $this->vis('t'),
            [$slug]
        );
        if ($r === null) {
            throw new ApiError(404, 'DESTINO_NO_ENCONTRADO', 'Lugar no encontrado.');
        }
        $d = $this->destinationRow($r);
        $d['contenidos'] = $this->contentsFor('destino_id', (int)$r['id']);
        $d['rutas'] = $this->routes(destinoId: (int)$r['id']);
        return $d;
    }

    /** @return array<string,list<array<string,mixed>>> */
    private function contentsFor(string $column, int $id): array
    {
        $rows = $this->db->all('SELECT c.* FROM pa_contenidos c WHERE c.' . $column . ' = ? AND ' . $this->vis('c') . ' ORDER BY c.tipo, c.orden, c.id', [$id]);
        $groups = ['historia' => [], 'dato' => [], 'linea_tiempo' => [], 'personaje' => [], 'video' => [], 'audio' => [], 'leyenda' => [], 'referencia' => [], 'galeria' => []];
        foreach ($rows as $r) {
            $groups[$r['tipo']][] = $this->contentRow($r);
        }
        return $groups;
    }

    /** @param array<string,mixed> $r @return array<string,mixed> */
    private function contentRow(array $r): array
    {
        return [
            'id' => (int)$r['id'],
            'tipo' => $r['tipo'],
            'titulo' => self::i18n($r, 'titulo'),
            'cuerpo' => self::i18n($r, 'cuerpo'),
            'autor' => $r['autor'],
            'fuente' => $r['fuente'],
            'licencia' => $r['licencia'],
            'credito' => $r['credito'],
            'media_url' => $r['media_url'],
            'poster_url' => $r['poster_url'],
            'subtitulos_url' => $r['subtitulos_url'],
            'duracion_seg' => $r['duracion_seg'] !== null ? (int)$r['duracion_seg'] : null,
            'biblioteca_ref' => $r['biblioteca_ref'],
            'es_ilustracion' => (bool)$r['es_ilustracion'],
            'es_demo' => (bool)$r['es_demo'],
        ];
    }

    /** @return array<string,mixed> */
    public function content(int $id): array
    {
        $r = $this->db->one('SELECT c.* FROM pa_contenidos c WHERE c.id = ? AND ' . $this->vis('c'), [$id]);
        if ($r === null) {
            throw new ApiError(404, 'CONTENIDO_NO_ENCONTRADO', 'Contenido no encontrado.');
        }
        return $this->contentRow($r);
    }

    /** @return list<array<string,mixed>> */
    public function routes(?int $territorioId = null, ?int $destinoId = null, string $tema = ''): array
    {
        $sql = 'SELECT r.*, (SELECT COUNT(*) FROM pa_ruta_destinos rd JOIN pa_destinos d ON d.id = rd.destino_id WHERE rd.ruta_id = r.id AND ' . $this->vis('d') . ') AS num_lugares
                FROM pa_rutas r WHERE ' . $this->vis('r');
        $p = [];
        if ($territorioId !== null) {
            $sql .= ' AND EXISTS (SELECT 1 FROM pa_ruta_destinos rd2 JOIN pa_destinos d2 ON d2.id = rd2.destino_id WHERE rd2.ruta_id = r.id AND d2.territorio_id = ?)';
            $p[] = $territorioId;
        }
        if ($destinoId !== null) {
            $sql .= ' AND EXISTS (SELECT 1 FROM pa_ruta_destinos rd3 WHERE rd3.ruta_id = r.id AND rd3.destino_id = ?)';
            $p[] = $destinoId;
        }
        if ($tema !== '') {
            $sql .= ' AND r.tema = ?';
            $p[] = $tema;
        }
        $sql .= ' ORDER BY r.orden, r.id';
        return array_map(static fn($r) => [
            'id' => (int)$r['id'],
            'slug' => $r['slug'],
            'tema' => $r['tema'],
            'nombre' => self::i18n($r, 'nombre'),
            'resumen' => self::i18n($r, 'resumen'),
            'duracion' => self::i18n($r, 'duracion'),
            'imagen' => $r['imagen'],
            'num_lugares' => (int)$r['num_lugares'],
            'es_demo' => (bool)$r['es_demo'],
        ], $this->db->all($sql, $p));
    }

    /** @return array<string,mixed> */
    public function route(string $slug): array
    {
        $all = array_values(array_filter($this->routes(), static fn($r) => $r['slug'] === $slug));
        if ($all === []) {
            throw new ApiError(404, 'RUTA_NO_ENCONTRADA', 'Ruta no encontrada.');
        }
        $route = $all[0];
        $ids = $this->db->all('SELECT destino_id FROM pa_ruta_destinos WHERE ruta_id = ? ORDER BY orden', [$route['id']]);
        $order = array_flip(array_map(static fn($r) => (int)$r['destino_id'], $ids));
        $dest = array_values(array_filter($this->destinations(), static fn($d) => isset($order[$d['id']])));
        usort($dest, static fn($a, $b) => $order[$a['id']] <=> $order[$b['id']]);
        $route['destinos'] = $dest;
        return $route;
    }

    /** @return list<array<string,mixed>> catálogo público de sellos/monedas coleccionables por territorio */
    public function collectibles(): array
    {
        return array_map(static fn($t) => [
            'territorio' => ['slug' => $t['slug'], 'nombre' => $t['nombre']],
            'sello' => $t['sello'],
        ], array_values(array_filter($this->territories(), static fn($t) => $t['sello'] !== null)));
    }

    /** @return list<int> */
    public function routeDestinationIds(int $routeId): array
    {
        return array_map(static fn($r) => (int)$r['destino_id'], $this->db->all(
            'SELECT rd.destino_id FROM pa_ruta_destinos rd JOIN pa_destinos d ON d.id = rd.destino_id WHERE rd.ruta_id = ? AND ' . $this->vis('d'),
            [$routeId]
        ));
    }
}
