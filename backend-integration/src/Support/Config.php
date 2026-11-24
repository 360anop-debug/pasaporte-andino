<?php
declare(strict_types=1);

namespace PasaporteAndino\Support;

/**
 * Configuración por variables de entorno. Nunca contiene secretos en el código.
 * En producción los valores se definen en el entorno del servidor (o en un archivo
 * config/local.php FUERA del control de versiones y fuera de los paquetes distribuidos).
 */
final class Config
{
    /** @param array<string,string> $values */
    private function __construct(private readonly array $values) {}

    /** @param array<string,string> $overrides */
    public static function load(array $overrides = []): self
    {
        $keys = [
            'PA_ENV' => 'production',
            'PA_DB_DSN' => '',
            'PA_DB_USER' => '',
            'PA_DB_PASS' => '',
            'PA_SECRET' => '',
            'PA_CORS_ORIGINS' => 'https://region.aprep.net,https://localhost,capacitor://localhost,app://pasaporte',
            'PA_STORAGE_DIR' => '',
            'PA_PUBLIC_BASE_URL' => 'https://region.aprep.net/pasaporte',
            'PA_SHOW_DEMO' => '0',
            'PA_LIBRARY_CE360' => '0',
            'PA_SESSION_DAYS' => '30',
            'PA_MIN_READING_SECONDS' => '30',
            'PA_UPLOAD_MAX_BYTES' => '8388608',
            'PA_COOKIE_SECURE' => '1',
            'PA_TRUST_PROXY' => '0',
        ];
        $local = [];
        $localFile = dirname(__DIR__, 2) . '/config/local.php';
        if (is_file($localFile)) {
            /** @var array<string,string> $local */
            $local = require $localFile;
        }
        $values = [];
        foreach ($keys as $k => $default) {
            $env = getenv($k);
            $values[$k] = (string)($overrides[$k] ?? ($env !== false ? $env : ($local[$k] ?? $default)));
        }
        $cfg = new self($values);
        if ($cfg->isProduction()) {
            if (strlen($values['PA_SECRET']) < 32) {
                throw new \RuntimeException('PA_SECRET debe tener al menos 32 caracteres en producción.');
            }
            if ($values['PA_SHOW_DEMO'] === '1') {
                throw new \RuntimeException('PA_SHOW_DEMO no puede activarse en producción.');
            }
        }
        return $cfg;
    }

    public function get(string $key): string
    {
        return $this->values[$key] ?? '';
    }

    public function int(string $key): int
    {
        return (int)$this->get($key);
    }

    public function bool(string $key): bool
    {
        return $this->get($key) === '1';
    }

    public function isProduction(): bool
    {
        return $this->get('PA_ENV') === 'production';
    }

    public function showDemo(): bool
    {
        return !$this->isProduction() && $this->bool('PA_SHOW_DEMO');
    }

    /** @return list<string> */
    public function corsOrigins(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $this->get('PA_CORS_ORIGINS')))));
    }

    public function storageDir(): string
    {
        $dir = $this->get('PA_STORAGE_DIR');
        if ($dir === '') {
            $dir = dirname(__DIR__, 2) . '/storage';
        }
        return rtrim($dir, '/');
    }
}
