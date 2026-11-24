<?php
declare(strict_types=1);

namespace PasaporteAndino\Http;

final class Request
{
    /**
     * @param array<string,string> $query
     * @param array<string,string> $headers  claves en minúsculas
     * @param array<string,string> $cookies
     * @param array<string,mixed> $files
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query = [],
        public readonly array $headers = [],
        public readonly string $body = '',
        public readonly array $cookies = [],
        public readonly array $files = [],
        public readonly string $ip = '0.0.0.0',
        /** @var array<string,string> */
        public readonly array $form = [],
    ) {}

    public static function fromGlobals(string $basePath, bool $trustProxy): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string)$v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string)$_SERVER['CONTENT_TYPE'];
        }
        $uri = (string)parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
        if ($basePath !== '' && str_starts_with($uri, $basePath)) {
            $uri = substr($uri, strlen($basePath));
        }
        $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
        if ($trustProxy && isset($headers['x-forwarded-for'])) {
            $ip = trim(explode(',', $headers['x-forwarded-for'])[0]);
        }
        /** @var array<string,string> $query */
        $query = array_map(static fn($v) => is_string($v) ? $v : '', $_GET);
        /** @var array<string,string> $form */
        $form = array_map(static fn($v) => is_string($v) ? $v : '', $_POST);
        return new self(
            strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            '/' . trim($uri, '/'),
            $query,
            $headers,
            (string)file_get_contents('php://input'),
            array_map('strval', $_COOKIE),
            $_FILES,
            $ip,
            $form,
        );
    }

    public function header(string $name): string
    {
        return $this->headers[strtolower($name)] ?? '';
    }

    /** @return array<string,mixed> */
    public function json(): array
    {
        if ($this->body === '') {
            return [];
        }
        try {
            $data = json_decode($this->body, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new ApiError(400, 'JSON_INVALIDO', 'El cuerpo de la petición no es JSON válido.');
        }
        if (!is_array($data)) {
            throw new ApiError(400, 'JSON_INVALIDO', 'Se esperaba un objeto JSON.');
        }
        return $data;
    }

    public function q(string $key, string $default = ''): string
    {
        return $this->query[$key] ?? $default;
    }

    public function lang(): string
    {
        $l = $this->query['lang'] ?? substr($this->header('accept-language'), 0, 2);
        return $l === 'en' ? 'en' : 'es';
    }
}
