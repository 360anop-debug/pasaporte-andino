// Componentes de interfaz. Todo el contenido dinámico se inserta con textContent (sin innerHTML de datos).
import { icon, flags, MOUNTAINS } from './icons.js';
import { t, L, getLang, setLang } from './i18n.js';
import { state, prefs } from './state.js';
import { navigate, goBack } from './router.js';
import { picto } from './pictos.js';

/** h('div.clase#id', {attrs}, ...hijos) */
export function h(sel, attrs, ...kids) {
  if (attrs instanceof Node || typeof attrs === 'string' || Array.isArray(attrs)) { kids.unshift(attrs); attrs = {}; }
  const [tag, ...rest] = sel.split(/(?=[.#])/);
  const el = document.createElement(tag || 'div');
  for (const r of rest) r[0] === '.' ? el.classList.add(r.slice(1)) : (el.id = r.slice(1));
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className += ' ' + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v; // SOLO para SVG estáticos internos
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}
export const asset = (p) => (p ? (p.startsWith('http') ? p : './' + p.replace(/^\.?\//, '')) : '');

export function img(src, alt, cls = '', opts = {}) {
  const i = h('img' + (cls ? '.' + cls.split(' ').join('.') : ''), { src: asset(src), alt: alt || '', loading: opts.eager ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' });
  i.addEventListener('error', () => { i.classList.add('img-missing'); i.removeAttribute('src'); }, { once: true });
  return i;
}

export function goldTitle(text, cls = '') {
  return h('h1.gold-title' + (cls ? '.' + cls : ''), { 'data-text': text }, text);
}
export const mountains = (cls = '') => h('span.mountains' + (cls ? '.' + cls : ''), { html: MOUNTAINS });

export function langToggle() {
  const mk = (l, label) => h('button.lang-pill' + (getLang() === l ? '.active' : ''), {
    type: 'button', 'aria-pressed': String(getLang() === l), lang: l,
    onclick: () => { if (getLang() !== l) { setLang(l); state.syncLang?.(); } },
  }, h('span.flag', { html: flags[l] }), label);
  return h('div.lang-toggle', { role: 'group', 'aria-label': t('language') }, mk('es', 'Español'), mk('en', 'English'));
}

export function iconBtn(name, label, onclick, cls = '') {
  return h('button.icon-btn' + (cls ? '.' + cls : ''), { type: 'button', 'aria-label': label, title: label, onclick }, icon(name));
}

/** Encabezado de inicio (hamburguesa · idiomas · campana) */
export function homeTopbar() {
  const unseen = state.unseenNews?.() || 0;
  return h('div.topbar',
    iconBtn('menu', t('menu'), () => openDrawer()),
    langToggle(),
    h('button.icon-btn.bell', { type: 'button', 'aria-label': t('notifications'), onclick: () => navigate('/novedades') }, icon('bell'), unseen ? h('span.dot', { 'aria-hidden': 'true' }) : null),
  );
}

export function brandBlock(sub = t('region'), size = '') {
  return h('div.brand' + (size ? '.' + size : ''), mountains(), goldTitle('Pasaporte'), goldTitle('Andino', 'second'), sub ? h('p.brand-sub', sub) : null);
}

/** Encabezado interior (volver · título dorado · acción opcional) */
export function innerHeader({ title, sub, sub2, iconName, action, backTo }) {
  return h('header.inner-header',
    h('button.icon-btn.back', { type: 'button', 'aria-label': t('back'), onclick: () => goBack(backTo) }, icon('back')),
    h('div.ih-title', iconName ? null : mountains('sm'), h('h1.gold-title.ih', { 'data-text': title }, iconName ? icon(iconName, 'ih-icon') : null, title), sub ? h('p.ih-sub', sub) : null, sub2 ? h('p.ih-sub.en', sub2) : null),
    action || h('span.ih-spacer'),
  );
}
export function headerAction(iconName, label, onclick) {
  return h('button.header-action', { type: 'button', onclick, 'aria-label': label }, icon(iconName), h('span', label));
}

const NAV = [
  ['inicio', 'home', 'navHome'], ['distritos', 'map', 'navExplore'], ['pasaporte', 'passport', 'navPassport'], ['album', 'image', 'navAlbum'], ['monedas', 'coins', 'navCoins'],
];
export function bottomNav(active) {
  return h('nav.bottom-nav', { 'aria-label': 'Principal' }, NAV.map(([r, ic, k]) =>
    h('a.nav-item' + (active === r ? '.active' : ''), { href: '#/' + r, 'aria-current': active === r ? 'page' : null }, icon(ic), h('span', t(k)))));
}
export function sideNav(active) {
  return h('nav.side-nav', { 'aria-label': 'Principal' },
    h('a.side-brand', { href: '#/inicio' }, img('assets/marca/logo-pasaporte-andino.webp', 'Pasaporte Andino', '', { eager: true })),
    NAV.map(([r, ic, k]) => h('a.side-item' + (active === r ? '.active' : ''), { href: '#/' + r, 'aria-current': active === r ? 'page' : null }, icon(ic), h('span', t(k)))),
    h('a.side-item', { href: '#/rutas' }, icon('hiker'), h('span', t('tileRoutes'))),
    h('a.side-item', { href: '#/retos' }, icon('trophy'), h('span', t('tileChallenges'))),
    h('a.side-item', { href: '#/checkin' }, icon('qr'), h('span', t('checkinTitle'))),
    h('a.side-item', { href: '#/ajustes' }, icon('settings'), h('span', t('settings'))),
    h('div.side-lang', langToggle()),
  );
}

export function openDrawer() {
  const close = () => wrap.remove();
  const link = (r, ic, label) => h('a.drawer-item', { href: '#' + r, onclick: close }, icon(ic), h('span', label));
  const wrap = h('div.drawer-wrap', { onclick: (e) => e.target === wrap && close() },
    h('aside.drawer', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('menu') },
      h('div.drawer-head', img('assets/marca/logo-pasaporte-andino.webp', 'Pasaporte Andino'), iconBtn('x', t('close'), close)),
      link('/inicio', 'home', t('navHome')), link('/distritos', 'map', t('tileDistricts')), link('/rutas', 'hiker', t('tileRoutes')),
      link('/pasaporte', 'passport', t('tilePassport')), link('/album', 'image', t('tileAlbum')), link('/monedas', 'coins', t('tileCoins')),
      link('/retos', 'trophy', t('tileChallenges')), link('/checkin', 'qr', t('checkinTitle')), link('/mapa', 'map', t('mapTitle')),
      link('/ajustes', 'settings', t('settings')), link('/privacidad', 'info', t('privacy')),
    ));
  document.body.append(wrap);
  wrap.querySelector('a')?.focus();
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// ---------- estados ----------
export const loading = (label = t('loading')) => h('div.state.loading', { role: 'status' }, h('span.spinner', { 'aria-hidden': 'true' }), h('p', label));
export function emptyState(text, guide = 'delia', action) {
  const g = { delia: 'assets/personajes/delia-guia.webp', atahualpa: 'assets/personajes/atahualpa-guia.webp', llama: 'assets/personajes/llama-recompensas.webp' }[guide];
  return h('div.state.empty', g ? img(g, '', 'empty-guide') : null, h('p', text), action || null);
}
export function errorState(err, retry) {
  const msg = err?.code === 'SIN_CONEXION' ? t('offlineNone') : err?.message || t('errorGeneric');
  return h('div.state.error', { role: 'alert' }, icon('info'), h('p', msg), retry ? h('button.btn.btn-burgundy.sm', { type: 'button', onclick: retry }, t('retry')) : null);
}
export function offlineBanner(data) {
  return data?.__offline ? h('div.offline-banner', { role: 'status' }, icon('info'), t('offlineBanner')) : null;
}
export const demoBadge = (on) => (on ? h('span.badge-demo', { title: t('demoNote') }, t('demoBadge')) : null);
export const illusBadge = (on) => (on ? h('span.badge-illus', { title: t('notPhoto') }, t('illustration')) : null);

let toastTimer;
export function toast(text, kind = 'ok') {
  document.querySelector('.toast')?.remove();
  const el = h('div.toast.' + kind, { role: kind === 'error' ? 'alert' : 'status' }, icon(kind === 'error' ? 'info' : 'check'), h('span', text));
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4200);
}

export function sheet(title, content, { onClose } = {}) {
  const close = () => { wrap.remove(); onClose?.(); };
  const wrap = h('div.sheet-wrap', { onclick: (e) => e.target === wrap && close() },
    h('div.sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div.sheet-head', h('h2', title), iconBtn('x', t('close'), close)), content));
  document.body.append(wrap);
  setTimeout(() => wrap.querySelector('button, a, input, select, textarea')?.focus(), 30);
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  return { close, el: wrap };
}

export function progressBar(value, total, label) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return h('div.progress-row',
    h('div.progress', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(value), 'aria-label': label },
      h('div.progress-fill', { style: { width: pct + '%' } }), h('span.progress-label', label)),
    h('span.progress-pct', pct + '%'));
}

/** Sello: arte original del kit si existe; si no, sello vectorial con la composición de la ref. 06
 * (doble anillo perforado, pictograma del territorio, cinta con el nombre real y tres estrellas). */
export function stampEl(s, obtained) {
  const nombre = L(s.territorio.nombre);
  if (obtained && s.imagen) return h('div.stamp.got', img(s.imagen, nombre, 'stamp-img'));
  return h('div.stamp' + (obtained ? '.got' : '.locked'), { title: (obtained ? '' : t('locked') + ' · ') + nombre },
    genStamp(s.territorio.slug, nombre.toUpperCase(), obtained ? (s.color || '#7a1f2b') : '#8c8c8c', !obtained),
    obtained ? null : h('span.sr-only', t('locked') + ' ' + nombre));
}
const SVGNS = 'http://www.w3.org/2000/svg';
function genStamp(slug, name, color, locked) {
  const el = h('div.gen-stamp', { style: { color } });
  // Estructura estática (sin datos) + nombre insertado como nodo de texto SVG (sin innerHTML de datos).
  el.innerHTML = `<svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="2.5 5"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"/>
    <g transform="translate(45 30) scale(1.1)" fill="none" stroke="currentColor" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">${picto(slug)}</g>
    <path d="M22 116h156l-10 15 10 15H22l10-15Z" fill="#fffdf6" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
    <g fill="currentColor">${[78, 100, 122].map((x) => `<path transform="translate(${x} 164) scale(.42)" d="M0-14 4-4 14-4 6 3 9 13 0 7-9 13-6 3-14-4-4-4Z"/>`).join('')}</g>
    ${locked ? '<g transform="translate(86 152)" fill="currentColor"><rect x="0" y="12" width="28" height="22" rx="4"/><path d="M5 12V8a9 9 0 0 1 18 0v4" fill="none" stroke="currentColor" stroke-width="4"/></g>' : ''}
  </svg>`;
  const svg = el.firstElementChild;
  const txt = document.createElementNS(SVGNS, 'text');
  txt.setAttribute('x', '100'); txt.setAttribute('y', '138'); txt.setAttribute('text-anchor', 'middle');
  txt.setAttribute('font-size', name.length > 11 ? '17' : '21'); txt.setAttribute('font-weight', '700');
  txt.setAttribute('fill', 'currentColor'); txt.setAttribute('class', 'gen-stamp-text');
  txt.setAttribute('textLength', String(Math.min(140, name.length * 13))); txt.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  txt.textContent = name;
  svg.append(txt);
  return el;
}

/** Moneda coleccionable: arte del kit si existe; si no, moneda base con nombre; bloqueada = moneda oculta. */
export function coinEl(s, obtained) {
  const name = L(s.territorio.nombre);
  if (!obtained) return h('div.coin.locked', img('assets/monedas/moneda-oculta.webp', t('locked') + ' · ' + name), h('span.coin-name', name.toUpperCase()));
  return h('div.coin.got',
    img(s.moneda_imagen || 'assets/monedas/moneda-base.webp', name),
    s.moneda_imagen ? null : h('span.coin-engrave', { 'aria-hidden': 'true', html: `<svg viewBox="0 0 100 70"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fff0a8" stroke-width="5" transform="translate(.8 1.2)">${picto(s.territorio.slug)}</g><g stroke="#7a4708" stroke-width="4.4">${picto(s.territorio.slug)}</g></g></svg>` }),
    h('span.coin-name' + (name.length > 11 ? '.long' : ''), name.toUpperCase()), h('span.coin-check', { 'aria-label': t('achieved') }, icon('check')));
}

export function guideBubble(who, text) {
  if (prefs.muteGuides) return null;
  const src = { atahualpa: 'assets/personajes/atahualpa-guia.webp', delia: 'assets/personajes/delia-guia.webp', llama: 'assets/personajes/llama-recompensas.webp' }[who];
  return h('div.guide', img(src, who === 'llama' ? 'Llama' : who === 'delia' ? 'Delia' : 'Atahualpa', 'guide-img'), h('p.guide-text', text));
}

export const textile = (cls = '') => h('div.textile-band' + (cls ? '.' + cls : ''), { 'aria-hidden': 'true' });

export function fmtDuration(sec) {
  if (sec == null || !isFinite(sec)) return '0:00';
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
export function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'));
  const today = new Date();
  const diff = Math.floor((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
  return d.toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'es-PE', { day: 'numeric', month: 'short', year: diff > 300 ? 'numeric' : undefined });
}
export const fmtNum = (n) => Number(n || 0).toLocaleString(getLang() === 'en' ? 'en-US' : 'es-PE');
