// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';

test.describe('QAP-5 Home shell', () => {
  test('page title and heading identify the site @smoke', async ({ nitHome, page }) => {
    // 1. nitHome.goto('?lang=bs'). Read page title and the h1
    await nitHome.goto('?lang=bs');

    await expect(page).toHaveTitle('nIT — Web stranice, aplikacije i poslovni sistemi');
    // The <em> part is a block child, so assert the accessible name instead of the text
    await expect(nitHome.heading).toHaveAccessibleName(/Web stranice i aplikacije\.\s*Alati za vaš posao\./);
    await expect(nitHome.projectsLink).toBeVisible();
    await expect(nitHome.contactButton).toBeVisible();
  });

  test('page loads without script errors or own failed requests', async ({ nitHome, page }) => {
    // 1. Attach listeners before goto, load the page and select each service tab once
    const pageErrors: string[] = [];
    const failedOwnRequests: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
      // Third-party hosts (kjtools.ba, bih.uganjaj.ba) are out of scope; 307 redirects are fine
      if (new URL(response.url()).hostname === 'nit.uganjaj.ba' && response.status() >= 400) {
        failedOwnRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await nitHome.goto('?lang=bs');
    for (const name of [
      'Web i katalozi proizvoda',
      'PC i mobilne aplikacije',
      'Poslovni proračuni i analize',
      'Eksterni IT saradnik',
    ] as const) {
      await nitHome.openService(name);
    }

    expect(pageErrors).toEqual([]);
    expect(failedOwnRequests).toEqual([]);
  });

  test('skip link moves to the main content', async ({ nitHome, page }) => {
    await nitHome.goto('?lang=bs');

    // 1. Press Tab once on a fresh load; press Enter on the skip link
    await page.keyboard.press('Tab');
    await expect(nitHome.skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/#sadrzaj$/);
    await expect(nitHome.main).toBeInViewport();
  });

  test('Projekti link scrolls to the projects section', async ({ nitHome, page }) => {
    await nitHome.goto('?lang=bs');

    // 1. Click nav link 'Projekti'
    await nitHome.projectsLink.click();

    await expect(page).toHaveURL(/#projekti$/);
    await expect(nitHome.projectsSection).toBeInViewport();
    await expect(nitHome.serviceTab('Web i katalozi proizvoda')).toHaveAttribute('aria-selected', 'true');
  });

  test('animation toggle pauses and resumes', async ({ nitHome }) => {
    await nitHome.goto('?lang=bs');

    // 1. Locate the animation toggle: it starts running
    await expect(nitHome.animationToggle).toHaveAccessibleName('Pauziraj animaciju');
    await expect(nitHome.animationToggle).toHaveAttribute('aria-pressed', 'false');

    // First click pauses
    await nitHome.animationToggle.click();
    await expect(nitHome.animationToggle).toHaveAccessibleName('Pokreni animaciju');
    await expect(nitHome.animationToggle).toHaveAttribute('aria-pressed', 'true');

    // Second click resumes
    await nitHome.animationToggle.click();
    await expect(nitHome.animationToggle).toHaveAccessibleName('Pauziraj animaciju');
    await expect(nitHome.animationToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test.describe('narrow viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    const pages = [
      '/?lang=bs',
      '/konfigurator.html?lang=bs',
      '/poslovni-sistem/kalkulacija.html?lang=bs',
      '/poslovni-sistem/materijal.html?lang=bs',
      '/poslovni-sistem/plan.html?lang=bs',
      '/poslovni-sistem/proizvodnja.html?lang=bs',
      '/poslovni-sistem/kvalitet.html?lang=bs',
      '/poslovni-sistem/pregled.html?lang=bs',
    ];

    for (const url of pages) {
      test(`no horizontal scroll at 390x844 on ${url}`, async ({ page }) => {
        // 1. Load the page, wait for the heading, compare scrollWidth with innerWidth
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
});
