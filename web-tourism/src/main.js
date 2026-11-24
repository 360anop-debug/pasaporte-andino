import '@fontsource/cinzel/700.css';
import '@fontsource/alegreya/700.css';
import '@fontsource/alegreya/800.css';
import '@fontsource/alegreya/700-italic.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/desktop.css';

import { route, render, onRender, navigate, goBack, canGoBack, currentPath } from './router.js';
import { state, prefs, savePrefs } from './state.js';
import { onLang, getLang, setLang, t } from './i18n.js';
import { flushEvents } from './api.js';
import { onBackButton, exitApp, TARGET } from './platform.js';
import { h, bottomNav, sideNav, errorState, loading, toast } from './ui.js';
import { buildAside } from './screens/aside.js';

// guard: 'none' (público) | 'passport' (requiere pasaporte creado)
route('/', () => import('./screens/welcome.js'), { guard: 'none', chrome: false });
route('/bienvenida', () => import('./screens/welcome.js'), { guard: 'none', chrome: false });
route('/login', () => import('./screens/login.js'), { guard: 'none', chrome: false });
route('/bienvenido', () => import('./screens/welcomePassport.js'), { guard: 'passport', nav: 'inicio' });
route('/inicio', () => import('./screens/home.js'), { guard: 'none', nav: 'inicio' });
route('/distritos', () => import('./screens/districts.js'), { guard: 'none', nav: 'distritos' });
route('/distrito/:slug', () => import('./screens/district.js'), { guard: 'none', nav: 'inicio' });
route('/distrito/:slug/contenidos', () => import('./screens/districtContents.js'), { guard: 'none', nav: 'inicio' });
route('/distrito/:slug/historia', () => import('./screens/history.js'), { guard: 'none', nav: 'distritos' });
route('/distrito/:slug/videos', () => import('./screens/media.js'), { guard: 'none', nav: 'distritos', kind: 'video' });
route('/distrito/:slug/audios', () => import('./screens/media.js'), { guard: 'none', nav: 'distritos', kind: 'audio' });
route('/distrito/:slug/referencias', () => import('./screens/references.js'), { guard: 'none', nav: 'distritos' });
route('/distrito/:slug/galeria', () => import('./screens/gallery.js'), { guard: 'none', nav: 'distritos' });
route('/destino/:slug', () => import('./screens/place.js'), { guard: 'none', nav: 'distritos' });
route('/lectura/:id', () => import('./screens/reader.js'), { guard: 'none', nav: 'distritos' });
route('/rutas', () => import('./screens/routes.js'), { guard: 'none', nav: 'distritos' });
route('/ruta/:slug', () => import('./screens/routeDetail.js'), { guard: 'none', nav: 'distritos' });
route('/mapa', () => import('./screens/map.js'), { guard: 'none', nav: 'distritos' });
route('/pasaporte', () => import('./screens/passport.js'), { guard: 'passport', nav: 'pasaporte' });
route('/pasaporte/sellos', () => import('./screens/stamps.js'), { guard: 'passport', nav: 'pasaporte' });
route('/album', () => import('./screens/album.js'), { guard: 'passport', nav: 'album' });
route('/monedas', () => import('./screens/coins.js'), { guard: 'passport', nav: 'monedas' });
route('/monedas/coleccion', () => import('./screens/collection.js'), { guard: 'passport', nav: 'monedas' });
route('/retos', () => import('./screens/challenges.js'), { guard: 'none', nav: 'inicio' });
route('/checkin', () => import('./screens/checkin.js'), { guard: 'passport', nav: 'pasaporte' });
route('/checkin/:code', () => import('./screens/checkin.js'), { guard: 'passport', nav: 'pasaporte' });
route('/novedades', () => import('./screens/news.js'), { guard: 'passport', nav: 'inicio' });
route('/ajustes', () => import('./screens/settings.js'), { guard: 'none', nav: 'inicio' });
route('/privacidad', () => import('./screens/privacy.js'), { guard: 'none', nav: 'inicio' });
route('/verificar/:token', () => import('./screens/verify.js'), { guard: 'none', chrome: false });

const app = document.getElementById('app');
let seq = 0;

onRender(async ({ path, r, params }) => {
  const my = ++seq;
  if (!r) { navigate('/inicio', { replace: true }); return; }
  if (path === '/' ) { navigate(state.hasPassport() ? '/inicio' : '/bienvenida', { replace: true }); return; }
  if (r.meta.guard === 'passport' && !state.hasPassport()) {
    sessionStorage.setItem('pa-after-register', path);
    navigate('/bienvenida', { replace: true });
    return;
  }
  const chrome = r.meta.chrome !== false;
  const main = h('main.screen', { id: 'main', tabindex: '-1' }, loading());
  const shell = h('div.shell' + (chrome ? '.with-chrome' : '.no-chrome'),
    chrome ? sideNav(r.meta.nav) : null,
    h('div.stage', main, chrome ? bottomNav(r.meta.nav) : null),
    chrome ? h('aside.side-panel', { 'aria-label': 'Resumen' }) : null);
  app.replaceChildren(shell);
  try {
    const mod = await r.load();
    if (my !== seq) return;
    const el = await mod.default(params, r.meta);
    if (my !== seq) return;
    main.replaceChildren(el);
    main.scrollTop = 0;
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    if (chrome) buildAside(shell.querySelector('.side-panel'));
  } catch (e) {
    console.error(e);
    if (my === seq) main.replaceChildren(errorState(e, () => render()));
  }
});

onLang(() => render());

async function boot() {
  if (window.__paIncompatible) return; // aviso de motor web antiguo ya mostrado (public/compat.js)
  document.documentElement.lang = getLang();
  document.documentElement.dataset.target = TARGET;
  savePrefs();
  await state.loadSession();
  if (state.session?.error && state.session.error.code === 'SIN_CONEXION') toast(t('offlineBanner'), 'error');
  onBackButton(() => {
    const overlay = document.querySelector('.sheet-wrap, .drawer-wrap');
    if (overlay) { overlay.remove(); return; }
    if (['/inicio', '/bienvenida', '/'].includes(currentPath()) || !canGoBack()) exitApp();
    else goBack();
  });
  window.addEventListener('online', async () => { const n = await flushEvents(); if (n) toast(`✓ ${n}`); });
  flushEvents().catch(() => {});
  if ('serviceWorker' in navigator && TARGET === 'web' && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  window.__paReady = true;
  render();
}
boot();
