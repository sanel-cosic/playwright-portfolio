// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';

test.describe('QAP-5 Contact dialog', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto('?lang=bs');
  });

  test('Kontakt button opens the contact dialog @smoke', async ({ nitHome, contactDialog }) => {
    // 1. Click the nav button 'Kontakt ↗'
    await contactDialog.open(nitHome.contactButton);

    // Contact details are deliberately not asserted
    await expect(contactDialog.heading).toBeVisible();
    await expect(contactDialog.closeButton).toBeVisible();
    await expect(contactDialog.copyButton).toBeVisible();
  });

  for (const how of ['button', 'Escape'] as const) {
    test(`contact dialog closes via ${how}`, async ({ nitHome, contactDialog }) => {
      // 1. Open the dialog from the nav, then close it
      await contactDialog.open(nitHome.contactButton);

      if (how === 'button') {
        await contactDialog.closeWithButton();
      } else {
        await contactDialog.closeWithEscape();
      }
      await expect(contactDialog.root).toBeHidden();
    });
  }

  test('external IT partner trigger shows the context line', async ({ nitHome, contactDialog }) => {
    // 1. The trigger is in a hidden panel: select the tab first
    await nitHome.openService('Eksterni IT saradnik');
    await contactDialog.open(nitHome.partnerContactButton);

    await expect(contactDialog.context).toBeVisible();
    await expect(contactDialog.context).toHaveText('Eksterni IT saradnik');
  });

  test('configurator trigger shows the context line', async ({ nitHome, contactDialog }) => {
    // 1. Scroll to the configurator section and click the trigger
    await nitHome.configuratorSection.scrollIntoViewIfNeeded();
    await contactDialog.open(nitHome.configuratorContactButton);

    await expect(contactDialog.context).toBeVisible();
    await expect(contactDialog.context).toHaveText('Konfigurator i priprema proizvodnje');
  });

  test('nav trigger shows no context line and clears a previous one', async ({ nitHome, contactDialog }) => {
    // 1. Open via the partner trigger, close with Escape
    await nitHome.openService('Eksterni IT saradnik');
    await contactDialog.open(nitHome.partnerContactButton);
    await expect(contactDialog.context).toHaveText('Eksterni IT saradnik');
    await contactDialog.closeWithEscape();

    // Then open via the nav
    await contactDialog.open(nitHome.contactButton);

    await expect(contactDialog.context).toBeHidden();
    await expect(contactDialog.context).toBeEmpty();
  });

  test('copying the e-mail address gives feedback', async ({ nitHome, contactDialog, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium-only');
    // Without clipboard permission the page falls back to showing the address
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. Open the dialog from the nav, click 'Kopiraj email adresu'
    await contactDialog.open(nitHome.contactButton);
    await contactDialog.copyButton.click();

    await expect(contactDialog.copyFeedback).toHaveText('Email adresa kopirana.');
  });

  test('copied e-mail address is placed on the clipboard', async ({ nitHome, contactDialog, context, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. Open the dialog, copy, read the clipboard (only its shape, not the address)
    await contactDialog.open(nitHome.contactButton);
    await contactDialog.copyButton.click();
    await expect(contactDialog.copyFeedback).toHaveText('Email adresa kopirana.');

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('@');
  });
});
