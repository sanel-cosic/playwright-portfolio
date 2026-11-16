// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import { nitLanguages } from '../../utils/nitData';

const de = nitLanguages.find(l => l.code === 'de')!;
const en = nitLanguages.find(l => l.code === 'en')!;
const hr = nitLanguages.find(l => l.code === 'hr')!;
const sr = nitLanguages.find(l => l.code === 'sr')!;

/** Per-language JS-generated copy (hr and bs share the Bosnian strings, so they are not listed). */
const translated = [
  {
    ...en,
    tabs: ['Websites and product catalogues', 'Desktop and mobile applications', 'Business calculations and analysis', 'External IT partner'],
    tablists: ['Services', 'Projects', 'App screens'],
    title: 'nIT — Websites, applications and business systems' as string | undefined,
  },
  {
    ...de,
    tabs: ['Websites und Produktkataloge', 'PC- und mobile Anwendungen', 'Betriebliche Kalkulationen und Analysen', 'Externer IT-Partner'],
    tablists: ['Leistungen', 'Projekte', 'App-Ansichten'],
    title: 'nIT — Websites, Anwendungen und Geschäftssysteme' as string | undefined,
  },
  {
    ...sr,
    tabs: ['Веб и каталози производа', 'ПЦ и мобилне апликације', 'Пословни прорачуни и анализе', 'Екстерни ИТ сарадник'],
    tablists: ['Услуге', 'Пројекти', 'Екрани апликације'],
    title: undefined as string | undefined,
  },
];

