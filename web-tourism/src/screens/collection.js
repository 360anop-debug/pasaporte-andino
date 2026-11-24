// Mi Colección de Monedas (ref. 07 derecha): moneda de cada territorio, desbloqueada con su sello verificado.
import { h, img, innerHeader, errorState, progressBar, coinEl, iconBtn, sheet, textile } from '../ui.js';
import { t } from '../i18n.js';
import { api } from '../api.js';

export default async function collection() {
  let s;
  try { s = await api('GET', '/pasaporte/sellos'); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('collectionTitle') }), errorState(e, () => location.reload())); }
  const got = s.datos.filter((x) => x.obtenido).length;
  return h('div.page.page-burgundy.collection-page',
    innerHeader({ title: t('collectionTitle'), sub: t('collectionSub'), backTo: '/monedas', action: iconBtn('info', t('about'), () => sheet(t('collectionTitle'), h('p', t('coinsInfo')))) }),
    textile(),
    h('ul.coin-grid', s.datos.map((x) => h('li', coinEl(x, x.obtenido)))),
    h('section.progress-panel', img('assets/monedas/medalla-coleccion.webp', '', 'pp-medal'),
      h('div', h('h2.pp-title', t('collectionProgress')), progressBar(got, s.datos.length, t('coinsOf', got, s.datos.length)))),
    h('div.llama-note', h('div.ln-card', img('assets/monedas/cofre-recompensas.webp', '', 'ln-coins'), h('p', t('keepCollecting'))), img('assets/personajes/llama-recompensas.webp', 'Llama', 'ln-llama')),
  );
}
