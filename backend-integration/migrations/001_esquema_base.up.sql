-- Pasaporte Andino · Migración 001 · Esquema base aditivo.
-- Todas las tablas usan prefijo pa_ para no colisionar con tablas existentes de Cultura Educa 360.
-- No modifica ni referencia tablas ajenas.

CREATE TABLE pa_territorios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  nombre_es VARCHAR(120) NOT NULL,
  nombre_en VARCHAR(120) NOT NULL,
  tipo ENUM('provincia','distrito') NOT NULL,
  padre_id INT UNSIGNED NULL,
  resumen_es TEXT NULL,
  resumen_en TEXT NULL,
  imagen VARCHAR(255) NULL,
  imagen_es_ilustracion TINYINT(1) NOT NULL DEFAULT 1,
  lat DECIMAL(9,6) NULL,
  lng DECIMAL(9,6) NULL,
  ubicacion_validada TINYINT(1) NOT NULL DEFAULT 0,
  fuente VARCHAR(255) NULL,
  estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
  es_demo TINYINT(1) NOT NULL DEFAULT 0,
  orden SMALLINT NOT NULL DEFAULT 0,
  actualizado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pa_territorios_slug (slug),
  KEY ix_pa_territorios_estado (estado, es_demo, orden),
  CONSTRAINT fk_pa_territorios_padre FOREIGN KEY (padre_id) REFERENCES pa_territorios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_destinos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  territorio_id INT UNSIGNED NOT NULL,
  slug VARCHAR(100) NOT NULL,
  nombre_es VARCHAR(160) NOT NULL,
  nombre_en VARCHAR(160) NOT NULL,
  categoria ENUM('historico','natural','bienestar','cultural','arqueologico','religioso','mirador') NOT NULL,
  etiquetas VARCHAR(255) NULL,
  resumen_es TEXT NULL,
  resumen_en TEXT NULL,
  imagen VARCHAR(255) NULL,
  imagen_es_ilustracion TINYINT(1) NOT NULL DEFAULT 1,
  lat DECIMAL(9,6) NULL,
  lng DECIMAL(9,6) NULL,
  ubicacion_validada TINYINT(1) NOT NULL DEFAULT 0,
  fuente VARCHAR(255) NULL,
  estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
  es_demo TINYINT(1) NOT NULL DEFAULT 0,
  orden SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_pa_destinos_slug (slug),
  KEY ix_pa_destinos_territorio (territorio_id, estado),
  CONSTRAINT fk_pa_destinos_territorio FOREIGN KEY (territorio_id) REFERENCES pa_territorios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Biblioteca local (solo se usa si el adaptador CE360 no está configurado o para material propio del módulo).
