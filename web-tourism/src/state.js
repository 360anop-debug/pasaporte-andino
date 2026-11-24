// Estado de sesión y preferencias locales (no sensibles).
import { api, setToken, clearPrivateCache, forgetImage } from './api.js';
import { getLang } from './i18n.js';

export const prefs = (() => {
  let p = {};
  try { p = JSON.parse(localStorage.getItem('pa-prefs') || '{}'); } catch { /* */ }
  return Object.assign({ reduceMotion: false, muteGuides: false }, p);
})();
export function savePrefs() {
  try { localStorage.setItem('pa-prefs', JSON.stringify(prefs)); } catch { /* */ }
  document.documentElement.classList.toggle('reduce-motion', !!prefs.reduceMotion);
}

export const state = {
  session: null, // {autenticado, invitado, tiene_pasaporte}
  passport: null,
  progress: null,
  async loadSession() {
    try { this.session = await api('GET', '/auth/sesion'); } catch (e) { this.session = this.session || { autenticado: false, error: e }; }
    return this.session;
  },
  async loadPassport(force = false) {
    if (this.passport && !force) return this.passport;
    this.passport = await api('GET', '/pasaporte');
    return this.passport;
  },
  async loadProgress() {
    this.progress = await api('GET', '/pasaporte/progreso');
    return this.progress;
  },
  hasPassport() { return !!this.session?.tiene_pasaporte; },
  async ensureGuest() {
    if (this.session?.autenticado) return;
    const r = await api('POST', '/auth/invitado');
    if (r.token) await setToken(r.token);
    await this.loadSession();
  },
  async logout() {
    try { await api('POST', '/auth/logout'); } catch { /* */ }
    await setToken(null);
    this.session = { autenticado: false };
    this.passport = null;
    this.progress = null;
    clearPrivateCache();
    forgetImage('/');
  },
  syncLang() {
    if (state.session?.tiene_pasaporte) api('PATCH', '/pasaporte', { json: { idioma: getLang() } }).catch(() => {});
  },
  unseenNews() {
    const seen = Number(localStorage.getItem('pa-news-seen') || 0);
    return Number(localStorage.getItem('pa-news-latest') || 0) > seen ? 1 : 0;
  },
};
