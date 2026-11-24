<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;

/**
 * Validación y re-codificación de imágenes subidas.
 * - Tipo real por contenido (finfo + getimagesize), no por extensión.
 * - Re-codifica con GD: elimina EXIF/GPS y cualquier carga útil incrustada.
 */
final class Images
{
    private const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    /** @return array{0:\GdImage,1:int,2:int} */
    public static function load(string $path, int $maxBytes): array
    {
        $size = @filesize($path);
        if ($size === false || $size === 0) {
            throw new ApiError(422, 'ARCHIVO_VACIO', 'No se recibió ninguna imagen.');
        }
        if ($size > $maxBytes) {
            throw new ApiError(413, 'ARCHIVO_GRANDE', 'La imagen supera el tamaño máximo permitido (' . intdiv($maxBytes, 1048576) . ' MB).');
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($path);
        $info = @getimagesize($path);
        if (!in_array($mime, self::MIMES, true) || $info === false || !in_array($info['mime'], self::MIMES, true)) {
            throw new ApiError(415, 'TIPO_NO_PERMITIDO', 'Solo se aceptan imágenes JPG, PNG o WEBP.');
        }
        [$w, $h] = $info;
        if ($w < 32 || $h < 32 || $w > 9000 || $h > 9000 || $w * $h > 40_000_000) {
            throw new ApiError(422, 'DIMENSIONES_INVALIDAS', 'Dimensiones de imagen no admitidas.');
        }
        $img = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
        };
        if (!$img instanceof \GdImage) {
            throw new ApiError(422, 'IMAGEN_CORRUPTA', 'No se pudo leer la imagen.');
        }
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($path);
            $o = is_array($exif) ? (int)($exif['Orientation'] ?? 1) : 1;
            $img = match ($o) { 3 => imagerotate($img, 180, 0), 6 => imagerotate($img, -90, 0), 8 => imagerotate($img, 90, 0), default => $img };
        }
        return [$img, imagesx($img), imagesy($img)];
    }

    public static function resizeTo(\GdImage $src, int $maxEdge, string $dest, bool $square = false): array
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $sx = 0; $sy = 0; $sw = $w; $sh = $h;
        if ($square) {
            $side = min($w, $h);
            $sx = intdiv($w - $side, 2); $sy = intdiv($h - $side, 2); $sw = $sh = $side;
        }
        $scale = min(1.0, $maxEdge / max($sw, $sh));
        $nw = max(1, (int)round($sw * $scale));
        $nh = max(1, (int)round($sh * $scale));
        $dst = imagecreatetruecolor($nw, $nh);
        $white = imagecolorallocate($dst, 255, 255, 255);
        imagefill($dst, 0, 0, $white);
        imagecopyresampled($dst, $src, 0, 0, $sx, $sy, $nw, $nh, $sw, $sh);
        imagejpeg($dst, $dest, 85);
        return [$nw, $nh];
    }
}
