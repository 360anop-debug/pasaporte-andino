<?php
declare(strict_types=1);

namespace PasaporteAndino\Support;

final class Ids
{
    private const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    public static function token(int $bytes = 32): string
    {
        return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
    }

    /** Código de pasaporte no predecible: PA-XXXX-XXXX (40 bits aleatorios, alfabeto Crockford). */
    public static function passportCode(): string
    {
        $out = '';
        for ($i = 0; $i < 8; $i++) {
            $out .= self::CROCKFORD[random_int(0, 31)];
        }
        return 'PA-' . substr($out, 0, 4) . '-' . substr($out, 4, 4);
    }

    public static function b64url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
