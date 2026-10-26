import { test, expect } from '../../fixtures';
import { nitNavigation } from '../../utils/nitData';

test.describe('nIT home page', () => {
  test('loads with title and main heading @smoke', async ({ page, nitHome }) => {
    await nitHome.goto();

    await expect(page).toHaveTitle('nIT — Web stranice i poslovni alati.');
    // The heading contains a <br>, so check the accessible name (what screen readers announce)
    await expect(nitHome.heading).toHaveAccessibleName('Od prvog klika do završenog posla.');
  });

  // Data-driven: every nav link must point at a section that exists on the page
  for (const { link, section } of nitNavigation) {
    test(`nav link "${link}" scrolls to its section`, async ({ page, nitHome }) => {
      await nitHome.goto();

      await nitHome.navLink(link).click();

      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      await expect(page.locator(`#${section}`)).toBeInViewport();
    });
  }

  test('hero process switch shows one step at a time', async ({ nitHome }) => {
    await nitHome.goto();
    await expect(nitHome.processButton('Kalkulacija')).toHaveAttribute('aria-pressed', 'true');

    await nitHome.processButton('Plan').click();

    await expect(nitHome.processButton('Plan')).toHaveAttribute('aria-pressed', 'true');
    await expect(nitHome.processButton('Kalkulacija')).toHaveAttribute('aria-pressed', 'false');
    await expect(nitHome.processButton('Pregled')).toHaveAttribute('aria-pressed', 'false');
    await expect(nitHome.processDetail).toContainText('Lista naloga postaje plan rada.');
  });

  test('animation can be paused and resumed', async ({ nitHome }) => {
    await nitHome.goto();
    await expect(nitHome.motionToggle).toHaveText('Pauziraj animaciju');

    await nitHome.motionToggle.click();
    await expect(nitHome.motionToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(nitHome.motionToggle).toHaveText('Pokreni animaciju');

    await nitHome.motionToggle.click();
    await expect(nitHome.motionToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('page loads without script errors or broken own resources', async ({ page, nitHome, baseURL }) => {
    const scriptErrors: string[] = [];
    const brokenResources: string[] = [];
    page.on('pageerror', (error) => scriptErrors.push(error.message));
    page.on('response', (response) => {
      // Only the site's own files – third-party hiccups are not this app's bug
      if (response.url().startsWith(baseURL!) && response.status() >= 400) {
        brokenResources.push(`${response.status()} ${response.url()}`);
      }
    });

    await nitHome.goto();
    await page.waitForLoadState('networkidle');

    expect(scriptErrors).toEqual([]);
    expect(brokenResources).toEqual([]);
  });

  test('has no horizontal scrolling on a phone-sized screen', async ({ page, nitHome }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await nitHome.goto();

    const { scrollWidth, viewportWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
