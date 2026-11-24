#!/usr/bin/env bash
# Backend de staging local (laptop). Requisitos: PHP 8.4 con pdo_mysql, gd, fileinfo, mbstring, exif; MariaDB 10.6+; Composer.
# Antes: crear la BD y el usuario (una vez), como administrador de MariaDB:
#   CREATE DATABASE pa_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   CREATE USER 'pa_app'@'localhost' IDENTIFIED BY 'pa_local_dev';
#   GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,DROP,REFERENCES ON pa_staging.* TO 'pa_app'@'localhost';
# Si su MariaDB usa otros datos, copie scripts/staging.env.sh a scripts/staging.env.local y edítelo (no se versiona).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
ENVF=scripts/staging.env.local; [ -f "$ENVF" ] || ENVF=scripts/staging.env.sh
set -a; . "$ENVF"; set +a
# En Windows PA_STORAGE_DIR=/tmp/... no existe: usar una carpeta del proyecto
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) export PA_STORAGE_DIR="$ROOT/backend-integration/storage";; esac
( cd backend-integration && composer install --no-interaction --no-progress && php bin/migrate.php up && php bin/seed.php base && php bin/seed.php demo )
( cd web-tourism && npm ci && npx vite build --mode staging )
echo "Servidor en http://127.0.0.1:8080/pasaporte/ (Ctrl+C para detener)"
exec php -S 0.0.0.0:8080 scripts/staging-router.php