CREATE TABLE pa_lecturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(160) NULL,
  fuente VARCHAR(255) NULL,
  licencia VARCHAR(120) NULL,
  idioma CHAR(2) NOT NULL DEFAULT 'es',
  estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
  es_demo TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_lectura_capitulos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lectura_id INT UNSIGNED NOT NULL,
  orden SMALLINT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  cuerpo MEDIUMTEXT NOT NULL,
  UNIQUE KEY uq_pa_capitulo (lectura_id, orden),
  CONSTRAINT fk_pa_capitulo_lectura FOREIGN KEY (lectura_id) REFERENCES pa_lecturas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_contenidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  territorio_id INT UNSIGNED NULL,
  destino_id INT UNSIGNED NULL,
  tipo ENUM('historia','dato','linea_tiempo','personaje','video','audio','leyenda','referencia','galeria') NOT NULL,
  titulo_es VARCHAR(200) NOT NULL,
  titulo_en VARCHAR(200) NOT NULL,
  cuerpo_es TEXT NULL,
  cuerpo_en TEXT NULL,
  autor VARCHAR(160) NULL,
  fuente VARCHAR(255) NULL,
  licencia VARCHAR(120) NULL,
  credito VARCHAR(255) NULL,
  media_url VARCHAR(500) NULL,
  poster_url VARCHAR(500) NULL,
  subtitulos_url VARCHAR(500) NULL,
  duracion_seg INT UNSIGNED NULL,
  biblioteca_ref VARCHAR(80) NULL COMMENT 'local:<id> o ce360:<id>',
  es_ilustracion TINYINT(1) NOT NULL DEFAULT 0,
  estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
  es_demo TINYINT(1) NOT NULL DEFAULT 0,
  orden SMALLINT NOT NULL DEFAULT 0,
  KEY ix_pa_contenidos_territorio (territorio_id, tipo, estado),
  KEY ix_pa_contenidos_destino (destino_id, tipo, estado),
  CONSTRAINT fk_pa_contenidos_territorio FOREIGN KEY (territorio_id) REFERENCES pa_territorios(id),
  CONSTRAINT fk_pa_contenidos_destino FOREIGN KEY (destino_id) REFERENCES pa_destinos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_rutas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  tema ENUM('historica','natural','bienestar','cultural') NOT NULL,
  nombre_es VARCHAR(160) NOT NULL,
  nombre_en VARCHAR(160) NOT NULL,
  resumen_es TEXT NULL,
  resumen_en TEXT NULL,
  duracion_es VARCHAR(40) NULL,
  duracion_en VARCHAR(40) NULL,
  imagen VARCHAR(255) NULL,
  estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
  es_demo TINYINT(1) NOT NULL DEFAULT 0,
  orden SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_pa_rutas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_ruta_destinos (
  ruta_id INT UNSIGNED NOT NULL,
  destino_id INT UNSIGNED NOT NULL,
  orden SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (ruta_id, destino_id),
  CONSTRAINT fk_pa_rd_ruta FOREIGN KEY (ruta_id) REFERENCES pa_rutas(id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_rd_destino FOREIGN KEY (destino_id) REFERENCES pa_destinos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NULL,
  password_hash VARCHAR(255) NULL,
  rol ENUM('viajero','editor','curador','admin') NOT NULL DEFAULT 'viajero',
  es_invitado TINYINT(1) NOT NULL DEFAULT 1,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  eliminado_at DATETIME NULL,
  UNIQUE KEY uq_pa_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_sesiones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  cliente ENUM('web','android','windows') NOT NULL,
  expira_at DATETIME NOT NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revocado_at DATETIME NULL,
  UNIQUE KEY uq_pa_sesiones_token (token_hash),
  KEY ix_pa_sesiones_usuario (usuario_id),
  CONSTRAINT fk_pa_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES pa_usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_pasaportes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  codigo VARCHAR(16) NOT NULL,
  qr_token VARCHAR(48) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  nacionalidad CHAR(2) NOT NULL,
  foto_archivo VARCHAR(80) NULL,
  idioma CHAR(2) NOT NULL DEFAULT 'es',
  menor_de_edad TINYINT(1) NOT NULL DEFAULT 0,
  consentimiento_version VARCHAR(20) NOT NULL,
  consentimiento_at DATETIME NOT NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pa_pasaportes_usuario (usuario_id),
  UNIQUE KEY uq_pa_pasaportes_codigo (codigo),
  UNIQUE KEY uq_pa_pasaportes_qr (qr_token),
  CONSTRAINT fk_pa_pasaportes_usuario FOREIGN KEY (usuario_id) REFERENCES pa_usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos inmutables. Idempotencia por (pasaporte, idempotency_key); deduplicación de negocio por (pasaporte, dedupe_key).
CREATE TABLE pa_eventos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pasaporte_id INT UNSIGNED NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  ref_tipo VARCHAR(30) NULL,
  ref_id VARCHAR(80) NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  dedupe_key VARCHAR(160) NOT NULL,
  origen ENUM('cliente','checkin','admin','sistema') NOT NULL,
  payload JSON NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pa_eventos_idem (pasaporte_id, idempotency_key),
  UNIQUE KEY uq_pa_eventos_dedupe (pasaporte_id, dedupe_key),
  KEY ix_pa_eventos_tipo (pasaporte_id, tipo),
  CONSTRAINT fk_pa_eventos_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas configurables de monedas simbólicas (sin valor monetario).
CREATE TABLE pa_reglas (
  codigo VARCHAR(40) PRIMARY KEY,
  evento_tipo VARCHAR(40) NOT NULL,
  categoria ENUM('visitas','retos','cultura','actividades') NOT NULL,
  monedas INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  descripcion_es VARCHAR(255) NOT NULL,
  descripcion_en VARCHAR(255) NOT NULL,
  UNIQUE KEY uq_pa_reglas_evento (evento_tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Libro mayor inmutable: el saldo es SUM(cantidad). Las reversiones son filas negativas enlazadas.
CREATE TABLE pa_monedas_movimientos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pasaporte_id INT UNSIGNED NOT NULL,
  evento_id BIGINT UNSIGNED NULL,
  regla_codigo VARCHAR(40) NULL,
  categoria ENUM('visitas','retos','cultura','actividades') NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  revierte_id BIGINT UNSIGNED NULL,
  autor_usuario_id INT UNSIGNED NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pa_mov_evento (evento_id),
  UNIQUE KEY uq_pa_mov_revierte (revierte_id),
  KEY ix_pa_mov_pasaporte (pasaporte_id, creado_at),
  CONSTRAINT fk_pa_mov_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id),
  CONSTRAINT fk_pa_mov_evento FOREIGN KEY (evento_id) REFERENCES pa_eventos(id),
  CONSTRAINT fk_pa_mov_revierte FOREIGN KEY (revierte_id) REFERENCES pa_monedas_movimientos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_sellos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  territorio_id INT UNSIGNED NOT NULL,
  imagen VARCHAR(255) NULL,
  moneda_imagen VARCHAR(255) NULL,
  color CHAR(7) NOT NULL DEFAULT '#7a1f2b',
  UNIQUE KEY uq_pa_sellos_territorio (territorio_id),
  CONSTRAINT fk_pa_sellos_territorio FOREIGN KEY (territorio_id) REFERENCES pa_territorios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_sellos_obtenidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pasaporte_id INT UNSIGNED NOT NULL,
  sello_id INT UNSIGNED NOT NULL,
  evento_id BIGINT UNSIGNED NOT NULL,
  metodo ENUM('checkin_qr','admin') NOT NULL,
  destino_id INT UNSIGNED NULL,
  obtenido_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revocado_at DATETIME NULL,
  revocado_por INT UNSIGNED NULL,
  motivo_revocacion VARCHAR(255) NULL,
  UNIQUE KEY uq_pa_sello_usuario (pasaporte_id, sello_id),
  CONSTRAINT fk_pa_so_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id),
  CONSTRAINT fk_pa_so_sello FOREIGN KEY (sello_id) REFERENCES pa_sellos(id),
  CONSTRAINT fk_pa_so_evento FOREIGN KEY (evento_id) REFERENCES pa_eventos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_visitas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pasaporte_id INT UNSIGNED NOT NULL,
  destino_id INT UNSIGNED NOT NULL,
  evento_id BIGINT UNSIGNED NOT NULL,
  metodo ENUM('checkin_qr','admin') NOT NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pa_visita (pasaporte_id, destino_id),
  CONSTRAINT fk_pa_visitas_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id),
  CONSTRAINT fk_pa_visitas_destino FOREIGN KEY (destino_id) REFERENCES pa_destinos(id),
  CONSTRAINT fk_pa_visitas_evento FOREIGN KEY (evento_id) REFERENCES pa_eventos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Códigos de check-in impresos en el lugar físico. El QR contiene firma HMAC; aquí se guarda el nonce para revocar/limitar.
CREATE TABLE pa_checkin_codigos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destino_id INT UNSIGNED NOT NULL,
  nonce VARCHAR(32) NOT NULL,
  expira_at DATETIME NOT NULL,
  usos_max INT UNSIGNED NOT NULL DEFAULT 10000,
  usos INT UNSIGNED NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revocado_at DATETIME NULL,
  UNIQUE KEY uq_pa_checkin_nonce (nonce),
  CONSTRAINT fk_pa_checkin_destino FOREIGN KEY (destino_id) REFERENCES pa_destinos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_album_fotos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pasaporte_id INT UNSIGNED NOT NULL,
  destino_id INT UNSIGNED NULL,
  archivo VARCHAR(80) NOT NULL,
  miniatura VARCHAR(80) NOT NULL,
  mime VARCHAR(40) NOT NULL,
  bytes INT UNSIGNED NOT NULL,
  ancho SMALLINT UNSIGNED NOT NULL,
  alto SMALLINT UNSIGNED NOT NULL,
  titulo VARCHAR(120) NULL,
  privada TINYINT(1) NOT NULL DEFAULT 1,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  eliminado_at DATETIME NULL,
  KEY ix_pa_album_pasaporte (pasaporte_id, eliminado_at),
  CONSTRAINT fk_pa_album_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id),
  CONSTRAINT fk_pa_album_destino FOREIGN KEY (destino_id) REFERENCES pa_destinos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_lectura_progreso (
  pasaporte_id INT UNSIGNED NOT NULL,
  contenido_id INT UNSIGNED NOT NULL,
  capitulo SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  capitulos_total SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  posicion DECIMAL(5,4) NOT NULL DEFAULT 0,
  iniciada_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completada_at DATETIME NULL,
  PRIMARY KEY (pasaporte_id, contenido_id),
  CONSTRAINT fk_pa_lp_pasaporte FOREIGN KEY (pasaporte_id) REFERENCES pa_pasaportes(id),
  CONSTRAINT fk_pa_lp_contenido FOREIGN KEY (contenido_id) REFERENCES pa_contenidos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_auditoria (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_usuario_id INT UNSIGNED NULL,
  accion VARCHAR(60) NOT NULL,
  objetivo_tipo VARCHAR(40) NOT NULL,
  objetivo_id VARCHAR(60) NOT NULL,
  detalle JSON NULL,
  creado_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_pa_auditoria_obj (objetivo_tipo, objetivo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pa_rate_limit (
  clave CHAR(64) PRIMARY KEY,
  ventana_inicio INT UNSIGNED NOT NULL,
  conteo INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
