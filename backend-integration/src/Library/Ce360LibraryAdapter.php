<?php
declare(strict_types=1);

namespace PasaporteAndino\Library;

/**
 * Adaptador hacia la Biblioteca Viva de Cultura Educa 360.
 *
 * ESTADO: BLOQUEADO. El código fuente y el esquema de CE360 (ce360_app/public_html) no fueron
 * entregados, por lo que NO se conocen las tablas, rutas ni servicios reales de la biblioteca.
 * Por mandato de la Orden Maestra no se inventan endpoints ni tablas.
 *
 * Para activarlo: implementar find() con consultas preparadas de SOLO LECTURA sobre las tablas reales
 * (usuario MariaDB con privilegio SELECT únicamente sobre ellas) y definir PA_LIBRARY_CE360=1.
 * Mientras tanto available() devuelve false y la API responde 503 BIBLIOTECA_CE360_NO_CONFIGURADA,
 * que la interfaz muestra como estado honesto "no disponible".
 */
final class Ce360LibraryAdapter implements LibraryAdapter
{
    public function __construct(private readonly bool $enabled) {}

    public function name(): string
    {
        return 'ce360';
    }

    public function available(): bool
    {
        return false; // Se volverá $this->enabled cuando exista la implementación real auditada.
    }

    public function find(string $id): ?array
    {
        return null;
    }

    public function configured(): bool
    {
        return $this->enabled;
    }
}
