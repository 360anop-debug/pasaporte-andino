#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * Herramientas administrativas (ejecutar en servidor, nunca expuestas por web):
 *   crear-admin <email> <rol: admin|editor|curador>   (pide contraseña por STDIN)
 *   codigo-checkin <destino_slug> [dias=365] [usos_max=10000]
 *   listar-destinos
 */
require dirname(__DIR__) . '/vendor/autoload.php';

use PasaporteAndino\App;
use PasaporteAndino\Support\Config;

$app = new App(Config::load());
$db = $app->db;
$cmd = $argv[1] ?? '';
switch ($cmd) {
    case 'crear-admin':
        [$email, $rol] = [$argv[2] ?? '', $argv[3] ?? 'editor'];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($rol, ['admin', 'editor', 'curador'], true)) {
            fwrite(STDERR, "Email o rol inválido\n");
            exit(2);
        }
        fwrite(STDOUT, 'Contraseña (mín. 12): ');
        $pass = trim((string)fgets(STDIN));
        if (strlen($pass) < 12) {
            fwrite(STDERR, "Contraseña demasiado corta\n");
            exit(2);
        }
        $db->exec('INSERT INTO pa_usuarios (email, password_hash, rol, es_invitado) VALUES (?,?,?,0)', [strtolower($email), password_hash($pass, PASSWORD_DEFAULT), $rol]);
        \PasaporteAndino\Service\Audit::log($db, null, 'usuario.crear_admin', 'usuario', (string)$db->lastId(), ['rol' => $rol]);
        echo "Usuario $rol creado\n";
        break;
    case 'codigo-checkin':
        $id = $db->scalar('SELECT id FROM pa_destinos WHERE slug = ?', [$argv[2] ?? '']);
        if ($id === null) {
            fwrite(STDERR, "Destino no encontrado\n");
            exit(2);
        }
        $code = $app->checkin->issue((int)$id, (int)($argv[3] ?? 365), (int)($argv[4] ?? 10000), null);
        echo $code, "\n", rtrim($app->config->get('PA_PUBLIC_BASE_URL'), '/'), '/#/checkin/', rawurlencode($code), "\n";
        break;
    case 'listar-destinos':
        foreach ($db->all('SELECT d.id, d.slug, d.estado, d.es_demo, t.slug AS territorio FROM pa_destinos d JOIN pa_territorios t ON t.id = d.territorio_id ORDER BY t.orden, d.orden') as $r) {
            printf("%4d  %-32s %-14s %s%s\n", $r['id'], $r['slug'], $r['territorio'], $r['estado'], $r['es_demo'] ? ' [DEMO]' : '');
        }
        break;
    default:
        fwrite(STDERR, "Comandos: crear-admin | codigo-checkin | listar-destinos\n");
        exit(2);
}
