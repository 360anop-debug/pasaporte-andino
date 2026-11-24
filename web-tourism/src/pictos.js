// Pictogramas de cada territorio tomados de las referencias aprobadas 06 (sellos) y 07 (monedas),
// para los territorios sin arte específico en el Kit Maestro. SVG estáticos (viewBox 0 0 100 70), trazo currentColor.
const IGLESIA = '<path d="M50 6v10M45 11h10M30 64V38l20-16 20 16v26M20 64h60M24 64V46l6-6M76 64V46l-6-6M44 64V50a6 6 0 0 1 12 0v14"/><circle cx="50" cy="34" r="4"/>';
export const PICTOS = {
  chota: IGLESIA,
  contumaza: IGLESIA,
  cutervo: '<path d="M14 18c10-8 22-8 30 0 8-8 22-8 30 0 6-4 12-4 16 0"/><path d="M34 18v40M42 18v42M50 18v38M58 18v42M66 18v40"/><path d="M18 64c10-6 22-6 32 0s22 6 32 0"/><path d="M10 30 26 22M90 30 74 22"/>',
  jaen: '<ellipse cx="38" cy="44" rx="11" ry="15" transform="rotate(-25 38 44)"/><path d="M33 33c6 6 6 16 10 22"/><ellipse cx="62" cy="40" rx="11" ry="15" transform="rotate(20 62 40)"/><path d="M58 28c-4 8-2 16 6 24"/><path d="M50 10c10 2 18 10 18 20M50 10c-10 2-18 10-18 20M50 10v12"/>',
  'san-marcos': '<path d="M10 62h80M16 62V34h14v28M36 62V26h28v36M70 62V38h14v24"/><path d="M36 26v-6h6v6M46 26v-6h8v6M58 26v-6h6v6M16 34v-5h5v5M25 34v-5h5v5"/><path d="M44 62V48h12v14M40 36h20M40 44h20"/>',
  'san-ignacio': '<path d="M6 40 24 22l14 14 14-18 18 18 10-8 14 12"/><path d="M8 52c14-6 28 6 42 0s28 6 42 0M14 62c12-4 24 4 36 0s24 4 36 0"/><circle cx="76" cy="16" r="5"/>',
  'san-miguel': '<path d="M6 62 30 22l12 16 14-24 26 48Z"/><path d="M24 32l6-10 6 8M50 22l6-8 6 10"/><path d="M14 62c10-6 20-6 30 0"/>',
  hualgayoc: '<path d="M22 64 66 20M78 64 34 20"/><path d="M54 12c10 0 20 6 24 14l-8 2M46 12c-10 0-20 6-24 14l8 2"/>',
  'santa-cruz': '<path d="M50 66V38M50 46l-12-8M50 42l12-10M44 66h12"/><path d="M50 8c14 0 28 8 28 20 0 8-8 14-18 14H40c-10 0-18-6-18-14 0-12 14-20 28-20Z"/>',
  cajabamba: '<path d="M6 62 28 26l14 18 16-28 36 46Z"/><path d="M58 16l6 10M28 26l6 8"/>',
  'san-pablo': '<path d="M8 62 32 24l14 16 12-14 34 36Z"/><circle cx="72" cy="18" r="6"/>',
  _defecto: '<path d="M6 62 30 22l12 16 14-24 26 48Z"/>',
};
export const picto = (slug) => PICTOS[slug] || PICTOS._defecto;
