<?php
declare(strict_types=1);

namespace PasaporteAndino\Service;

use PasaporteAndino\Http\ApiError;
use PasaporteAndino\Support\Config;
use PasaporteAndino\Support\Db;
use PasaporteAndino\Support\Ids;

/**
 * Identidad del Pasaporte Andino. Minimización de datos:
 * - NO se solicita DNI ni documento nacional (sin base legal/finalidad que lo justifique).
 * - Datos: nombres, apellidos, nacionalidad (ISO-3166 alfa-2), idioma, foto opcional, declaración de minoría de edad.
 * - El QR contiene un token opaco aleatorio; no incluye PII.
 */
final class Passport
{
    public const CONSENT_VERSION = 'v1-2026-11';

    public function __construct(private readonly Db $db, private readonly Config $config) {}

    public function idFor(int $userId): ?int
    {
        $v = $this->db->scalar('SELECT id FROM pa_pasaportes WHERE usuario_id = ?', [$userId]);
        return $v === null ? null : (int)$v;
    }

    public function requireId(int $userId): int
    {
        $id = $this->idFor($userId);
        if ($id === null) {
            throw new ApiError(409, 'SIN_PASAPORTE', 'Primero crea tu Pasaporte Andino.');
        }
        return $id;
    }

    private static function cleanName(mixed $v, string $field): string
    {
        $s = trim(preg_replace('/\s+/u', ' ', is_string($v) ? $v : '') ?? '');
        if ($s === '' || mb_strlen($s) > 60 || !preg_match("/^[\\p{L}][\\p{L}\\p{M}' .\\-]*$/u", $s)) {
            throw new ApiError(422, 'DATO_INVALIDO', 'Revisa este campo: solo letras, espacios, apóstrofo o guion (máx. 60).', ['campo' => $field]);
        }
        return $s;
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function create(int $userId, array $in): array
    {
        if ($this->idFor($userId) !== null) {
            throw new ApiError(409, 'PASAPORTE_EXISTE', 'Ya tienes un Pasaporte Andino.');
        }
        if (($in['consentimiento'] ?? false) !== true) {
            throw new ApiError(422, 'CONSENTIMIENTO_REQUERIDO', 'Debes aceptar la política de privacidad.', ['campo' => 'consentimiento']);
        }
        $nombres = self::cleanName($in['nombres'] ?? null, 'nombres');
        $apellidos = self::cleanName($in['apellidos'] ?? null, 'apellidos');
        $nac = strtoupper(is_string($in['nacionalidad'] ?? null) ? $in['nacionalidad'] : '');
        if (!preg_match('/^[A-Z]{2}$/', $nac)) {
            throw new ApiError(422, 'DATO_INVALIDO', 'Selecciona una nacionalidad.', ['campo' => 'nacionalidad']);
        }
        $idioma = ($in['idioma'] ?? 'es') === 'en' ? 'en' : 'es';
        $menor = (bool)($in['menor_de_edad'] ?? false);
        if ($menor && ($in['consentimiento_tutor'] ?? false) !== true) {
            throw new ApiError(422, 'TUTOR_REQUERIDO', 'Para menores de edad se requiere la autorización de madre, padre o tutor.', ['campo' => 'consentimiento_tutor']);
        }
        for ($i = 0; $i < 5; $i++) {
            try {
                $this->db->exec(
                    'INSERT INTO pa_pasaportes (usuario_id, codigo, qr_token, nombres, apellidos, nacionalidad, idioma, menor_de_edad, consentimiento_version, consentimiento_at)
                     VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP())',
                    [$userId, Ids::passportCode(), Ids::token(24), $nombres, $apellidos, $nac, $idioma, $menor ? 1 : 0, self::CONSENT_VERSION]
                );
                return $this->get($userId);
            } catch (\PDOException $e) {
                if (!Db::isDuplicate($e)) {
                    throw $e;
                }
                if ($this->idFor($userId) !== null) {
                    throw new ApiError(409, 'PASAPORTE_EXISTE', 'Ya tienes un Pasaporte Andino.');
                }
            }
        }
        throw new \RuntimeException('No se pudo generar un código único de pasaporte.');
    }

    /** @param array<string,mixed> $in @return array<string,mixed> */
    public function update(int $userId, array $in): array
    {
        $pid = $this->requireId($userId);
        $sets = [];
        $p = [];
        if (array_key_exists('nombres', $in)) { $sets[] = 'nombres = ?'; $p[] = self::cleanName($in['nombres'], 'nombres'); }
        if (array_key_exists('apellidos', $in)) { $sets[] = 'apellidos = ?'; $p[] = self::cleanName($in['apellidos'], 'apellidos'); }
        if (array_key_exists('nacionalidad', $in)) {
            $nac = strtoupper((string)$in['nacionalidad']);
            if (!preg_match('/^[A-Z]{2}$/', $nac)) {
                throw new ApiError(422, 'DATO_INVALIDO', 'Selecciona una nacionalidad.', ['campo' => 'nacionalidad']);
            }
            $sets[] = 'nacionalidad = ?'; $p[] = $nac;
        }
        if (array_key_exists('idioma', $in)) { $sets[] = 'idioma = ?'; $p[] = $in['idioma'] === 'en' ? 'en' : 'es'; }
        if ($sets !== []) {
            $p[] = $pid;
            $this->db->exec('UPDATE pa_pasaportes SET ' . implode(', ', $sets) . ' WHERE id = ?', $p);
        }
        return $this->get($userId);
    }

