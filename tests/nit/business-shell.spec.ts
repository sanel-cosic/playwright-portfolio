// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts

import { test, expect } from '../../fixtures';
import { newOrder, seededOrders } from '../../utils/nitData';

test.describe('QAP-9 Business system shell', () => {
  test('fresh browser: steps 02-05 are locked, 01 and 06 open @smoke', async ({ quotePage }) => {
    // 1. quotePage.goto(). Read nav 'Tok jednog naloga'.
    await quotePage.goto();
    await expect(quotePage.stepNav).toBeVisible();

    await test.step('steps 01 and 06 are links with an href, 01 is the current page', async () => {
      await expect(quotePage.step('Kalkulacija i ponuda')).toHaveAttribute('href', /kalkulacija\.html\?lang=bs/);
      await expect(quotePage.step('Kalkulacija i ponuda')).toHaveAttribute('aria-current', 'page');
      await expect(quotePage.step('Pregled firme')).toHaveAttribute('href', /pregled\.html\?lang=bs/);
    });

    await test.step('steps 02-05 are disabled and have no href', async () => {
      // Observed: the lock exists only on page 01; opening 02-05 by URL shows every step open.
      // That bypass is documented in the plan, not tested as a failure.
      await quotePage.expectLocked();
    });

    await test.step('locked steps are not links in the accessibility tree', async () => {
      await expect(quotePage.stepNav.getByRole('link')).toHaveCount(2);
    });
  });

  test('accepting a quote unlocks steps 02-05 and marks the current step @smoke', async ({
    page,
    quotePage,
    acceptedQuote,
  }) => {
    // 1. Use the helper acceptQuote(): preview -> save -> accept (done by the acceptedQuote fixture).
    expect(acceptedQuote.id).toBe(newOrder.id);

    await test.step('steps 02-05 are links to the right pages, 01 stays current', async () => {
      await quotePage.expectUnlocked();
      const targets = [
        ['Materijal i nabavka', 'materijal'],
        ['Plan proizvodnje', 'plan'],
        ['Rad i zastoji', 'proizvodnja'],
        ['Kvalitet i dorada', 'kvalitet'],
      ] as const;
      for (const [label, slug] of targets) {
        await expect(quotePage.step(label)).toHaveAttribute('href', `${slug}.html?lang=bs`);
        await expect(quotePage.step(label)).not.toHaveAttribute('aria-disabled', /.*/);
      }
      await expect(quotePage.step('Kalkulacija i ponuda')).toHaveAttribute('aria-current', 'page');
    });

    await test.step("clicking '02 Materijal i nabavka' opens /materijal with step 02 current", async () => {
      await quotePage.step('Materijal i nabavka').click();
      await expect(page).toHaveURL(/\/poslovni-sistem\/materijal/);
      await expect(quotePage.step('Materijal i nabavka')).toHaveAttribute('aria-current', 'page');
    });
  });

  test('state survives a reload and moving between pages', async ({
    page,
    quotePage,
    materialPage,
    planPage,
    workPage,
    qualityPage,
    overviewPage,
    acceptedQuote,
  }) => {
    let customer = '';
    let quantity = '';

    await test.step('open the new order and reserve its material', async () => {
      await quotePage.newOrderLink.click();
      await expect(materialPage.orderPicker).toBeVisible();
      await materialPage.reserve();
      customer = (await materialPage.headerField('Kupac').innerText()).replace('Kupac', '').trim();
      quantity = (await materialPage.headerField('Količina').innerText()).replace('Količina', '').trim();
      expect(customer).not.toBe('');
    });

    await test.step('after a reload the state is stored with 9 orders and the reservation is shown', async () => {
      await page.reload();
      await expect(materialPage.reserveButton).toHaveText(/Rezervisano za nalog/);
      await expect(materialPage.reserveButton).toBeDisabled();
      const state = await materialPage.readState();
      expect(state.orders).toHaveLength(seededOrders.length + 1);
    });

    await test.step('RN-2609 stays selected on every page and the header is unchanged', async () => {
      for (const target of [materialPage, planPage, workPage, qualityPage]) {
        await target.goto();
        await expect(target.orderPicker).toBeVisible();
        expect(await target.selectedOrder()).toContain(acceptedQuote.id);
        await expect(target.headerField('Kupac')).toContainText(customer);
        await expect(target.headerField('Količina')).toContainText(quantity);
      }
      // 06 has the picker but no Kupac / Količina header
      await overviewPage.goto();
      expect(await overviewPage.selectedOrder()).toContain(acceptedQuote.id);
    });
  });

  test('undo reverts only the last change', async ({ materialPage }) => {
    // 1. On material page with RN-2602 selected (shortage).
    await materialPage.goto();
    await expect(materialPage.undoButton).toBeDisabled();
    await materialPage.pickOrder('RN-2602');
    // Choosing an order is not a change: the undo stack is still empty
    await expect(materialPage.undoButton).toBeDisabled();

    const row = materialPage.materialRow('Aluminij');
    const stockBefore = await materialPage.cellValue(row, 'Na stanju');
    const shortageBefore = await materialPage.kpiValue('Nedostaje');
    const arrivalBefore = await materialPage.kpi('Dolazak materijala').textContent() ?? '';
    expect(shortageBefore).toBeGreaterThan(0);

    await test.step('simulate the receipt and undo it', async () => {
      await materialPage.receiveButton.click();
      await expect(materialPage.toast('Demo prijem evidentiran.')).toBeVisible();
      await expect(materialPage.undoButton).toBeEnabled();
      expect(await materialPage.cellValue(row, 'Na stanju')).toBeCloseTo(stockBefore + shortageBefore, 1);

      await materialPage.undoButton.click();
      await expect(materialPage.toast('Posljednja promjena je vraćena.')).toBeVisible();
      await expect(materialPage.undoButton).toBeDisabled();
      expect(await materialPage.cellValue(row, 'Na stanju')).toBeCloseTo(stockBefore, 1);
      expect(await materialPage.kpiValue('Nedostaje')).toBeCloseTo(shortageBefore, 1);
      await expect(materialPage.kpi('Dolazak materijala')).toHaveText(arrivalBefore);
    });

    await test.step('with two changes undo reverts only the reservation, not the earlier receipt', async () => {
      await materialPage.receiveButton.click();
      await expect(materialPage.receiveButton).toHaveText(/Demo prijem evidentiran/);
      await materialPage.reserve();

      await materialPage.undoButton.click();
      await expect(materialPage.toast('Posljednja promjena je vraćena.')).toBeVisible();
      await expect(materialPage.reserveButton).toHaveText(/Rezerviši materijal/);
      await expect(materialPage.reserveButton).toBeEnabled();
      await expect(materialPage.receiveButton).toHaveText(/Demo prijem evidentiran/);
      expect(await materialPage.kpiValue('Nedostaje')).toBe(0);
      expect(await materialPage.cellValue(row, 'Na stanju')).toBeCloseTo(stockBefore + shortageBefore, 1);
    });
  });

  test('reset restores the seed data and relocks the steps', async ({
    page,
    quotePage,
    materialPage,
    acceptedQuote,
  }) => {
    await expect(quotePage.record).toContainText(/kupac je prihvatio/i);
    await quotePage.expectUnlocked();

    // 1. Click 'Početni podaci' on page 01 and reload.
    await quotePage.resetButton.click();
    await expect(quotePage.toast('Vraćeni su početni podaci.')).toBeVisible();
    await page.reload();

    await test.step('steps 02-05 are locked again and the acceptance record is gone', async () => {
      await quotePage.expectLocked();
      await expect(quotePage.record).not.toContainText(/kupac je prihvatio/i);
      await expect(quotePage.newOrderLink).toHaveCount(0);
    });

    await test.step('the order picker lists only the seeded orders', async () => {
      await materialPage.goto();
      const options = await materialPage.orderOptions();
      expect(options.map(o => o.split(' ')[0])).toEqual([...seededOrders]);
      expect(options.join('\n')).not.toContain(acceptedQuote.id);
    });
  });

  test("'Povratak na nIT' returns to the production tab and the picker lists the seeded orders", async ({
    page,
    materialPage,
    nitHome,
  }) => {
    // 1. Open /poslovni-sistem/materijal.html?lang=bs, click link 'Povratak na nIT'.
    await materialPage.goto();
    await test.step('the back link lands on the production tab of the home page', async () => {
      await materialPage.backLink.click();
      await expect(page).toHaveURL(/\/\?lang=bs#proizvodnja$/);
      await expect(nitHome.serviceTab('Poslovni proračuni i analize')).toHaveAttribute('aria-selected', 'true');
      await expect(nitHome.servicePanel('production')).toBeVisible();
    });

    // 2. Back on a page 02-06 read combobox 'Odaberite nalog'.
    await test.step('the order picker lists eight seeded orders', async () => {
      await materialPage.goto();
      const ids = (await materialPage.orderOptions()).map(o => o.split(' ')[0]);
      expect(ids).toEqual([...seededOrders]);
    });
  });
});
