# Entorno local de staging/QA (sin secretos reales)
export PA_ENV=staging PA_DB_DSN="mysql:host=127.0.0.1;dbname=pa_staging;charset=utf8mb4" PA_DB_USER=pa_app PA_DB_PASS=pa_local_dev
export PA_SECRET=staging-secret-not-for-production-0123456789 PA_SHOW_DEMO=1 PA_COOKIE_SECURE=0 PA_MIN_READING_SECONDS=5
export PA_CORS_ORIGINS="http://127.0.0.1:8080,https://localhost,http://localhost,capacitor://localhost,app://pasaporte"
export PA_PUBLIC_BASE_URL=http://127.0.0.1:8080/pasaporte PA_STORAGE_DIR=/tmp/pa-staging-storage