    /** @return array<string,mixed> */
    public function get(int $userId): array
    {
        $r = $this->db->one(
            'SELECT p.*, u.es_invitado, u.email FROM pa_pasaportes p JOIN pa_usuarios u ON u.id = p.usuario_id WHERE p.usuario_id = ?',
            [$userId]
        );
        if ($r === null) {
            throw new ApiError(404, 'SIN_PASAPORTE', 'Aún no tienes Pasaporte Andino.');
        }
        $base = rtrim($this->config->get('PA_PUBLIC_BASE_URL'), '/');
        return [
            'codigo' => $r['codigo'],
            'nombres' => $r['nombres'],
            'apellidos' => $r['apellidos'],
            'nacionalidad' => $r['nacionalidad'],
            'idioma' => $r['idioma'],
            'menor_de_edad' => (bool)$r['menor_de_edad'],
            'tiene_foto' => $r['foto_archivo'] !== null,
            'qr_url' => $base . '/#/verificar/' . $r['qr_token'],
            'emitido_at' => $r['creado_at'],
            'cuenta' => ['invitado' => (bool)$r['es_invitado'], 'email' => $r['email']],
        ];
    }

    public function photoPath(int $userId): ?string
    {
        $f = $this->db->scalar('SELECT foto_archivo FROM pa_pasaportes WHERE usuario_id = ?', [$userId]);
        if (!is_string($f)) {
            return null;
        }
        $p = $this->config->storageDir() . '/perfil/' . $f;
        return is_file($p) ? $p : null;
    }

    public function setPhoto(int $userId, string $tmpPath, bool $tutorConsent): void
    {
        $row = $this->db->one('SELECT id, foto_archivo, menor_de_edad FROM pa_pasaportes WHERE usuario_id = ?', [$userId]);
        if ($row === null) {
            throw new ApiError(409, 'SIN_PASAPORTE', 'Primero crea tu Pasaporte Andino.');
        }
        if ((bool)$row['menor_de_edad'] && !$tutorConsent) {
            throw new ApiError(422, 'TUTOR_REQUERIDO', 'La foto de una persona menor requiere autorización del tutor.');
        }
        [$img] = Images::load($tmpPath, $this->config->int('PA_UPLOAD_MAX_BYTES'));
        $dir = $this->config->storageDir() . '/perfil';
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        $name = Ids::token(18) . '.jpg';
        Images::resizeTo($img, 640, $dir . '/' . $name, true);
        $this->db->exec('UPDATE pa_pasaportes SET foto_archivo = ? WHERE id = ?', [$name, $row['id']]);
        if (is_string($row['foto_archivo'])) {
            @unlink($dir . '/' . $row['foto_archivo']);
        }
    }

    public function deletePhoto(int $userId): void
    {
        $f = $this->db->scalar('SELECT foto_archivo FROM pa_pasaportes WHERE usuario_id = ?', [$userId]);
        if (is_string($f)) {
            @unlink($this->config->storageDir() . '/perfil/' . $f);
        }
        $this->db->exec('UPDATE pa_pasaportes SET foto_archivo = NULL WHERE usuario_id = ?', [$userId]);
    }

    /** Verificación pública del QR: solo validez y código; ninguna PII. @return array<string,mixed> */
    public function verify(string $token): array
    {
        if (strlen($token) > 48) {
            return ['valido' => false];
        }
        $r = $this->db->one(
            'SELECT p.codigo, p.creado_at FROM pa_pasaportes p JOIN pa_usuarios u ON u.id = p.usuario_id WHERE p.qr_token = ? AND u.eliminado_at IS NULL',
            [$token]
        );
        return $r === null ? ['valido' => false] : ['valido' => true, 'codigo' => $r['codigo'], 'desde' => substr((string)$r['creado_at'], 0, 7)];
    }

    /** Eliminación de cuenta: anonimiza identidad, borra archivos y revoca sesiones. Los eventos quedan anonimizados para integridad contable. */
    public function deleteAccount(int $userId): void
    {
        $this->db->tx(function () use ($userId): void {
            $pid = $this->idFor($userId);
            if ($pid !== null) {
                $this->deletePhoto($userId);
                foreach ($this->db->all('SELECT archivo, miniatura FROM pa_album_fotos WHERE pasaporte_id = ? AND eliminado_at IS NULL', [$pid]) as $f) {
                    @unlink($this->config->storageDir() . '/album/' . $f['archivo']);
                    @unlink($this->config->storageDir() . '/album/' . $f['miniatura']);
                }
                $this->db->exec('UPDATE pa_album_fotos SET eliminado_at = UTC_TIMESTAMP() WHERE pasaporte_id = ?', [$pid]);
                $this->db->exec("UPDATE pa_pasaportes SET nombres = '-', apellidos = '-', nacionalidad = 'XX', qr_token = ? WHERE id = ?", ['x' . Ids::token(24), $pid]);
            }
            $this->db->exec('UPDATE pa_usuarios SET email = NULL, password_hash = NULL, eliminado_at = UTC_TIMESTAMP() WHERE id = ?', [$userId]);
            $this->db->exec('UPDATE pa_sesiones SET revocado_at = UTC_TIMESTAMP() WHERE usuario_id = ? AND revocado_at IS NULL', [$userId]);
            Audit::log($this->db, $userId, 'cuenta.eliminar', 'usuario', (string)$userId);
        });
    }
}