test.describe('QAP-7 Language switcher', () => {
  test('default language is Bosanski @smoke', async ({ nitHome }) => {
    // 1. Fresh context, open the home page without a query and open the flag menu
    await nitHome.goto();
    await nitHome.openLanguageMenu();

    expect(await nitHome.htmlLang()).toBe('bs');
    await expect(nitHome.heading).toHaveAccessibleName(nitLanguages[0].h1);
    await expect(nitHome.languageToggle).toHaveAttribute('aria-label', 'Jezik i pismo: Bosanski');
    for (const lang of nitLanguages) {
      await expect(nitHome.languageButton(lang.button)).toHaveAttribute(
        'aria-pressed',
        String(lang.code === 'bs'),
      );
    }
  });

  for (const lang of nitLanguages) {
    test(`${lang.button} button translates heading, html lang and pressed state @smoke`, async ({ nitHome, page }) => {
      // 1. Choose the language via the flag menu
      await nitHome.goto();
      await nitHome.chooseLanguage(lang.button);

      // hr reuses the Bosnian strings (observed), so only lang/pressed/summary differ there
      await expect(nitHome.heading).toHaveAccessibleName(lang.h1);
      await expect(page.locator('html')).toHaveAttribute('lang', lang.htmlLang);
      await expect(nitHome.languageToggle).toHaveAttribute('aria-label', lang.summary);
      await nitHome.openLanguageMenu();
      for (const other of nitLanguages) {
        await expect(nitHome.languageButton(other.button)).toHaveAttribute(
          'aria-pressed',
          String(other.code === lang.code),
        );
      }
      await expect(page).toHaveURL(new RegExp(`[?&]lang=${lang.code}`));
      expect(await page.evaluate(() => localStorage.getItem('nit-language'))).toBe(lang.code);
    });
  }

  test('language choice survives a reload without query', async ({ nitHome, page }) => {
    // 1. Choose Deutsch, then open / without a query
    await nitHome.goto();
    await nitHome.chooseLanguage(de.button);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(nitHome.heading).toHaveAccessibleName(de.h1);
    await nitHome.openLanguageMenu();
    await expect(nitHome.languageButton(de.button)).toHaveAttribute('aria-pressed', 'true');
  });

  test('?lang= overrides the stored language', async ({ nitHome, page }) => {
    // 1. Choose Deutsch (stored), then open /?lang=en
    await nitHome.goto();
    await nitHome.chooseLanguage(de.button);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await page.goto('/?lang=en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(nitHome.heading).toHaveAccessibleName(en.h1);
    await nitHome.openLanguageMenu();
    await expect(nitHome.languageButton(en.button)).toHaveAttribute('aria-pressed', 'true');
    await expect(nitHome.languageButton(de.button)).toHaveAttribute('aria-pressed', 'false');
  });

  test('?lang=hr preselects Hrvatski on a fresh context', async ({ nitHome, page }) => {
    // 1. Open /?lang=hr without any stored language
    await nitHome.goto('?lang=hr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    await expect(nitHome.languageToggle).toHaveAttribute('aria-label', hr.summary);
    await nitHome.openLanguageMenu();
    await expect(nitHome.languageButton(hr.button)).toHaveAttribute('aria-pressed', 'true');
  });

  for (const lang of translated) {
    test(`JS-generated tab names and the menu summary are announced in ${lang.button}`, async ({ nitHome, page }) => {
      // 1. Choose the language, then read the tab names, tablist names and summary label
      await nitHome.goto();
      await nitHome.chooseLanguage(lang.button);
      await expect(page.locator('html')).toHaveAttribute('lang', lang.htmlLang);

      await expect(nitHome.serviceTabs.getByRole('tab')).toHaveText(lang.tabs);
      // The services tablist is located structurally (its German name was not read before)
      await expect(nitHome.serviceTabs).toHaveAccessibleName(lang.tablists[0]);
      await expect(page.getByRole('tablist', { name: lang.tablists[1], exact: true })).toBeVisible();
      // The app-screens tablist sits in a hidden panel, so the role query must include hidden elements
      await expect(
        page.getByRole('tablist', { name: lang.tablists[2], exact: true, includeHidden: true }),
      ).toBeAttached();
      await expect(nitHome.languageToggle).toHaveAttribute('aria-label', lang.summary);
      if (lang.title) await expect(page).toHaveTitle(lang.title);
    });
  }

  for (const lang of nitLanguages) {
    test(`production step links carry the ${lang.button} language to the business system`, async ({ nitHome }) => {
      // 1. Choose the language, open the third service tab ("Poslovni proračuni i analize")
      await nitHome.goto();
      await nitHome.chooseLanguage(lang.button);
      await expect(nitHome.heading).toHaveAccessibleName(lang.h1);
      await nitHome.serviceTabs.getByRole('tab').nth(2).click();
      await expect(nitHome.servicePanel('production')).toBeVisible();

      // Observed: the business system only offers bs/en/de, so hr and sr keep ?lang=bs
      const linkLang = lang.code === 'hr' || lang.code === 'sr' ? 'bs' : lang.code;
      await expect(nitHome.productionSteps).toHaveCount(6);
      for (const step of await nitHome.productionSteps.all()) {
        await expect(step).toHaveAttribute('href', new RegExp(`\\.html\\?lang=${linkLang}$`));
      }
    });
  }

  for (const lang of [en, de]) {
    test(`business page opened from the home page is shown in ${lang.button}`, async ({ nitHome, quotePage, page }) => {
      // 1. Choose the language, open the third service tab, click step 01
      await nitHome.goto();
      await nitHome.chooseLanguage(lang.button);
      await nitHome.serviceTabs.getByRole('tab').nth(2).click();
      await expect(nitHome.servicePanel('production')).toBeVisible();
      await nitHome.productionStep('01').click();

      // 2. On the business page the flag menu offers the three business languages
      await expect(page).toHaveURL(new RegExp(`/poslovni-sistem/kalkulacija.*lang=${lang.code}`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang.code);
      await expect(quotePage.heading).not.toHaveAccessibleName('Kalkulacija i ponuda');
      if (lang.code === 'de') {
        await expect(page.getByRole('navigation', { name: 'Ein Auftrag von Anfang bis Ende' })).toBeVisible();
      }
      await quotePage.openLanguageMenu();
      for (const [name, code] of [['Bosanski', 'bs'], ['English', 'en'], ['Deutsch', 'de']] as const) {
        await expect(quotePage.languageLink(name)).toHaveAttribute('href', new RegExp(`kalkulacija\\.html\\?lang=${code}`));
      }
      // Possible bug (not asserted): the summary aria-label stays "Jezik" in every language
    });
  }
});
