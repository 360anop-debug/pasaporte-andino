// Iconografía de línea propia (trazos gruesos y redondeados como en las referencias). SVG estáticos y seguros.
const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h4.5v-5.5h4v5.5h4.5V10"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3.2"/><path d="M8.5 16.5h7"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.5" r="1.8"/><path d="m4 17.5 5-5 4 4 2.5-2.5 5 4"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 10v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4"/><path d="M5 14v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4"/>',
  back: '<path d="M15 5 8 12l7 7"/>', chevron: '<path d="m9 5 7 7-7 7"/>', chevrons: '<path d="m6 6 6 6-6 6M13 6l6 6-6 6"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>', bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>', filter: '<path d="M4 5h16l-6.2 7.4V19l-3.6 1.6v-8.2L4 5Z"/>',
  pin: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor"/>', pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>',
  headphones: '<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/>',
  book: '<path d="M12 6.5c-2-1.6-5-2-8.5-1.5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5-.1-8.5 1.5Z"/><path d="M12 6.5v13"/>',
  books: '<path d="M4 17.5 12 20l8-2.5M4 13.5 12 16l8-2.5M4 9.5 12 12l8-2.5L12 7 4 9.5Z"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/>',
  camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4.5c0 3 1.5 4.5 3.6 4.7M16 6h3.5c0 3-1.5 4.5-3.6 4.7M12 13v4M8.5 20h7M9.5 17h5v3h-5z"/>',
  hiker: '<circle cx="13" cy="4.5" r="1.8"/><path d="m11 8.5-2 6 3 2 1 4.5M11 8.5l3 1 1.5 3.5M9 14.5 7 20.5M14 9.5l2-2M17 9v11.5"/><path d="M9.6 8.2 7.3 7.4 6 11l2.4.9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.9 7.1-3.7M8.2 13.1l7.1 3.7"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>', globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
  idcard: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 15.5c.6-1.4 1.6-2 3-2s2.4.6 3 2M13.5 9.5h4.5M13.5 12.5h4.5"/>',
  star: '<path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7L12 3.8Z"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>', download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  text: '<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15 18l3-8 3 8M15.8 16h4.4"/>', compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  church: '<path d="M12 3v4M10.5 4.5h3M7 21v-9l5-4 5 4v9M3 21h18M5 21v-6l2-1.5M19 21v-6l-2-1.5M10.5 21v-4h3v4"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="m8.5 4 3.5 7 3.5-7M6 4h12"/><path d="m12 12.6.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3.9-1.8Z" fill="currentColor"/>',
  logout: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>', trash: '<path d="M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  fullscreen: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>', calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', mountain: '<path d="m2 19 7-11 4 6 2.5-3.5L22 19H2Z"/>',
  wave: '<path d="M3 15c3 0 3-3 6-3s3 3 6 3 3-3 6-3"/><path d="M8 4c-1 1.5 1 2.5 0 4M12 3.5c-1 1.5 1 2.5 0 4M16 4c-1 1.5 1 2.5 0 4"/>',
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>', mask: '<path d="M4 6c5 2 11 2 16 0v6c0 4-3.5 8-8 8s-8-4-8-8V6Z"/><path d="M8 11c1-.8 2-.8 3 0M13 11c1-.8 2-.8 3 0M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  bookmark: '<path d="M6.5 4h11v16l-5.5-4-5.5 4V4Z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1.2-1.2"/>',
};
export function icon(name, cls = '') {
  const s = document.createElement('span');
  s.className = 'ic ' + cls;
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
  return s;
}
export const flags = {
  es: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/></svg>',
  en: '<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="u"><path d="M0 0v30h60V0z"/></clipPath><g clip-path="url(#u)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
};
// Montañas doradas de la marca (encabezados de las referencias)
export const MOUNTAINS = '<svg viewBox="0 0 120 34" aria-hidden="true"><defs><linearGradient id="mg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#f2b631"/><stop offset="1" stop-color="#a8650c"/></linearGradient></defs><path d="M2 32 34 8l14 11L66 2l22 18 8-6 22 18h-9L96 19l-7 6L66 9 49 24 34 14 11 32Z" fill="url(#mg)" stroke="#5a1a10" stroke-width="1.2" stroke-linejoin="round"/></svg>';
