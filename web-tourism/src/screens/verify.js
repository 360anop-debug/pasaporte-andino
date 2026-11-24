import { h, img, brandBlock, errorState } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';

export default async function verify({ token }) {
  let r;
  try { r = await api('GET', '/verificar/' + encodeURIComponent(token)); } catch (e) { return h('div.page.page-burgundy', errorState(e, () => location.reload())); }
  return h('div.page.page-burgundy.pad', h('div.verify-wrap', brandBlock(t('verifyTitle')),
    h('div.card.pad-card.center', r.valido
      ? [h('h2.title-ink', icon('check'), ' ', t('verifyValid')), h('p.pc-no', r.codigo), h('p', t('since') + ' ' + r.desde)]
      : [h('h2.title-ink', icon('x'), ' ', t('verifyInvalid'))]),
    h('a.btn.btn-gold.block', { href: '#/inicio' }, t('navHome'))));
}
