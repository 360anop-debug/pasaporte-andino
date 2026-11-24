// Comprobación de compatibilidad (script clásico, sintaxis ES5): si el motor web es demasiado antiguo
// (Android System WebView / Chromium < 88), se muestra un aviso claro en lugar de una pantalla en blanco.
(function () {
  var ok = !!(Element.prototype.replaceChildren && window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1 / 1') && window.AbortController);
  if (ok) return;
  window.__paIncompatible = true;
  var en = (navigator.language || '').slice(0, 2) === 'en';
  var app = document.getElementById('app');
  app.innerHTML = '';
  var box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;background:#5a0a24;color:#fff3dc;font-family:sans-serif';
  var h = document.createElement('h1'); h.style.color = '#f5c542';
  h.textContent = en ? 'Please update your web engine' : 'Actualiza el motor web de tu dispositivo';
  var p = document.createElement('p');
  p.textContent = en
    ? 'Pasaporte Andino needs a recent version of "Android System WebView" (or Chrome). Update it from Google Play and open the app again.'
    : 'Pasaporte Andino necesita una versión reciente de «Android System WebView» (o Chrome). Actualízala desde Google Play y vuelve a abrir la aplicación.';
  box.appendChild(h); box.appendChild(p); app.appendChild(box);
})();
