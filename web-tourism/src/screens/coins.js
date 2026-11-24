// Mis Monedas Andinas (ref. 07 izquierda): saldo derivado del libro mayor del servidor.
import { h, img, homeTopbar, brandBlock, errorState, emptyState, fmtNum, fmtDate, textile } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';

export default async function coins() {
  let r;
  try { r = await api('GET', '/pasaporte/monedas?limite=20'); } catch (e) { return h('div.page.page-burgundy', homeTopbar(), errorState(e, () => location.reload())); }
  const c = r.resumen.por_categoria;
  const cat = (ic, label, v) => h('div.cat-card', icon(ic), h('span', label), h('b', fmtNum(v)));
  const items = r.movimientos.slice(0, 8);
  return h('div.page.coins-page',
    h('div.coins-hero', img('assets/fondos_texturas/fondo-bienvenida.webp', '', 'ch-bg', { eager: true }), homeTopbar(), h('div.coins-brand', brandBlock(null, 'small')),
      img('assets/personajes/atahualpa-delia.webp', 'Atahualpa y Delia', 'coins-chars', { eager: true }),
      h('div.coins-banner', img('assets/monedas/cofre-recompensas.webp', '', 'cb-chest'), h('h1.cb-title', t('coinsTitle')))),
    h('section.coins-sheet',
      h('p.coins-sub', t('coinsSub')),
      h('div.balance', icon('leaf', 'laurel l'), img('assets/monedas/moneda-base.webp', '', 'bal-coin'), h('div.bal-text', h('span', t('myCoins')), h('b', { 'data-testid': 'coin-total' }, fmtNum(r.resumen.total))), icon('leaf', 'laurel r')),
      h('div.cat-grid', cat('pin', t('byVisits'), c.visitas), cat('trophy', t('byChallenges'), c.retos), cat('book', t('byCulture'), c.cultura), cat('check', t('byActivities'), c.actividades)),
      h('h2.ribbon-center', t('lastCoins')),
      items.length ? h('ul.ledger', items.map((m) => h('li.ledger-item', img(m.destino?.imagen || (m.categoria === 'cultura' ? 'assets/cultura/biblioteca-cultural.webp' : m.categoria === 'actividades' ? 'assets/cultura/portada-video.webp' : 'assets/rutas/ruta-historica.webp'), '', 'li-img'),
        h('div.li-body', h('b', m.destino ? L(m.destino.nombre) : m.motivo), h('span', m.destino ? L(m.destino.territorio) : (m.es_reversion ? t('reversal') : '')), h('small', fmtDate(m.creado_at))),
        h('span.li-amt' + (m.cantidad < 0 ? '.neg' : ''), img('assets/monedas/moneda-base.webp', '', 'li-coin'), (m.cantidad > 0 ? '+' : '') + fmtNum(m.cantidad)),
        m.cantidad > 0 ? h('span.li-ok', icon('check')) : null))) : emptyState(t('noCoins'), 'llama'),
      h('a.btn.btn-burgundy.block', { href: '#/monedas/coleccion' }, img('assets/monedas/medalla-coleccion.webp', '', 'btn-medal'), t('viewCollection'), icon('chevrons', 'chev')),
      h('p.coins-legal', icon('info'), t('coinsInfo')),
    ),
    textile(),
  );
}
