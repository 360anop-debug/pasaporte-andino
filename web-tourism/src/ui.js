// Componentes de interfaz. Todo el contenido dinámico se inserta con textContent (sin innerHTML de datos).
import { icon, flags, MOUNTAINS } from './icons.js';
import { t, L, getLang, setLang } from './i18n.js';
import { state, prefs } from './state.js';
import { navigate, goBack } from './router.js';

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

/** Sello: arte del kit si existe; si no, sello vectorial generado con el nombre real (texto DOM). */
export function stampEl(s, obtained) {
  const name = L(s.territorio.nombre).toUpperCase();
  if (!obtained) {
    return h('div.stamp.locked', { title: t('locked') + ' · ' + L(s.territorio.nombre) },
      genStamp(name, '#8d8d8d', true), h('span.sr-only', t('locked') + ' ' + L(s.territorio.nombre)));
  }
  if (s.imagen) return h('div.stamp.got', img(s.imagen, L(s.territorio.nombre), 'stamp-img'));
  return h('div.stamp.got', genStamp(name, s.color || '#7a1f2b', false));
}
function genStamp(name, color, locked) {
  const id = 'arc' + Math.random().toString(36).slice(2, 8);
  const el = h('div.gen-stamp', { style: { color } });
  el.innerHTML = `<svg viewBox="0 0 200 170" aria-hidden="true"><defs><path id="${id}" d="M28 112 A74 74 0 0 0 172 112"/></defs>
    <circle cx="100" cy="82" r="76" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="3 5"/>
    <circle cx="100" cy="82" r="68" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M45 92 78 52l14 16 18-28 45 52Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
    ${locked ? '<g transform="translate(86 104)"><rect x="0" y="10" width="28" height="22" rx="4" fill="currentColor"/><path d="M5 10V6a9 9 0 0 1 18 0v4" fill="none" stroke="currentColor" stroke-width="4"/></g>' : '<path d="M78 120l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zM100 120l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zM122 120l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="currentColor" transform="scale(.8) translate(25 30)"/>'}
    </svg>`;
  el.append(h('span.gen-stamp-name', name));
  return el;
}

/** Moneda coleccionable: arte del kit si existe; si no, moneda base con nombre; bloqueada = moneda oculta. */
export function coinEl(s, obtained) {
  const name = L(s.territorio.nombre);
  if (!obtained) return h('div.coin.locked', img('assets/monedas/moneda-oculta.webp', t('locked') + ' · ' + name), h('span.coin-name', name.toUpperCase()));
  return h('div.coin.got',
    img(s.moneda_imagen || 'assets/monedas/moneda-base.webp', name),
    s.moneda_imagen ? null : h('span.coin-glyph', { 'aria-hidden': 'true' }, name.slice(0, 1)),
    h('span.coin-name', name.toUpperCase()), h('span.coin-check', { 'aria-label': t('achieved') }, icon('check')));
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
