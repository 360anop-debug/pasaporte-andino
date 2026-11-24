#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Migraciones versionadas y reversibles del módulo turístico.
 * Uso: php bin/migrate.php status|up|down [--to=001]
 * Registra lo aplicado en pa_migraciones. Antes de ejecutar en producción: BACKUP (ver docs/DEPLOY_PRODUCCION.md).
 */
require dirname(__DIR__) . '/vendor/autoload.php';

use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;

$cmd = $argv[1] ?? 'status';
$to = null;
foreach ($argv as $a) {
    if (str_starts_with($a, '--to=')) {
        $to = substr($a, 5);
    }
}
$db = new Db(Config::load());
$pdo = $db->pdo();
$pdo->exec('CREATE TABLE IF NOT EXISTS pa_migraciones (version VARCHAR(10) PRIMARY KEY, nombre VARCHAR(120) NOT NULL, aplicada_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
$dir = dirname(__DIR__) . '/migrations';
$files = glob($dir . '/*.up.sql') ?: [];
sort($files);
$all = [];
foreach ($files as $f) {
    $base = basename($f, '.up.sql');
    $all[substr($base, 0, 3)] = $base;
}
$applied = array_column($db->all('SELECT version FROM pa_migraciones ORDER BY version'), 'version');

$run = static function (string $file) use ($pdo): void {
    $sql = (string)file_get_contents($file);
    $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? '';
    foreach (array_filter(array_map('trim', explode(";\n", $sql))) as $stmt) {
        $pdo->exec($stmt);
    }
};

switch ($cmd) {
    case 'status':
        foreach ($all as $v => $name) {
            printf("%s  %s  %s\n", in_array($v, $applied, true) ? '[x]' : '[ ]', $v, $name);
        }
        break;
    case 'up':
        foreach ($all as $v => $name) {
            if (in_array($v, $applied, true)) {
                continue;
            }
            if ($to !== null && $v > $to) {
                break;
            }
            echo "↑ $name\n";
            // DDL en MariaDB hace commit implícito: cada migración se registra tras ejecutarse completa.
            $run("$dir/$name.up.sql");
            $db->exec('INSERT INTO pa_migraciones (version, nombre) VALUES (?, ?)', [$v, $name]);
        }
        echo "OK\n";
        break;
    case 'down':
        $target = $to ?? '000';
        foreach (array_reverse($applied) as $v) {
            if ($v <= $target) {
                break;
            }
            $name = $all[$v];
            echo "↓ $name\n";
            $run("$dir/$name.down.sql");
            $db->exec('DELETE FROM pa_migraciones WHERE version = ?', [$v]);
            if ($to === null) {
                break; // sin --to revierte solo la última
            }
        }
        echo "OK\n";
        break;
    default:
        fwrite(STDERR, "Uso: migrate.php status|up|down [--to=NNN]\n");
        exit(2);
}
