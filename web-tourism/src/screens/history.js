// Historia del distrito (ref. 05, 3ª pantalla): Resumen / Línea de tiempo / Personajes + Sabías que…
import { h, img, innerHeader, errorState, emptyState, demoBadge, illusBadge, offlineBanner } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritory } from './data.js';
import { credits } from './player.js';

export default async function history({ slug }) {
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('history') }), errorState(e, () => location.reload())); }
  const name = L(d.nombre);
  const c = d.contenidos;
  const hist = c.historia[0];
  const video = c.video[0];
  const panel = h('div.hist-panel', { role: 'tabpanel' });
  const views = {
    resumen: () => (c.historia.length ? c.historia.map((x) => h('article.hist-text', h('p', L(x.cuerpo)), credits(x), demoBadge(x.es_demo))) : [emptyState(t('emptyHistory'), 'atahualpa')]),
    linea: () => (c.linea_tiempo.length ? [h('ol.timeline', c.linea_tiempo.map((x) => h('li', h('b', L(x.titulo)), h('p', L(x.cuerpo)), demoBadge(x.es_demo))))] : [emptyState(t('emptyHistory'), 'atahualpa')]),
    personajes: () => (c.personaje.length ? c.personaje.map((x) => h('article.person', x.poster_url ? img(x.poster_url, L(x.titulo), 'person-img') : null, h('div', h('b', L(x.titulo)), h('p', L(x.cuerpo)), demoBadge(x.es_demo)))) : [emptyState(t('emptyHistory'), 'atahualpa')]),
  };
  const tabs = h('div.pill-tabs', { role: 'tablist' }, [['resumen', t('summary')], ['linea', t('timeline')], ['personajes', t('characters')]].map(([k, label], i) =>
    h('button.tab', { type: 'button', role: 'tab', 'aria-selected': String(i === 0), onclick: (e) => { tabs.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', 'false')); e.currentTarget.setAttribute('aria-selected', 'true'); panel.replaceChildren(...views[k]()); } }, label)));
  panel.replaceChildren(...views.resumen());
  const fact = c.dato[0];
  return h('div.page.page-burgundy.history',
    innerHeader({ title: name + ' - ' + t('history'), iconName: 'book', backTo: '/distrito/' + encodeURIComponent(slug) }),
    offlineBanner(d),
    h('div.history-hero',
      img((hist && hist.poster_url) || 'assets/cultura/cabecera-historia.webp', '', 'hh-img', { eager: true }),
      h('div.img-badges', illusBadge(true), demoBadge(hist?.es_demo)),
      video ? h('a.hh-play', { href: '#/distrito/' + encodeURIComponent(slug) + '/videos?v=' + video.id, 'aria-label': t('play') + ': ' + L(video.titulo) }, icon('play')) : null),
    h('h1.hist-title', t('historyOf', name)),
    h('div.parch-sheet.parch-plain',
      tabs, panel,
      fact ? h('aside.did-you-know', h('div', h('h3', icon('info'), t('didYouKnow')), h('p', L(fact.cuerpo)), demoBadge(fact.es_demo)), img('assets/monedas/moneda-base.webp', '', 'dyk-img')) : null,
    ),
  );
}
