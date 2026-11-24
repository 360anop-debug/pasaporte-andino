// Novedades: últimos logros confirmados por el servidor (sin notificaciones push).
import { h, innerHeader, errorState, emptyState, fmtDate, fmtNum } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';

export default async function news() {
  localStorage.setItem('pa-news-seen', String(Date.now()));
  let r;
  try { r = await api('GET', '/pasaporte/monedas?limite=30'); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('notifications') }), errorState(e, () => location.reload())); }
  return h('div.page.page-burgundy', innerHeader({ title: t('notifications'), iconName: 'bell', backTo: '/inicio' }),
    h('div.pad', r.movimientos.length ? h('ul.ledger.on-card', r.movimientos.map((m) => h('li.ledger-item.card', icon(m.cantidad > 0 ? 'star' : 'info'),
      h('div.li-body', h('b', m.destino ? L(m.destino.nombre) : m.motivo), h('small', fmtDate(m.creado_at))), h('span.li-amt', (m.cantidad > 0 ? '+' : '') + fmtNum(m.cantidad))))) : emptyState(t('noCoins'), 'llama')));
}
