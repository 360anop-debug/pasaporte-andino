-- Reglas iniciales de monedas simbólicas. Configurables por administración. No hay saldo inicial.
INSERT INTO pa_reglas (codigo, evento_tipo, categoria, monedas, activo, descripcion_es, descripcion_en) VALUES
 ('VISITA_DESTINO', 'visita_destino', 'visitas', 100, 1, 'Visita verificada con código QR del lugar', 'Visit verified with the site QR code'),
 ('RUTA_COMPLETADA', 'ruta_completada', 'retos', 200, 1, 'Ruta turística completada (todos sus lugares verificados)', 'Tourist route completed (all places verified)'),
 ('LECTURA_COMPLETADA', 'lectura_completada', 'cultura', 20, 1, 'Lectura de la Biblioteca Viva completada', 'Living Library reading completed'),
 ('AUDIO_ESCUCHADO', 'audio_escuchado', 'actividades', 5, 1, 'Audio o leyenda escuchada completa', 'Audio or legend fully listened'),
 ('VIDEO_VISTO', 'video_visto', 'actividades', 5, 1, 'Video del lugar visto completo', 'Site video fully watched');
