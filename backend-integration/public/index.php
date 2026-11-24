<?php
declare(strict_types=1);

// Front controller del API turístico. Desplegar este directorio como /pasaporte/api
// (alias o subdirectorio independiente). No interfiere con el enrutado de Cultura Educa 360.
require dirname(__DIR__) . '/vendor/autoload.php';

use PasaporteAndino\App;
use PasaporteAndino\Http\Request;
use PasaporteAndino\Support\Config;

$config = Config::load();
$base = getenv('PA_BASE_PATH') !== false ? (string)getenv('PA_BASE_PATH') : '/pasaporte/api';
$app = new App($config);
$app->handle(Request::fromGlobals($base, $config->bool('PA_TRUST_PROXY')))->send();
