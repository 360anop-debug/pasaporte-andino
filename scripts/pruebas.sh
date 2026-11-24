#!/usr/bin/env bash
# Ejecuta la batería local: PHPUnit (MariaDB), unitarias web, E2E web y capturas multi-dispositivo.
# Requisitos: MariaDB local con BD pa_test y pa_staging (ver docs/DATOS_Y_MIGRACIONES.md), PHP >= 8.3 (CI: 8.4), Node 22, Playwright.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
( cd backend-integration && . ./.env.test.sh && composer install -q && vendor/bin/phpunit )
( cd web-tourism && npm ci && npm test && npx vite build --mode staging )
set -a; . scripts/staging.env.sh; set +a
( cd backend-integration && php bin/migrate.php up && php bin/seed.php base && php bin/seed.php demo )
php -S 127.0.0.1:8080 scripts/staging-router.php >/tmp/pa-staging.log 2>&1 & SRV=$!; trap 'kill $SRV' EXIT; sleep 1
node qa/e2e/web.cjs http://127.0.0.1:8080/pasaporte/ qa/capturas/web-e2e 393 852
node qa/scripts/capturas.mjs http://127.0.0.1:8080/pasaporte/ qa/capturas/web 360x800 393x852 412x915 768x1024 1366x768 1920x1080
