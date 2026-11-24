# Variables de entorno de prueba local (sin secretos reales)
export PA_ENV=test PA_DB_DSN="mysql:host=127.0.0.1;dbname=pa_test;charset=utf8mb4" PA_DB_USER=pa_app PA_DB_PASS=pa_local_dev
export PA_SECRET=test-secret-0123456789-abcdefghijklmnop PA_SHOW_DEMO=1 PA_COOKIE_SECURE=0 PA_MIN_READING_SECONDS=0
