<?php
declare(strict_types=1);

namespace PasaporteAndino\Library;

/**
 * Capa adaptadora sobre la Biblioteca Viva. No copia la biblioteca: solo lee por ID.
 * Una lectura devuelta: ['id','titulo','autor','fuente','licencia','idioma','capitulos'=>[['orden','titulo','cuerpo']]]
 */
interface LibraryAdapter
{
    public function name(): string;

    public function available(): bool;

    /** @return array<string,mixed>|null */
    public function find(string $id): ?array;
}
