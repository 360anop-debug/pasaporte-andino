<?php
declare(strict_types=1);

namespace PasaporteAndino\Http;

final class Router
{
    /** @var list<array{string,string,callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $regex = '#^' . preg_replace('#\{([a-z_]+)\}#', '(?P<$1>[A-Za-z0-9_\-\.]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler];
    }

    public function dispatch(Request $req): Response
    {
        $allowed = [];
        foreach ($this->routes as [$method, $regex, $handler]) {
            if (preg_match($regex, $req->path, $m)) {
                if ($method !== $req->method) {
                    $allowed[] = $method;
                    continue;
                }
                $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
                return $handler($req, $params);
            }
        }
        if ($allowed !== []) {
            throw new ApiError(405, 'METODO_NO_PERMITIDO', 'Método no permitido.', ['permitidos' => $allowed]);
        }
        throw new ApiError(404, 'NO_ENCONTRADO', 'Ruta no encontrada.');
    }
}
