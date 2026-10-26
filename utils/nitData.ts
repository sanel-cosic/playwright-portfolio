/**
 * Test data and helpers for the nIT business-tools site.
 * Texts are the Bosnian (default) UI copy; the language tests cover the rest.
 */

/** The five interactive demo tools, keyed by the id used in the page's markup. */
export const nitTools = {
  quote: '01 Kalkulacija proizvodnje',
  plan: '02 Planiranje proizvodnje',
  orders: '03 Pregled naloga',
  stock: '04 Zalihe i nabavka',
  efficiency: '05 Učinak radnika',
} as const;
export type NitTool = keyof typeof nitTools;

/** Main navigation: link text → id of the section it should scroll to. */
export const nitNavigation = [
  { link: 'Usluge', section: 'ponuda' },
  { link: 'Kako radimo', section: 'pristup' },
  { link: 'Naši proizvodi', section: 'proizvodi' },
  { link: 'Web stranice', section: 'web' },
  { link: 'Razgovarajmo ↗', section: 'kontakt' },
] as const;

/** Main heading per language, plus the value expected in <html lang>. */
export const nitLanguages = [
  { button: 'English', code: 'en', htmlLang: 'en', h1: 'From the first click to the job done.' },
  { button: 'Deutsch', code: 'de', htmlLang: 'de', h1: 'Vom ersten Klick bis zum fertigen Ergebnis.' },
  { button: 'Српски', code: 'sr', htmlLang: 'sr-Cyrl', h1: 'Од првог клика до завршеног посла.' },
  { button: 'Bosanski', code: 'bs', htmlLang: 'bs', h1: 'Od prvog klika do završenog posla.' },
] as const;

/** The demo order list ships with 18 fictional orders, 5 shown per page. */
export const demoOrders = { total: 18, pageSize: 5, perCell: { 'Ćelija A': 7, 'Ćelija B': 6, 'Ćelija C': 5 } };

/** Stock items: accessible input name, unit and the reorder minimum. */
export const stockItems = {
  aluminium: { input: 'Dostupno Aluminij Ø40', unit: 'kg', min: 50 },
  steel: { input: 'Dostupno Čelik C45 Ø25', unit: 'kg', min: 30 },
  inserts: { input: 'Dostupno Rezne pločice', unit: 'kom', min: 20 },
} as const;

/**
 * Parses numbers the way the site prints them (de-DE style):
 * "9.297,60 KM" → 9297.6, "248 (+8)" → 248, "77,8%" → 77.8
 */
export function parseLocalNumber(text: string | null): number {
  const match = (text ?? '').match(/-?[\d.]+(?:,\d+)?/);
  if (!match) throw new Error(`No number in "${text}"`);
  return Number(match[0].replace(/\./g, '').replace(',', '.'));
}
