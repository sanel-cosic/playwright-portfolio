/**
 * Test data and helpers for the nIT site (v2, QAP-4).
 * Texts are the Bosnian (default) UI copy; the language tests cover the rest.
 * No prices, ranges or formulas live here: tests read those from the page.
 */

/** Home page services tablist: tab name (bs), panel id suffix and the hash the tab writes. */
export const serviceTabs = [
  { name: 'Web i katalozi proizvoda', panel: 'web', hash: null },
  { name: 'PC i mobilne aplikacije', panel: 'apps', hash: 'aplikacije' },
  { name: 'Poslovni proračuni i analize', panel: 'production', hash: 'proizvodnja' },
  { name: 'Eksterni IT saradnik', panel: 'external', hash: 'it-podrska' },
] as const;
export type ServicePanel = (typeof serviceTabs)[number]['panel'];

/**
 * Languages of the home page. hr reuses the Bosnian strings on purpose (observed),
 * so only html lang, pressed state and the summary label differ from bs.
 */
export const nitLanguages = [
  {
    button: 'Bosanski', code: 'bs', htmlLang: 'bs',
    h1: 'Web stranice i aplikacije. Alati za vaš posao.',
    summary: 'Jezik i pismo: Bosanski',
  },
  {
    button: 'Hrvatski', code: 'hr', htmlLang: 'hr',
    h1: 'Web stranice i aplikacije. Alati za vaš posao.',
    summary: 'Jezik i pismo: Hrvatski',
  },
  {
    button: 'Српски', code: 'sr', htmlLang: 'sr-Cyrl',
    h1: 'Веб странице и апликације. Алати за ваш посао.',
    summary: 'Језик и писмо: Српски',
  },
  {
    button: 'English', code: 'en', htmlLang: 'en',
    h1: 'Websites and applications. Tools for your business.',
    summary: 'Language and script: English',
  },
  {
    button: 'Deutsch', code: 'de', htmlLang: 'de',
    h1: 'Websites und Anwendungen. Werkzeuge für Ihren Betrieb.',
    summary: 'Sprache und Schrift: Deutsch',
  },
] as const;
export type NitLanguageCode = (typeof nitLanguages)[number]['code'];

/** The six linked business-system pages, in flow order. */
export const businessSteps = [
  { slug: 'kalkulacija', number: '01', label: 'Kalkulacija i ponuda' },
  { slug: 'materijal', number: '02', label: 'Materijal i nabavka' },
  { slug: 'plan', number: '03', label: 'Plan proizvodnje' },
  { slug: 'proizvodnja', number: '04', label: 'Rad i zastoji' },
  { slug: 'kvalitet', number: '05', label: 'Kvalitet i dorada' },
  { slug: 'pregled', number: '06', label: 'Pregled firme' },
] as const;
export type BusinessSlug = (typeof businessSteps)[number]['slug'];

/** Title on the steps 02–05 while no quote is accepted. */
export const lockedStepTitle = 'Najprije pripremite i prihvatite ponudu.';

/** Orders shipped with the demo data; accepting the seed quote appends RN-2609 (index 8). */
export const seededOrders = [
  'RN-2601', 'RN-2602', 'RN-2603', 'RN-2604', 'RN-2605', 'RN-2606', 'RN-2607', 'RN-2608',
] as const;
export const newOrder = { id: 'RN-2609', index: 8 } as const;

/** localStorage key of the business-system state. */
export const businessStateKey = 'nit-business-system-v1';

/** Configurator models in display order (no prices or ranges: read them from the page). */
export const configuratorModels = ['Solo', 'Duo', 'Panorama', 'Linea', 'Luma', 'Luma Plus'] as const;
export type ConfiguratorModel = (typeof configuratorModels)[number];

/**
 * Parses numbers the way the site prints them (de-DE style):
 * "9.297,60 KM" → 9297.6, "248 (+8)" → 248, "77,8%" → 77.8
 */
export function parseLocalNumber(text: string | null): number {
  const match = (text ?? '').match(/-?\d[\d.]*(?:,\d+)?/);
  if (!match) throw new Error(`No number in "${text}"`);
  return Number(match[0].replace(/\./g, '').replace(',', '.'));
}

/** All numbers in a text, e.g. "3.245 KM / 3.366 KM" → [3245, 3366], "5 / 100" → [5, 100]. */
export function parseLocalNumbers(text: string | null): number[] {
  return [...(text ?? '').matchAll(/\d[\d.]*(?:,\d+)?/g)].map(m =>
    Number(m[0].replace(/\./g, '').replace(',', '.')),
  );
}

/** Parses an estimated finish like "27.11.2026. · 11:30" into a Date (local time). */
export function parseFinish(text: string | null): Date {
  const m = (text ?? '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s*·\s*(\d{1,2}):(\d{2})/);
  if (!m) throw new Error(`No date/time in "${text}"`);
  const [, d, mo, y, h, mi] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi);
}
