<?php
// Router para `php -S` que replica la estructura de producción en staging/QA:
//   /pasaporte/api/*  → backend-integration/public/index.php
//   /pasaporte/*      → web-tourism/dist (estático)
// Uso: PA_WEB_DIST=... php -S 127.0.0.1:8080 scripts/staging-router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if (str_starts_with($uri, '/pasaporte/api/')) {
    require __DIR__ . '/../backend-integration/public/index.php';
    return true;
}
if ($uri === '/' || $uri === '/pasaporte') { header('Location: /pasaporte/'); return true; }
if (str_starts_with($uri, '/pasaporte/')) {
    $dist = getenv('PA_WEB_DIST') ?: __DIR__ . '/../web-tourism/dist';
    $rel = substr($uri, strlen('/pasaporte/')) ?: 'index.html';
    $file = realpath($dist . '/' . $rel);
    if ($file === false || !str_starts_with($file, realpath($dist)) || !is_file($file)) { http_response_code(404); echo 'No encontrado'; return true; }
    $types = ['html' => 'text/html; charset=utf-8', 'js' => 'text/javascript', 'css' => 'text/css', 'svg' => 'image/svg+xml', 'webp' => 'image/webp', 'png' => 'image/png', 'json' => 'application/json', 'webmanifest' => 'application/manifest+json', 'woff2' => 'font/woff2', 'woff' => 'font/woff', 'mp4' => 'video/mp4', 'm4a' => 'audio/mp4', 'jpg' => 'image/jpeg'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    header('Accept-Ranges: bytes');
    $size = filesize($file);
    if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
        $start = (int)$m[1]; $end = $m[2] !== '' ? (int)$m[2] : $size - 1;
        http_response_code(206); header("Content-Range: bytes $start-$end/$size"); header('Content-Length: ' . ($end - $start + 1));
        $fh = fopen($file, 'rb'); fseek($fh, $start); echo fread($fh, $end - $start + 1); return true;
    }
    header('Content-Length: ' . $size);
    readfile($file);
    return true;
}
http_response_code(404);
return true;
