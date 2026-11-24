// Inicio (ref. 03 izquierda)
import { h, img, homeTopbar, brandBlock, fmtNum, guideBubble } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { authImage } from '../api.js';

const DISTRICT_ICON = '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M3 44 21 18l9 11 9-14 22 29Z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 4c-6 0-10.5 4.5-10.5 10.3C21.5 22 32 32 32 32s10.5-10 10.5-17.7C42.5 8.5 38 4 32 4Z" fill="#f5c542" stroke="#7a4a10" stroke-width="2"/><circle cx="32" cy="14" r="3.6" fill="#7a1f2b"/></svg>';

export default async function home() {
  const tile = (href, label, ic, active = false, html = null) => h('a.tile' + (active ? '.tile-active' : ''), { href },
    h('span.tile-icon', html ? { html } : {}, html ? null : icon(ic)), h('span.tile-label', label));
  const status = h('div.home-status');
  if (state.hasPassport()) {
    Promise.all([state.loadPassport(), state.loadProgress()]).then(([p, pr]) => {
      const av = h('span.hs-avatar', icon('user'));
      if (p.tiene_foto) authImage('/pasaporte/foto').then((u) => av.replaceChildren(h('img', { src: u, alt: '' }))).catch(() => {});
      status.replaceChildren(
        h('a.hs-item', { href: '#/pasaporte' }, av, h('span', h('small', t('tilePassport')), h('b', p.nombres.split(' ')[0]))),
        h('a.hs-item', { href: '#/monedas' }, img('assets/monedas/moneda-base.webp', '', 'hs-coin'), h('span', h('small', t('coins')), h('b', { 'data-testid': 'home-coins' }, fmtNum(pr.monedas.total)))),
      );
    }).catch(() => status.remove());
  } else {
    status.replaceChildren(h('a.btn.btn-gold.sm', { href: '#/bienvenida' }, icon('idcard'), t('createPassport')));
  }
  return h('div.page.home',
    h('div.home-hero',
      img('assets/exploracion/cabecera-explorar.webp', '', 'home-bg', { eager: true }),
      homeTopbar(),
      h('div.home-brand', brandBlock(t('region'))),
      img('assets/personajes/atahualpa-delia.webp', 'Atahualpa y Delia', 'home-chars', { eager: true }),
      h('a.scroll-banner', { href: '#/distritos' }, h('span.sb-pin', { html: DISTRICT_ICON }), h('span.sb-text', t('exploreBanner'))),
    ),
    h('div.home-tiles',
      img('assets/fondos_texturas/fondo-interior.webp', '', 'home-tiles-bg'),
      h('nav.tiles', { 'aria-label': t('menu') },
        tile('#/distritos', t('tileDistricts'), null, true, DISTRICT_ICON),
        tile('#/rutas', t('tileRoutes'), 'hiker'),
        tile('#/pasaporte', t('tilePassport'), 'passport'),
        tile('#/album', t('tileAlbum'), 'image'),
        tile('#/monedas', t('tileCoins'), 'coins'),
        tile('#/retos', t('tileChallenges'), 'trophy'),
      ),
      status,
      h('div.home-guide', guideBubble('atahualpa', t('guideAtahualpaHome'))),
    ),
  );
}
