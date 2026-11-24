// Cliente del API turístico. El servidor es la fuente de verdad: el cliente nunca calcula puntos ni sellos.
import { API_BASE } from './config.js';
import { TARGET, secure } from './platform.js';

export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

let token = null;
let tokenLoaded = false;
async function getToken() {
  if (!tokenLoaded) {
    token = await secure.get();
    tokenLoaded = true;
  }
  return token;
}
export async function setToken(t) {
  token = t;
  tokenLoaded = true;
  if (t) await secure.set(t); else await secure.clear();
}

function csrf() {
  const m = document.cookie.match(/(?:^|; )pa_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export function newIdemKey() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------- caché local limitada de contenido PÚBLICO ----------
const CACHE_PREFIX = 'pa-cache:';
const CACHE_MAX = 80;
function cacheGet(path) {
  try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + path) || 'null'); } catch { return null; }
}
function cachePut(path, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + path, JSON.stringify({ t: Date.now(), d: data }));
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    if (keys.length > CACHE_MAX) {
      keys.map((k) => [k, JSON.parse(localStorage.getItem(k)).t]).sort((a, b) => a[1] - b[1])
        .slice(0, keys.length - CACHE_MAX).forEach(([k]) => localStorage.removeItem(k));
    }
  } catch { /* cuota llena: sin caché */ }
}
export function clearPrivateCache() {
  Object.keys(localStorage).filter((k) => k.startsWith('pa-cache:/pasaporte') || k.startsWith('pa-queue')).forEach((k) => localStorage.removeItem(k));
}

/**
 * @param {string} method
 * @param {string} path  p. ej. '/territorios'
 * @param {{json?:any, form?:FormData, idem?:string, publicCache?:boolean, raw?:boolean, signal?:AbortSignal}} opt
 */
export async function api(method, path, opt = {}) {
  const headers = { 'X-PA-Client': TARGET, Accept: 'application/json' };
  const t = await getToken();
  if (t) headers.Authorization = 'Bearer ' + t;
  if (TARGET === 'web' && method !== 'GET') headers['X-PA-CSRF'] = csrf();
  if (opt.idem) headers['Idempotency-Key'] = opt.idem;
  let body;
  if (opt.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opt.json); }
  if (opt.form) body = opt.form;
  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body, credentials: 'include', signal: opt.signal, cache: 'no-store' });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    if (method === 'GET' && opt.publicCache) {
      const c = cacheGet(path);
      if (c) return Object.assign(structuredClone(c.d), { __offline: true, __cachedAt: c.t });
    }
    throw new ApiError(0, 'SIN_CONEXION', 'Sin conexión con el servidor.');
  }
  if (opt.raw) {
    if (!res.ok) throw new ApiError(res.status, 'ERROR', 'No se pudo cargar el archivo.');
    return res;
  }
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    const e = data?.error || {};
    if (res.status === 401 && t) await setToken(null);
    throw new ApiError(res.status, e.codigo || 'ERROR', e.mensaje || 'Error inesperado.', e);
  }
  if (method === 'GET' && opt.publicCache) cachePut(path, data);
  return data;
}

/** Imagen protegida (álbum/foto de perfil) → URL blob con autorización. */
const blobCache = new Map();
export async function authImage(path) {
  if (blobCache.has(path)) return blobCache.get(path);
  const res = await api('GET', path, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(path, url);
  return url;
}
export function forgetImage(prefix) {
  for (const [k, v] of blobCache) if (k.startsWith(prefix)) { URL.revokeObjectURL(v); blobCache.delete(k); }
}

// ---------- cola de eventos con idempotency keys (sincronización segura) ----------
const QKEY = 'pa-queue';
export function pendingEvents() {
  try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch { return []; }
}
function savePending(q) { localStorage.setItem(QKEY, JSON.stringify(q)); }

/** Envía un evento; si no hay conexión lo deja en cola con su clave (no se declara guardado). */
export async function sendEvent(body) {
  const idem = newIdemKey();
  try {
    return { estado: 'confirmado', ...(await api('POST', '/eventos', { json: body, idem })) };
  } catch (e) {
    if (e.code === 'SIN_CONEXION') {
      savePending([...pendingEvents(), { body, idem, t: Date.now() }]);
      return { estado: 'pendiente' };
    }
    throw e;
  }
}
export async function flushEvents() {
  const q = pendingEvents();
  if (!q.length) return 0;
  const rest = [];
  let sent = 0;
  for (const ev of q) {
    try { await api('POST', '/eventos', { json: ev.body, idem: ev.idem }); sent++; }
    catch (e) { if (e.code === 'SIN_CONEXION') rest.push(ev); /* errores de validación: se descartan */ }
  }
  savePending(rest);
  return sent;
}
