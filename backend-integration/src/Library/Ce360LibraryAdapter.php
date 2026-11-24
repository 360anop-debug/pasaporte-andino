<?php
declare(strict_types=1);

namespace PasaporteAndino\Library;

use PDO;

/**
 * Adaptador de SOLO LECTURA hacia la Biblioteca Viva de Cultura Educa 360.
 *
 * ESTADO: BLOQUEADO hasta recibir el código/esquema real de CE360. No se inventan tablas ni endpoints:
 * el esquema se declara por configuración (config/ce360.php, a partir de config/ce360.example.php) y se valida con
 * `php bin/ce360-verificar.php` antes de activarlo con PA_LIBRARY_CE360=1.
 *
 * Seguridad: los identificadores de tabla/columna solo se aceptan si cumplen [A-Za-z0-9_]{1,64} y se citan con
 * acentos graves; los valores van siempre en consultas preparadas; solo se ejecutan SELECT.
 */
final class Ce360LibraryAdapter implements LibraryAdapter
{
    private ?PDO $pdo = null;

    /** @param array<string,mixed>|null $map */
    public function __construct(private readonly bool $enabled, private readonly ?array $map = null, ?PDO $pdo = null)
    {
        $this->pdo = $pdo;
    }

    /** Carga el mapeo desde config/ce360.php si existe. @return array<string,mixed>|null */
    public static function loadMap(string $configDir): ?array
    {
        $f = rtrim($configDir, '/') . '/ce360.php';
        if (!is_file($f)) {
            return null;
        }
        $m = require $f;
        return is_array($m) ? $m : null;
    }

    public function name(): string
    {
        return 'ce360';
    }

    public function configured(): bool
    {
        return $this->map !== null && self::validMap($this->map) === [];
    }

    public function available(): bool
    {
        return $this->enabled && $this->configured();
    }

    /** @param array<string,mixed> $m @return list<string> errores de validación del mapeo */
    public static function validMap(array $m): array
    {
        $err = [];
        $l = $m['lecturas'] ?? null;
        if (!is_array($l)) {
            return ['falta la sección lecturas'];
        }
        foreach (['tabla', 'id', 'titulo'] as $k) {
            if (!self::ident($l[$k] ?? null)) {
                $err[] = "lecturas.$k no es un identificador válido";
            }
        }
        foreach (['autor', 'fuente', 'licencia', 'idioma', 'cuerpo'] as $k) {
            if (($l[$k] ?? null) !== null && !self::ident($l[$k])) {
                $err[] = "lecturas.$k no es un identificador válido";
            }
        }
        $fp = $l['filtro_publicado'] ?? null;
        if ($fp !== null && (!is_array($fp) || !self::ident($fp['columna'] ?? null) || !is_scalar($fp['valor'] ?? null))) {
            $err[] = 'lecturas.filtro_publicado inválido';
        }
        $c = $m['capitulos'] ?? null;
        if ($c !== null) {
            foreach (['tabla', 'fk', 'orden', 'titulo', 'cuerpo'] as $k) {
                if (!self::ident($c[$k] ?? null)) {
                    $err[] = "capitulos.$k no es un identificador válido";
                }
            }
        } elseif (($l['cuerpo'] ?? null) === null) {
            $err[] = 'defina capitulos o lecturas.cuerpo';
        }
        return $err;
    }

    private static function ident(mixed $v): bool
    {
        return is_string($v) && preg_match('/^[A-Za-z0-9_]{1,64}$/', $v) === 1;
    }

    private static function q(string $ident): string
    {
        return '`' . $ident . '`';
    }

