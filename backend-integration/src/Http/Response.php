<?php
declare(strict_types=1);

namespace PasaporteAndino\Http;

final class Response
{
    /** @param array<string,string> $headers @param list<string> $cookies */
    public function __construct(
        public int $status = 200,
        public string $body = '',
        public array $headers = [],
        public array $cookies = [],
        public ?string $filePath = null,
    ) {}

    public static function json(mixed $data, int $status = 200): self
    {
        return new self($status, (string)json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), [
            'Content-Type' => 'application/json; charset=utf-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    public static function file(string $path, string $mime, bool $private = true): self
    {
        return new self(200, '', [
            'Content-Type' => $mime,
            'Cache-Control' => $private ? 'private, max-age=300' : 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'inline',
        ], [], $path);
    }

    public static function html(string $html, int $status = 200): self
    {
        return new self($status, $html, ['Content-Type' => 'text/html; charset=utf-8', 'Cache-Control' => 'public, max-age=600']);
    }

    /** @return array<string,mixed> */
    public function data(): array
    {
        $d = json_decode($this->body, true);
        return is_array($d) ? $d : [];
    }

    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $k => $v) {
            header($k . ': ' . $v);
        }
        foreach ($this->cookies as $c) {
            header('Set-Cookie: ' . $c, false);
        }
        if ($this->filePath !== null) {
            header('Content-Length: ' . (string)filesize($this->filePath));
            readfile($this->filePath);
            return;
        }
        echo $this->body;
    }
}
