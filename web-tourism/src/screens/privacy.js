import { h, innerHeader } from '../ui.js';
import { getLang, t } from '../i18n.js';

const ES = [
  ['Responsable', 'Cultura Educa 360 — edición turística Pasaporte Andino. (Datos de contacto del responsable: completar por el propietario antes de publicar.)'],
  ['Datos que tratamos', 'Nombre(s), apellido(s), nacionalidad, idioma, foto opcional del pasaporte, fotos opcionales del álbum, visitas verificadas, sellos, monedas simbólicas y progreso de lectura. NO solicitamos DNI ni documentos de identidad.'],
  ['Finalidad', 'Emitir tu Pasaporte Andino digital, registrar tus visitas verificadas y mostrar tu progreso. No se publican tus datos ni se usan con fines comerciales.'],
  ['Menores de edad', 'Si declaras ser menor de edad, se requiere la autorización de tu madre, padre o tutor. Tus fotos son siempre privadas.'],
  ['Fotos', 'Las fotos se re-codifican eliminando metadatos (incluida la ubicación GPS), se guardan de forma privada y solo tú puedes verlas. Puedes borrarlas cuando quieras.'],
  ['QR del pasaporte', 'Contiene un identificador aleatorio que solo permite comprobar que el pasaporte es auténtico; no contiene tus datos personales.'],
  ['Tus derechos', 'Puedes descargar tus datos y eliminar tu cuenta desde la aplicación (Mi Pasaporte y Ajustes).'],
  ['Monedas Andinas', 'Son simbólicas: no tienen valor monetario, no son canjeables por dinero ni transferibles.'],
];
const EN = [
  ['Controller', 'Cultura Educa 360 — Andean Passport tourism edition. (Controller contact details: to be completed by the owner before publishing.)'],
  ['Data we process', 'First and last names, nationality, language, optional passport photo, optional album photos, verified visits, stamps, symbolic coins and reading progress. We do NOT request national ID numbers or identity documents.'],
  ['Purpose', 'To issue your digital Andean Passport, record your verified visits and show your progress. Your data is not published or used for commercial purposes.'],
  ['Minors', 'If you declare you are under 18, authorisation from a parent or guardian is required. Your photos are always private.'],
  ['Photos', 'Photos are re-encoded removing metadata (including GPS location), stored privately and visible only to you. You can delete them at any time.'],
  ['Passport QR', 'It contains a random identifier that only allows checking that the passport is authentic; it does not contain your personal data.'],
  ['Your rights', 'You can download your data and delete your account from the app (My Passport and Settings).'],
  ['Andean Coins', 'They are symbolic: they have no monetary value and cannot be exchanged for money or transferred.'],
];
export default async function privacy() {
  const rows = getLang() === 'en' ? EN : ES;
  return h('div.page.page-burgundy', innerHeader({ title: t('privacy'), iconName: 'lock', backTo: '/inicio' }),
    h('div.pad', h('article.card.pad-card.stack', rows.map(([a, b]) => h('section', h('h2.title-ink.small', a), h('p', b))))));
}
