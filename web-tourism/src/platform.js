// Abstracción de plataforma: web, Android (Capacitor) y Windows (Electron).
// - Token de sesión: Android → plugin nativo PaSecure (EncryptedSharedPreferences/Keystore);
//   Windows → safeStorage de Electron (DPAPI) vía preload; Web → cookie HttpOnly (el JS nunca ve el token).
import { Capacitor, registerPlugin } from '@capacitor/core';

const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
const desktop = typeof window !== 'undefined' ? window.paDesktop : undefined;
export const TARGET = isAndroid ? 'android' : desktop ? 'windows' : 'web';

const PaSecure = isAndroid ? registerPlugin('PaSecure') : null;
const Share = isAndroid ? registerPlugin('Share') : null;
const AppPlugin = isAndroid ? registerPlugin('App') : null;

export const secure = {
  async get() {
    if (PaSecure) return (await PaSecure.get({ key: 'session' })).value || null;
    if (desktop) return desktop.secure.get();
    return null;
  },
  async set(v) {
    if (PaSecure) return PaSecure.set({ key: 'session', value: v });
    if (desktop) return desktop.secure.set(v);
  },
  async clear() {
    if (PaSecure) return PaSecure.remove({ key: 'session' });
    if (desktop) return desktop.secure.clear();
  },
};

/** Abre un enlace externo en el navegador del sistema (nunca dentro del contenedor). */
export function openExternal(url) {
  if (!/^https:\/\//.test(url) && !/^geo:/.test(url)) return;
  if (desktop) return desktop.openExternal(url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Compartir: hoja nativa en Android; Web Share API si existe; en Windows/escritorio menú propio
 * (copiar enlace, abrir Facebook en el navegador, descargar tarjeta). Nunca auto-publica.
 * @returns {Promise<'nativo'|'menu'|'cancelado'>}
 */
export async function shareNative({ title, text, url, files }) {
  try {
    if (Share) {
      await Share.share({ title, text, url, dialogTitle: title, files });
      return 'nativo';
    }
    if (TARGET === 'web' && navigator.share) {
      await navigator.share({ title, text, url });
      return 'nativo';
    }
  } catch (e) {
    if (String(e?.message || e).match(/cancel|abort/i)) return 'cancelado';
  }
  return 'menu';
}

export async function copyText(text) {
  if (desktop) return desktop.copyText(text);
  await navigator.clipboard.writeText(text);
}

export async function saveBlob(blob, filename) {
  if (desktop) return desktop.saveFile(filename, new Uint8Array(await blob.arrayBuffer()));
  if (isAndroid) {
    // En Android se comparte el archivo con la hoja nativa (Guardar en Fotos/Drive/etc.).
    const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    const PaFiles = registerPlugin('PaSecure');
    const { uri } = await PaFiles.writeCache({ name: filename, base64: b64 });
    await Share.share({ title: filename, files: [uri] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function onBackButton(handler) {
  if (AppPlugin) AppPlugin.addListener('backButton', handler);
}

export function exitApp() {
  if (AppPlugin) AppPlugin.exitApp();
}
