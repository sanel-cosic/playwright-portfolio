import { test, expect } from '../../fixtures';

/**
 * Shows Playwright's network control – something that needs a proxy tool
 * (or isn't possible at all) with plain Selenium.
 */
test.describe('Network control', () => {
  test('page still works when product images are blocked', async ({ page, inventoryPage }) => {
    let blocked = 0;
    await page.route(/\.(png|jpe?g|svg|webp)$/, (route) => {
      blocked++;
      return route.abort();
    });

    await inventoryPage.goto();

    expect(blocked).toBeGreaterThan(0);
    await expect(inventoryPage.items).toHaveCount(6); // content doesn't depend on images
  });

  test('no console errors on the inventory page', async ({ page, inventoryPage }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      // GitHub Pages has no /inventory.html file: the document itself 404s, then the
      // SPA fallback redirects via /?/inventory.html. Ignore only that one 404.
      const isSpaFallback404 =
        msg.text().includes('404') && msg.location().url.endsWith('/inventory.html');
      if (!isSpaFallback404) errors.push(msg.text());
    });

    await inventoryPage.goto();

    // SauceDemo is known to log some third-party noise; keep only app errors.
    const appErrors = errors.filter((e) => !/backtrace|events\.|net::ERR/i.test(e));
    expect(appErrors).toEqual([]);
  });
});
