// Enrutador por hash (compatible con WebView Android y protocolo propio de Electron).
const routes = [];
let current = null;
let depth = Number(sessionStorage.getItem('pa-depth') || 0);
let renderFn = null;

export function route(pattern, load, meta = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ re, keys, load, meta, pattern });
}
export function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}
export const currentPath = () => (location.hash.slice(1).split('?')[0] || '/');
export const query = () => new URLSearchParams(location.hash.split('?')[1] || '');

export function navigate(path, { replace = false } = {}) {
  const target = '#' + path;
  if (location.hash === target) return render();
  if (replace) { location.replace(target); return; }
  depth++;
  sessionStorage.setItem('pa-depth', String(depth));
  location.hash = target;
}
/** Volver al contexto anterior dentro de la app; si no hay historial, al destino padre. */
export function goBack(fallback = '/inicio') {
  if (depth > 0) {
    depth--;
    sessionStorage.setItem('pa-depth', String(depth));
    history.back();
  } else navigate(fallback, { replace: true });
}
export const canGoBack = () => depth > 0;
export function onRender(fn) { renderFn = fn; }
export async function render() {
  const path = currentPath();
  const m = match(path);
  current = { path, ...(m || {}) };
  if (renderFn) await renderFn(current);
}
export const getCurrent = () => current;
window.addEventListener('hashchange', () => render());
