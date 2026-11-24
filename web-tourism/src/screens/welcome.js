// Bienvenida + registro (ref. 02 izquierda). Datos mínimos: sin DNI. Foto opcional con permisos del sistema.
import { h, img, brandBlock, langToggle, textile, toast } from '../ui.js';
import { t, NATIONALITIES, getLang } from '../i18n.js';
import { icon } from '../icons.js';
import { api, ApiError } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';

const MAX = 8 * 1024 * 1024;
const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;

export default async function welcome() {
  if (state.hasPassport()) { navigate('/inicio', { replace: true }); return h('div'); }
  let photoFile = null;
  const errs = {};
  const field = (id, label, ic, input) => {
    const err = h('div.field-err', { id: id + '-err', role: 'alert' });
    errs[id] = err;
    input.id = id;
    input.setAttribute('aria-describedby', id + '-err');
    return h('div.field', icon(ic), h('div', h('label', { for: id }, label, ' ', h('span.req', { 'aria-hidden': 'true' }, '*')), input), err);
  };
  const nombres = h('input.input', { name: 'nombres', autocomplete: 'given-name', maxlength: '60', required: true });
  const apellidos = h('input.input', { name: 'apellidos', autocomplete: 'family-name', maxlength: '60', required: true });
  const nac = h('select.select', { name: 'nacionalidad', required: true },
    h('option', { value: '' }, t('choose')),
    NATIONALITIES.map(([c, es, en]) => h('option', { value: c, selected: c === 'PE' ? true : null }, getLang() === 'en' ? en : es)));
  const preview = h('div.photo-preview', icon('camera'));
  const fileIn = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr-only', id: 'foto' });
  const photoErr = h('div.field-err', { role: 'alert' });
  fileIn.addEventListener('change', () => {
    const f = fileIn.files?.[0];
    photoErr.textContent = '';
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { photoErr.textContent = 'JPG / PNG / WEBP'; return; }
    if (f.size > MAX) { photoErr.textContent = '≤ 8 MB'; return; }
    photoFile = f;
    const u = URL.createObjectURL(f);
    preview.replaceChildren(h('img', { src: u, alt: '' }));
    removeBtn.hidden = false;
  });
  const removeBtn = h('button.link', { type: 'button', hidden: true, onclick: () => { photoFile = null; fileIn.value = ''; preview.replaceChildren(icon('camera')); removeBtn.hidden = true; } }, t('removePhoto'));
  const minor = h('input', { type: 'checkbox', id: 'menor' });
  const tutor = h('input', { type: 'checkbox', id: 'tutor' });
  const tutorRow = h('label.check', { for: 'tutor', hidden: true }, tutor, h('span', t('tutorConsent')));
  minor.addEventListener('change', () => { tutorRow.hidden = !minor.checked; });
  const consent = h('input', { type: 'checkbox', id: 'consent', required: true });
  const formErr = h('div.field-err.form-err', { role: 'alert' });
  const submit = h('button.btn.btn-burgundy.block', { type: 'submit' }, h('span', t('createPassport')), icon('chevrons', 'chev'));

  const form = h('form.register-card.parchment', { novalidate: true, onsubmit: onSubmit },
    h('h2.register-title', icon('user'), t('registerTitle')),
    h('p.register-sub', t('registerSub')),
    field('nombres', t('firstNames'), 'user', nombres),
    field('apellidos', t('lastNames'), 'user', apellidos),
    field('nacionalidad', t('nationality'), 'globe', nac),
    h('div.field.photo-field', icon('idcard'),
      h('div', h('span.lbl', t('photoOptional')),
        h('div.photo-row', preview, h('label.btn.btn-ghost.sm', { for: 'foto', tabindex: '0', role: 'button', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } } }, icon('camera'), t('addPhoto')), removeBtn, fileIn)),
      photoErr),
    h('label.check', { for: 'menor' }, minor, h('span', t('minor'))),
    tutorRow,
    h('label.check', { for: 'consent' }, consent, h('span', t('consent'), ' ', h('a', { href: '#/privacidad' }, t('privacyPolicy')), ' ', t('consentTail'))),
    formErr,
    submit,
    h('p.register-alt', t('haveAccount'), h('br'), h('a.link', { href: '#/login' }, t('signIn'))),
    h('p.register-alt', h('a.link.soft', { href: '#/inicio' }, t('exploreFirst'))),
  );

  async function onSubmit(e) {
    e.preventDefault();
    Object.values(errs).forEach((x) => { x.textContent = ''; x.previousElementSibling?.querySelector('input,select')?.removeAttribute('aria-invalid'); });
    formErr.textContent = '';
    let bad = null;
    const mark = (id, msg) => { errs[id].textContent = msg; document.getElementById(id).setAttribute('aria-invalid', 'true'); bad = bad || id; };
    const n = nombres.value.trim(), a = apellidos.value.trim();
    if (!n) mark('nombres', t('required')); else if (!NAME_RE.test(n)) mark('nombres', '✗');
    if (!a) mark('apellidos', t('required')); else if (!NAME_RE.test(a)) mark('apellidos', '✗');
    if (!nac.value) mark('nacionalidad', t('required'));
    if (!consent.checked) { formErr.textContent = t('consent') + ' ' + t('privacyPolicy'); bad = bad || 'consent'; }
    if (minor.checked && !tutor.checked) { formErr.textContent = t('tutorConsent'); bad = bad || 'tutor'; }
    if (bad) { document.getElementById(bad)?.focus(); return; }
    submit.disabled = true;
    submit.firstChild.textContent = t('creating');
    try {
      await state.ensureGuest();
      await api('POST', '/pasaporte', { json: { nombres: n, apellidos: a, nacionalidad: nac.value, idioma: getLang(), consentimiento: true, menor_de_edad: minor.checked, consentimiento_tutor: tutor.checked } });
      if (photoFile) {
        const fd = new FormData();
        fd.append('foto', photoFile);
        if (minor.checked && tutor.checked) fd.append('consentimiento_tutor', '1');
        try { await api('POST', '/pasaporte/foto', { form: fd }); } catch (err) { toast(err.message, 'error'); }
      }
      await state.loadSession();
      await state.loadPassport(true);
      toast(t('createdOk'));
      navigate('/bienvenido', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.extra?.campo && errs[err.extra.campo]) mark(err.extra.campo, err.message);
      else formErr.textContent = err.message || t('errorGeneric');
      submit.disabled = false;
      submit.firstChild.textContent = t('createPassport');
    }
  }

  return h('div.page.welcome',
    h('div.welcome-hero',
      img('assets/fondos_texturas/fondo-bienvenida.webp', '', 'welcome-bg', { eager: true }),
      h('div.welcome-top', langToggle()),
      img('assets/personajes/atahualpa-guia.webp', 'Atahualpa', 'welcome-ata', { eager: true }),
      img('assets/personajes/delia-guia.webp', 'Delia', 'welcome-delia', { eager: true }),
      h('div.welcome-brand', brandBlock(null), h('p.welcome-tag', t('tagline'))),
    ),
    form,
    textile('welcome-band'),
  );
}
