<?php
// Mapeo del adaptador hacia la Biblioteca Viva de Cultura Educa 360.
// COPIAR a config/ce360.php (fuera del control de versiones) y completar con el esquema REAL de CE360.
// No se conoce ese esquema: todos los valores <COMPLETAR> deben sustituirse tras inspeccionar el código y la BD de CE360.
// Usar un usuario MariaDB con privilegio SELECT únicamente sobre estas tablas.
return [
    'dsn' => 'mysql:host=<COMPLETAR>;dbname=<COMPLETAR>;charset=utf8mb4',
    'usuario' => '<COMPLETAR_usuario_solo_lectura>',
    'clave_env' => 'PA_CE360_DB_PASS', // la contraseña se lee de esta variable de entorno, nunca de este archivo
    'lecturas' => [
        'tabla' => '<COMPLETAR>',
        'id' => '<COMPLETAR>',
        'id_tipo' => 'entero', // 'entero' si la clave primaria es numérica; 'texto' en otro caso
        'titulo' => '<COMPLETAR>',
        'autor' => null,      // columna o null si no existe
        'fuente' => null,
        'licencia' => null,
        'idioma' => null,
        'cuerpo' => null,     // si la lectura no tiene tabla de capítulos, columna con el texto completo
        'filtro_publicado' => null, // ['columna' => '<COMPLETAR>', 'valor' => '<COMPLETAR>'] o null
    ],
    'capitulos' => null, /* o bien:
    'capitulos' => [
        'tabla' => '<COMPLETAR>', 'fk' => '<COMPLETAR>', 'orden' => '<COMPLETAR>', 'titulo' => '<COMPLETAR>', 'cuerpo' => '<COMPLETAR>',
    ], */
];
