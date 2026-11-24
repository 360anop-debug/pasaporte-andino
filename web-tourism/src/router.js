// Enrutador por hash (compatible con WebView Android y protocolo propio de Electron).
// Mantiene una pila de historial propia para que «Atrás» (botón ← y botón Atrás de Android) vuelva siempre
// a la pantalla anterior, también cuando se navega con enlaces <a href="#/…">.
const routes = [];
let current = null;
let renderFn = null;
let replacing = false;
let stack = (() => { try { return JSON.parse(sessionStorage.getItem('pa-stack') || '[]'); } catch { return []; } })();
const saveStack = () => { try { sessionStorage.setItem('pa-stack', JSON.stringify(stack.slice(-50))); } catch { /* */ } };

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

function track(path) {
  if (replacing) { stack[stack.length - 1] = path; replacing = false; }
  else if (stack.length > 1 && stack[stack.length - 2] === path) stack.pop(); // retroceso
  else if (stack[stack.length - 1] !== path) stack.push(path);
  if (!stack.length) stack.push(path);
  saveStack();
}

export function navigate(path, { replace = false } = {}) {
  const target = '#' + path;
  if (location.hash === target) return render();
  if (replace) { replacing = true; location.replace(target); return; }
  location.hash = target;
}
/** Volver al contexto anterior dentro de la app; si no hay historial, al destino padre. */
export function goBack(fallback = '/inicio') {
  if (stack.length > 1) history.back();
  else navigate(fallback, { replace: true });
}
export const canGoBack = () => stack.length > 1;
export function onRender(fn) { renderFn = fn; }
export async function render() {
  const path = currentPath();
  track(path);
  const m = match(path);
  current = { path, ...(m || {}) };
  if (renderFn) await renderFn(current);
}
export const getCurrent = () => current;
window.addEventListener('hashchange', () => render());
