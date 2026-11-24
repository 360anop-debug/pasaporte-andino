// Bienvenida tras crear el pasaporte (ref. 02 derecha)
import { h, img, homeTopbar, brandBlock, errorState } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { passportCard } from './passportCard.js';

export default async function welcomePassport() {
  let p;
  try { p = await state.loadPassport(true); } catch (e) { return errorState(e, () => location.reload()); }
  const next = sessionStorage.getItem('pa-after-register');
  return h('div.page.page-burgundy.wp',
    h('div.wp-head', img('assets/fondos_texturas/fondo-interior.webp', '', 'wp-head-bg', { eager: true }), homeTopbar(), h('div.wp-brand', brandBlock(t('region'), 'small'))),
    h('div.pad', passportCard(p)),
    h('section.welcome-banner',
      img('assets/personajes/atahualpa-guia.webp', 'Atahualpa', 'wb-ata'),
      h('div.wb-text',
        h('h2.gold-title.wb-title', t('welcomeTitle')),
        h('p', t('welcomeText')),
        h('button.btn.btn-gold', { type: 'button', onclick: () => { sessionStorage.removeItem('pa-after-register'); navigate(next || '/inicio', { replace: true }); } }, t('startAdventure'), icon('chevrons')),
      ),
      img('assets/personajes/delia-guia.webp', 'Delia', 'wb-delia'),
    ),
  );
}
