// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts

import { test, expect } from '../../fixtures';
import { newOrder, parseLocalNumber, parseLocalNumbers } from '../../utils/nitData';

const breakdownLabels = ['Materijal', 'Programiranje', 'Priprema', 'Obrada', 'Alati', 'Kontrola', 'Režije'];

test.describe('QAP-10 Quote and offer', () => {
  test('default calculation is internally consistent @smoke', async ({ quotePage }) => {
    // 1. quotePage.goto(). Read the cost, price and margin figures.
    await quotePage.goto();
    await expect(quotePage.marginText).toBeVisible();

    const perPiece = await quotePage.resultValue('Trošak po komadu');
    const series = await quotePage.resultValue('Trošak cijele serije');
    const total = await quotePage.resultValue('Ukupno za kupca bez PDV-a');
    const remaining = await quotePage.resultValue('Ostaje nakon obračunatih troškova');
    const quantity = Number(await quotePage.quantity.inputValue());
    const price = Number(await quotePage.unitPrice.inputValue());
    const margin = await quotePage.marginValue();

    await test.step('series cost equals cost per piece times quantity (rounding of the piece cost)', async () => {
      expect(Math.abs(series - perPiece * quantity)).toBeLessThanOrEqual(0.01 * quantity);
    });
    await test.step('total for the customer equals price times quantity', async () => {
      expect(total).toBeCloseTo(price * quantity, 2);
    });
    await test.step("'Ostaje' equals total minus series cost", async () => {
      expect(remaining).toBeCloseTo(total - series, 2);
    });
    await test.step('margin is the share of the price and is not a net profit', async () => {
      expect(Math.abs(margin - (remaining / total) * 100)).toBeLessThan(0.1);
      await expect(quotePage.marginText).toHaveText(/Nije neto dobit\.$/);
    });
  });

  test('batch comparison: more pieces never cost more per piece', async ({ quotePage }) => {
    await quotePage.goto();
    const sizes = [50, 100, 500] as const;

    const printed = {
      50: await quotePage.batchCost(50),
      100: await quotePage.batchCost(100),
      500: await quotePage.batchCost(500),
    };

    await test.step('printed cost falls as the quantity grows', async () => {
      expect(printed[50]).toBeGreaterThan(printed[100]);
      expect(printed[100]).toBeGreaterThan(printed[500]);
    });

    await test.step('100 kom is pressed on load and matches the shown cost per piece', async () => {
      await expect(quotePage.batchButton(100)).toHaveAttribute('aria-pressed', 'true');
      expect(await quotePage.resultValue('Trošak po komadu')).toBeCloseTo(printed[100], 2);
    });

    for (const pieces of sizes) {
      await test.step(`clicking ${pieces} kom applies it to the form`, async () => {
        await quotePage.batchButton(pieces).click();
        await expect(quotePage.batchButton(pieces)).toHaveAttribute('aria-pressed', 'true');
        await expect(quotePage.quantity).toHaveValue(String(pieces));
        await expect
          .poll(() => quotePage.resultValue('Trošak po komadu'))
          .toBeCloseTo(printed[pieces], 2);
        const perPiece = await quotePage.resultValue('Trošak po komadu');
        const series = await quotePage.resultValue('Trošak cijele serije');
        expect(Math.abs(series - perPiece * pieces)).toBeLessThanOrEqual(0.01 * pieces);
      });
    }
  });

  test("below-target price warns and 'Predloži cijenu' reaches the target margin", async ({ quotePage }) => {
    await quotePage.goto();
    const target = Number(await quotePage.targetMargin.inputValue());
    const priceBefore = Number(await quotePage.unitPrice.inputValue());
    const remainingBefore = await quotePage.resultValue('Ostaje nakon obračunatih troškova');

    await test.step('the seed draft is below the target margin and warns', async () => {
      await expect(quotePage.belowTargetWarning).toBeVisible();
      expect(await quotePage.marginValue()).toBeLessThan(target);
    });

    await test.step('suggesting a price raises price and remaining and reaches the target', async () => {
      await quotePage.suggestButton.click();
      await expect(quotePage.belowTargetWarning).toBeHidden();
      expect(Number(await quotePage.unitPrice.inputValue())).toBeGreaterThan(priceBefore);
      expect(await quotePage.resultValue('Ostaje nakon obračunatih troškova')).toBeGreaterThan(remainingBefore);
      expect(Math.abs((await quotePage.marginValue()) - target)).toBeLessThan(0.1);
    });

    await test.step('lowering the price by hand shows the warning again', async () => {
      await quotePage.unitPrice.fill('30');
      await expect(quotePage.belowTargetWarning).toBeVisible();
    });
  });

  const invalidCases = [
    { name: 'quantity 0', field: 'quantity', value: '0', needsTechnology: false },
    { name: 'quantity 10.5', field: 'quantity', value: '10.5', needsTechnology: false },
    { name: 'scrap allowance 41', field: 'scrap', value: '41', needsTechnology: true },
    { name: 'target margin 80', field: 'targetMargin', value: '80', needsTechnology: false },
  ] as const;

  for (const { name, field, value, needsTechnology } of invalidCases) {
    test(`invalid input is rejected: ${name}`, async ({ quotePage }) => {
      await quotePage.goto();
      if (needsTechnology) await quotePage.openTechnology();
      const input = quotePage[field];
      const original = await input.inputValue();

      await test.step('enter the invalid value and try to preview', async () => {
        await input.fill(value);
        await quotePage.previewButton.click();
      });

      await test.step('field is invalid, focused, no preview, result block replaced', async () => {
        // Validation is native: the message is browser-locale text, so only validity is asserted.
        expect(await quotePage.isValid(input)).toBe(false);
        await expect(input).toBeFocused();
        await expect(quotePage.preview).toBeHidden();
        await expect(quotePage.incomplete).toBeVisible();
        // Observed: #quote-error (role=alert) stays empty; the AC mentions it, the app does not use it.
      });

      await test.step('a valid value brings the figures and the preview back', async () => {
        await input.fill(original);
        expect(await quotePage.isValid(input)).toBe(true);
        await expect(quotePage.incomplete).toBeHidden();
        await expect(quotePage.result('Trošak po komadu')).toBeVisible();
        await quotePage.previewQuote();
        await quotePage.previewCloseButton.click();
        await expect(quotePage.preview).toBeHidden();
      });
    });
  }

  test('cost breakdown adds up and every item opens its formula', async ({ quotePage }) => {
    await quotePage.goto();
    await quotePage.openBreakdown();
    const series = await quotePage.resultValue('Trošak cijele serije');

    await test.step('the seven items add up to the series cost', async () => {
      let sum = 0;
      for (const label of breakdownLabels) {
        sum += parseLocalNumber(await quotePage.breakdownAmount(label).innerText());
      }
      expect(Math.abs(sum - series)).toBeLessThanOrEqual(0.02);
    });

    for (const label of breakdownLabels) {
      await test.step(`${label} opens its formula with the same amount`, async () => {
        // Possible a11y bug: the buttons are named only by the amount, so rows are found via their label.
        const button = quotePage.breakdownAmount(label);
        const amount = (await button.innerText()).replace('↗', '').trim();
        await button.click();
        await expect(quotePage.formulaDialog).toBeVisible();
        await expect(quotePage.formulaDialog).toContainText(label);
        await expect(quotePage.formulaDialog).toContainText('Obračun za novu seriju');
        await expect(quotePage.formulaDialog).toContainText(amount);
        await quotePage.formulaDialog.getByRole('button', { name: 'Zatvori' }).click();
        await expect(quotePage.formulaDialog).toBeHidden();
      });
    }
  });

  test('customer preview shows the offer but hides internal cost and margin', async ({ page, quotePage }) => {
    await quotePage.goto();
    const customer = await quotePage.customer.inputValue();
    const quantity = await quotePage.quantity.inputValue();
    const price = Number(await quotePage.unitPrice.inputValue());

    await quotePage.previewQuote();

    await test.step('the offer shows customer, quantity, price and total from the form', async () => {
      await expect(page.getByRole('heading', { name: 'Ponuda za kupca' })).toBeVisible();
      await expect(quotePage.preview).toContainText(customer);
      const line = quotePage.preview.getByRole('row').filter({ hasText: `${quantity} kom` });
      await expect(line).toBeVisible();
      const [pieces, unit, total] = parseLocalNumbers(
        (await line.getByRole('cell').allInnerTexts()).slice(1).join(' '),
      );
      expect(pieces).toBe(Number(quantity));
      expect(unit).toBeCloseTo(price, 2);
      expect(total).toBeCloseTo(unit * pieces, 2);
    });

    await test.step('internal cost and margin are not part of the document', async () => {
      await expect(quotePage.preview).not.toContainText(/Trošak|Marža|Ostaje nakon obračunatih troškova/);
      await expect(quotePage.preview).toContainText('Interni troškovi i marža nisu dio ovog dokumenta.');
    });

    await test.step('the preview actions are present (download and print are not exercised)', async () => {
      await expect(quotePage.saveButton).toBeVisible();
      await expect(quotePage.preview.getByRole('button', { name: 'Preuzmi ponudu' })).toBeVisible();
      await expect(quotePage.preview.getByRole('button', { name: 'Štampaj ponudu' })).toBeVisible();
      await expect(quotePage.previewCloseButton).toBeVisible();
    });
  });

  test('preview, save and accept creates order RN-2609 and unlocks the next steps @smoke', async ({
    page,
    quotePage,
    materialPage,
  }) => {
    await quotePage.goto();
    const customer = await quotePage.customer.inputValue();

    await test.step('preview and save the offer: the dialog stays open and the record shows it', async () => {
      await quotePage.previewQuote();
      await quotePage.saveButton.click();
      await expect(quotePage.preview).toBeVisible();
      await expect(quotePage.acceptButton).toBeVisible();
      await expect(quotePage.record).toContainText('Sačuvana ponuda');
      await expect(quotePage.record).toContainText('verzija 1');
    });

    await test.step('accepting closes the dialog and creates the order', async () => {
      await quotePage.acceptButton.click();
      await expect(quotePage.toast('Prihvatanje kupca je zabilježeno. Kreiran je novi nalog.')).toBeVisible();
      await expect(quotePage.preview).toBeHidden();
      await expect(quotePage.record).toContainText(/kupac je prihvatio/i);
      await expect(quotePage.record).toContainText(new RegExp(`${customer} · 100 kom × .+ KM · .+ KM`));
      await expect(quotePage.newOrderLink).toHaveText(new RegExp(newOrder.id));
      await expect(quotePage.newOrderLink).toHaveAttribute('href', `materijal.html?lang=bs&order=${newOrder.index}`);
      await expect(quotePage.newDraftButton).toBeVisible();
    });

    await test.step('steps 02-05 are open and the scenario buttons are disabled', async () => {
      await quotePage.expectUnlocked();
      for (const pieces of [50, 100, 500] as const) {
        await expect(quotePage.batchButton(pieces)).toBeDisabled();
      }
    });

    await test.step('the order link opens the material page with RN-2609 selected', async () => {
      await quotePage.newOrderLink.click();
      await expect(page).toHaveURL(/\/poslovni-sistem\/materijal/);
      await expect(materialPage.orderPicker).toBeVisible();
      expect(await materialPage.selectedOrder()).toContain(newOrder.id);
    });

    await test.step("'Nova ponuda iz predloška' locks the steps and enables the buttons again", async () => {
      await quotePage.goto();
      await quotePage.newDraftButton.click();
      await quotePage.expectLocked();
      for (const pieces of [50, 100, 500] as const) {
        await expect(quotePage.batchButton(pieces)).toBeEnabled();
      }
    });
  });
});
