// Página de identidad del pasaporte (ref. 02 derecha). Datos dinámicos reales; QR con token opaco.
import QRCode from 'qrcode';
import { h, img } from '../ui.js';
import { t, nationalityName } from '../i18n.js';
import { authImage } from '../api.js';
import { icon, flags } from '../icons.js';

const PE_FLAG = '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#d91023"/><rect x="10" width="10" height="20" fill="#fff"/></svg>';

export function passportCard(p) {
  const photo = h('div.pc-photo');
  if (p.tiene_foto) {
    authImage('/pasaporte/foto').then((u) => photo.replaceChildren(h('img', { src: u, alt: t('photoOptional') }))).catch(() => photo.replaceChildren(icon('user')));
  } else photo.replaceChildren(icon('user'));
  const qr = h('div.pc-qr', { role: 'img', 'aria-label': 'QR' });
  QRCode.toString(p.qr_url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1b0b06', light: '#0000' } })
    .then((svg) => { qr.innerHTML = svg; }).catch(() => {});
  const flag = p.nacionalidad === 'PE' ? PE_FLAG : p.nacionalidad === 'ES' ? flags.es : p.nacionalidad === 'GB' ? flags.en : '';
  return h('section.passport-card', { 'aria-label': t('passportTitle') },
    h('div.pc-orn.tl'), h('div.pc-orn.tr'), h('div.pc-orn.bl'), h('div.pc-orn.br'),
    h('h2.pc-title.caps', t('passportTitle')), h('p.pc-sub.caps', t('passportSub')),
    h('div.pc-body',
      h('div.pc-left', h('div.pc-photo-frame', photo), h('p.pc-no-label', t('passportNo')), h('p.pc-no', { 'data-testid': 'passport-code' }, p.codigo)),
      h('div.pc-right',
        h('dl.pc-fields',
          h('dt', t('name') + ':'), h('dd', p.nombres),
          h('dt', t('surnames') + ':'), h('dd', p.apellidos),
          h('dt', t('nationality') + ':'), h('dd', nationalityName(p.nacionalidad), flag ? h('span.pc-flag', { html: flag }) : null),
        ),
        h('div.pc-qr-row', qr, img('assets/pasaporte/sello-explorador.svg', '', 'pc-stamp')),
      ),
    ),
    h('div.pc-foot', { 'aria-hidden': 'true' }),
  );
}
