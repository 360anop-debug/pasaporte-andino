# API v1 — Pasaporte Andino

Base: `https://region.aprep.net/pasaporte/api/v1` (staging local: `http://127.0.0.1:8080/pasaporte/api/v1`).
Formato JSON UTF-8. Errores: `{"error":{"codigo":"…","mensaje":"…","campo?":"…"}}` con estado HTTP 4xx/5xx.
Textos de contenido: objetos bilingües `{"es":"…","en":"…"}`.

## Autenticación
| Cliente | Mecanismo |
|---|---|
| Web | Cookie `pa_sess` (HttpOnly, SameSite=Lax, Secure) + `X-PA-CSRF` = cookie `pa_csrf` en métodos de escritura |
| Android / Windows | `Authorization: Bearer <token>` + `X-PA-Client: android|windows` |
Tokens opacos de 256 bits; en BD solo su SHA-256; caducidad `PA_SESSION_DAYS` (30).

## Públicos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Estado y BD |
| GET | `/config` | Idiomas, versión de consentimiento, disponibilidad de biblioteca CE360, aviso legal de monedas |
| GET | `/territorios?q=&tipo=provincia|distrito&orden=orden|nombre|lugares` | Catálogo (búsqueda en nombres y etiquetas de lugares) |
| GET | `/territorios/{slug}` | Ficha + lugares + contenidos agrupados (historia, dato, linea_tiempo, personaje, video, audio, leyenda, referencia, galeria) + rutas |
| GET | `/destinos?q=&territorio=&categoria=&orden=` | Lugares |
| GET | `/destinos/{slug}` | Lugar + contenidos + rutas |
| GET | `/rutas?tema=` · `/rutas/{slug}` | Rutas y paradas ordenadas |
| GET | `/contenidos/{id}` | Un contenido |
| GET | `/biblioteca/{origen}-{id}` | Lectura por ID vía adaptador (`local-12`; `ce360-…` → 503 `BIBLIOTECA_CE360_NO_CONFIGURADA`) |
| GET | `/coleccionables` · `/reglas` | Sellos/monedas por territorio · reglas de monedas activas |
| GET | `/verificar/{qr_token}` | `{valido, codigo, desde}` — sin PII |
| GET | `/compartir/{territorio|destino|ruta}/{slug}` | Página HTML Open Graph pública (redirige a la app web) |

## Sesión
| POST `/auth/invitado` | Crea cuenta invitada (rate limit 30/h/IP). Web: cookies; apps: `{token}` |
| POST `/auth/registro` `{email,password}` | Convierte invitado en cuenta persistente (≥10 caracteres) |
| POST `/auth/login` `{email,password}` | Rate limit 30/15 min/IP y 10/15 min/correo |
| POST `/auth/logout` · GET `/auth/sesion` | |

## Mi Pasaporte (requiere sesión)
| POST `/pasaporte` `{nombres, apellidos, nacionalidad(ISO2), idioma, consentimiento:true, menor_de_edad?, consentimiento_tutor?}` | Crea el pasaporte. **No hay DNI.** |
| GET/PATCH `/pasaporte` | Identidad, `codigo` PA-XXXX-XXXX, `qr_url` con token opaco |
| POST/GET/DELETE `/pasaporte/foto` | Foto (multipart `foto`), re-codificada sin EXIF, recorte cuadrado 640 px, privada |
| GET `/pasaporte/progreso` | Monedas por categoría, sellos obtenidos/total, fotos, territorios y lugares visitados, rutas y lecturas |
| GET `/pasaporte/sellos` · `/pasaporte/visitas` · `/pasaporte/monedas?limite=` | |
| GET `/pasaporte/exportar` | Exportación de datos del titular |
| DELETE `/cuenta` `{confirmar:"ELIMINAR"}` | Anonimiza identidad, borra fotos, revoca sesiones |

## Actividad (requiere pasaporte, cabecera `Idempotency-Key` 8–64 car.)
| POST `/checkin` `{codigo}` | QR firmado `PA1.<destino>.<nonce>.<exp>.<firma>` o URL `…/#/checkin/<código>`. Respuesta `{visita: registrado|repetido|ya_registrado, monedas, sello_nuevo, rutas_completadas[], destino_id}` |
| PUT/GET `/lecturas/{contenido_id}/progreso` `{capitulo, posicion}` | El capítulo se acota al total real de la lectura |
| POST `/eventos` `{tipo: lectura_completada|audio_escuchado|video_visto, contenido_id}` | El servidor valida coherencia y, para lecturas, último capítulo + tiempo mínimo |

## Álbum (requiere pasaporte)
`GET /album` · `POST /album` (multipart `foto`, `destino?`, `titulo?`; JPG/PNG/WEBP ≤ 8 MB) · `GET /album/{id}/archivo[?tam=mini]` · `DELETE /album/{id}`.

## Administración (roles en `pa_usuarios.rol`)
| POST `/admin/checkin-codigos` `{destino_id, dias, usos_max}` | editor/admin |
| POST `/admin/visitas` `{pasaporte_codigo, destino_id, motivo}` + Idempotency-Key | admin — alternativa manual auditada |
| POST `/admin/sellos/revocar` `{pasaporte_codigo, sello_id, motivo}` | admin, auditado |
| POST `/admin/monedas/revertir` `{movimiento_id, motivo}` | admin, fila negativa enlazada, auditado |
CLI de servidor: `php bin/admin.php crear-admin|codigo-checkin|listar-destinos`.

## Contrato verificado
`backend-integration/tests/Integration/*` (22 pruebas, 163 aserciones) ejecutadas en CI con PHP 8.4 y MariaDB 11.4.