    private function pdo(): PDO
    {
        if ($this->pdo === null) {
            $m = $this->map ?? [];
            $pass = getenv((string)($m['clave_env'] ?? 'PA_CE360_DB_PASS'));
            $this->pdo = new PDO((string)$m['dsn'], (string)$m['usuario'], $pass === false ? '' : $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }
        return $this->pdo;
    }

    public function find(string $id): ?array
    {
        // Formato de identificador estricto: evita coerciones implícitas (p. ej. '7abc' = 7 en columnas numéricas).
        if (!$this->available() || preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id) !== 1) {
            return null;
        }
        $l = $this->map['lecturas'];
        if (($l['id_tipo'] ?? 'texto') === 'entero' && !ctype_digit($id)) {
            return null;
        }
        $cols = ['id' => $l['id'], 'titulo' => $l['titulo']];
        foreach (['autor', 'fuente', 'licencia', 'idioma', 'cuerpo'] as $k) {
            if (($l[$k] ?? null) !== null) {
                $cols[$k] = $l[$k];
            }
        }
        $select = implode(', ', array_map(static fn($alias, $col) => self::q($col) . ' AS ' . self::q($alias), array_keys($cols), $cols));
        $sql = 'SELECT ' . $select . ' FROM ' . self::q($l['tabla']) . ' WHERE ' . self::q($l['id']) . ' = ?';
        $params = [$id];
        if (($fp = $l['filtro_publicado'] ?? null) !== null) {
            $sql .= ' AND ' . self::q($fp['columna']) . ' = ?';
            $params[] = $fp['valor'];
        }
        $st = $this->pdo()->prepare($sql . ' LIMIT 1');
        $st->execute($params);
        $row = $st->fetch();
        if ($row === false) {
            return null;
        }
        $c = $this->map['capitulos'] ?? null;
        if ($c !== null) {
            $st = $this->pdo()->prepare(
                'SELECT ' . self::q($c['orden']) . ' AS `orden`, ' . self::q($c['titulo']) . ' AS `titulo`, ' . self::q($c['cuerpo']) . ' AS `cuerpo` FROM '
                . self::q($c['tabla']) . ' WHERE ' . self::q($c['fk']) . ' = ? ORDER BY ' . self::q($c['orden'])
            );
            $st->execute([$id]);
            $chapters = $st->fetchAll();
        } else {
            $chapters = [['orden' => 1, 'titulo' => (string)$row['titulo'], 'cuerpo' => (string)($row['cuerpo'] ?? '')]];
        }
        unset($row['cuerpo']);
        return $row + [
            'autor' => $row['autor'] ?? null, 'fuente' => $row['fuente'] ?? null, 'licencia' => $row['licencia'] ?? null,
            'idioma' => $row['idioma'] ?? 'es', 'es_demo' => false, 'capitulos' => $chapters,
        ];
    }

    /**
     * Verificación previa a la activación: comprueba en INFORMATION_SCHEMA que existen tablas y columnas mapeadas.
     * @return list<string> problemas encontrados (vacío = listo)
     */
    public function verify(): array
    {
        if ($this->map === null) {
            return ['no existe config/ce360.php'];
        }
        $err = self::validMap($this->map);
        if ($err !== []) {
            return $err;
        }
        $need = [];
        $l = $this->map['lecturas'];
        foreach (['id', 'titulo', 'autor', 'fuente', 'licencia', 'idioma', 'cuerpo'] as $k) {
            if (($l[$k] ?? null) !== null) { $need[$l['tabla']][] = $l[$k]; }
        }
        if (($fp = $l['filtro_publicado'] ?? null) !== null) { $need[$l['tabla']][] = $fp['columna']; }
        if (($c = $this->map['capitulos'] ?? null) !== null) {
            foreach (['fk', 'orden', 'titulo', 'cuerpo'] as $k) { $need[$c['tabla']][] = $c[$k]; }
        }
        $out = [];
        foreach ($need as $table => $columns) {
            $st = $this->pdo()->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
            $st->execute([$table]);
            $have = array_column($st->fetchAll(), 'COLUMN_NAME');
            if ($have === []) { $out[] = "no existe la tabla $table"; continue; }
            foreach (array_unique($columns) as $col) {
                if (!in_array($col, $have, true)) { $out[] = "no existe la columna $table.$col"; }
            }
        }
        return $out;
    }
}
