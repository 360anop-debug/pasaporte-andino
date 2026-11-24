<?php
declare(strict_types=1);

namespace PasaporteAndino\Library;

use PasaporteAndino\Support\Db;

/** Lecturas propias del módulo (tabla pa_lecturas). */
final class LocalLibraryAdapter implements LibraryAdapter
{
    public function __construct(private readonly Db $db, private readonly bool $showDemo) {}

    public function name(): string
    {
        return 'local';
    }

    public function available(): bool
    {
        return true;
    }

    public function find(string $id): ?array
    {
        if (!ctype_digit($id)) {
            return null;
        }
        $row = $this->db->one(
            'SELECT id, titulo, autor, fuente, licencia, idioma, es_demo FROM pa_lecturas WHERE id = ? AND estado = \'publicado\' AND (es_demo = 0 OR ?)',
            [(int)$id, $this->showDemo ? 1 : 0]
        );
        if ($row === null) {
            return null;
        }
        $row['es_demo'] = (bool)$row['es_demo'];
        $row['capitulos'] = $this->db->all('SELECT orden, titulo, cuerpo FROM pa_lectura_capitulos WHERE lectura_id = ? ORDER BY orden', [(int)$id]);
        return $row;
    }
}
