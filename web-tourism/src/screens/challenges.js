// Retos y Recompensas: reglas configurables del servidor + logros reales del viajero.
import { h, img, innerHeader, errorState, fmtNum, guideBubble } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getRules } from './data.js';
import { state } from '../state.js';

export default async function challenges() {
  let rules, pr = null;
  try { rules = await getRules(); if (state.hasPassport()) pr = await state.loadProgress(); }
  catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('challengesTitle') }), errorState(e, () => location.reload())); }
  const IC = { visitas: 'pin', retos: 'trophy', cultura: 'book', actividades: 'check' };
  return h('div.page.page-burgundy',
    innerHeader({ title: t('challengesTitle'), iconName: 'trophy', sub: t('challengesSub'), backTo: '/inicio' }),
    h('div.pad.stack',
      h('section.card.pad-card', h('h2.title-ink', t('rulesTitle')),
        h('ul.rule-list', rules.datos.map((r) => h('li', icon(IC[r.categoria] || 'star'), h('span', L(r.descripcion)), h('b', '+' + fmtNum(r.monedas)))))),
      h('section.card.pad-card', h('p', icon('medal'), ' ', t('stampRule'))),
      pr ? h('section.card.pad-card', h('h2.title-ink', t('myProgress')),
        h('ul.rule-list', h('li', icon('pin'), h('span', t('visits')), h('b', String(pr.lugares_visitados))), h('li', icon('hiker'), h('span', t('tileRoutes')), h('b', String(pr.rutas_completadas))),
          h('li', icon('book'), h('span', t('byCulture')), h('b', String(pr.lecturas_completadas))), h('li', icon('medal'), h('span', t('stamps')), h('b', `${pr.sellos.obtenidos}/${pr.sellos.total}`)))) : h('a.btn.btn-gold.block', { href: '#/bienvenida' }, t('createPassport')),
      h('p.coins-legal.on-dark', icon('info'), t('coinsInfo')),
      guideBubble('llama', t('guideLlama')),
    ));
}
