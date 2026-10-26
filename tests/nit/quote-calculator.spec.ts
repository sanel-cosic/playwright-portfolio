import { test, expect } from '../../fixtures';

/**
 * The calculator's exact pricing model belongs to the site owner, so these
 * tests don't re-implement it. Instead they check rules any correct quote
 * must obey (relationships between the numbers on screen) plus the parts the
 * page states explicitly (scrap rounding, margin = share of the sale price).
 */
test.describe('Quote calculator', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto();
    await nitHome.openTool('quote');
  });

  test('shows a price for the default demo job @smoke', async ({ quote }) => {
    await expect(quote.unitPrice).toHaveText(/^\d{1,3}(\.\d{3})*,\d{2} KM$/);
    await expect(quote.input('Dobri komadi za isporuku')).toHaveValue('240');
  });

  test('totals on screen are consistent with each other', async ({ quote }) => {
    await quote.set('Dobri komadi za isporuku', 1000);
    await expect(quote.result).toContainText('Ponuda za 1.000 kom');

    const t = await quote.totals();
    const qty = 1000;
    // Unit values are rounded to 2 decimals on screen; allow half a cent per piece
    const tolerance = qty * 0.005 + 0.01;
    expect(Math.abs(t.unitPrice * qty - t.totalPrice)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs((t.unitPrice - t.unitCost) * qty - t.contribution)).toBeLessThanOrEqual(tolerance * 2);
  });

  test('margin is a share of the selling price, not a mark-up on cost', async ({ quote }) => {
    await quote.set('Ciljna marža', 25);

    // Poll the whole check: right after the input, the result may still show the old margin
    // price = cost / (1 - margin). A mark-up would give cost × 1.25 instead.
    await expect(async () => {
      const t = await quote.totals();
      expect(t.unitPrice).toBeCloseTo(t.unitCost / (1 - 0.25), 1);
      expect(t.unitPrice).not.toBeCloseTo(t.unitCost * 1.25, 1);
    }).toPass({ timeout: 5_000 });
  });

  test('zero margin means price equals cost', async ({ quote }) => {
    await quote.set('Ciljna marža', 0);

    await expect(async () => {
      const t = await quote.totals();
      expect(t.unitPrice).toBe(t.unitCost);
      expect(t.contribution).toBe(0);
    }).toPass({ timeout: 5_000 });
  });

  // Data-driven: planned input pieces = good pieces / (1 - scrap), always rounded UP
  const scrapCases = [
    { qty: 240, scrap: 3, planned: 248 }, // 247.4 → 248
    { qty: 1000, scrap: 5, planned: 1053 }, // 1052.6 → 1053
    { qty: 100, scrap: 0, planned: 100 }, // no scrap, no extra pieces
    { qty: 50, scrap: 40, planned: 84 }, // maximum allowed scrap
  ];
  for (const { qty, scrap, planned } of scrapCases) {
    test(`plans ${planned} input pieces for ${qty} good pieces at ${scrap}% scrap`, async ({ quote }) => {
      await quote.set('Dobri komadi za isporuku', qty);
      await quote.set('Planirani škart', scrap);

      await expect(quote.result).toContainText(`(+${planned - qty})`);
      expect(await quote.row('Planirati ulaznih komada')).toBe(planned);
    });
  }

  test('bigger batches give a lower price per piece', async ({ quote }) => {
    // Setup cost is spread over more pieces, so 50 > 240 > 1.000 kom
    const [p50, p240, p1000] = await quote.batchPrices();
    expect(p50).toBeGreaterThan(p240);
    expect(p240).toBeGreaterThan(p1000);
  });

  // Data-driven negative tests: values outside the allowed range
  const invalidInputs = [
    { field: 'Planirani škart', value: 41, why: 'scrap above 40%' },
    { field: 'Dobri komadi za isporuku', value: 0, why: 'zero quantity' },
    { field: 'Dobri komadi za isporuku', value: 10.5, why: 'fractional pieces' },
    { field: 'Ciljna marža', value: 96, why: 'margin above 95%' },
  ] as const;
  for (const { field, value, why } of invalidInputs) {
    test(`rejects ${why}`, async ({ quote }) => {
      await quote.set(field, value);

      await expect(quote.alert).toHaveText('Provjerite unesene vrijednosti.');
      await expect(quote.unitPrice).toBeHidden();
    });
  }
});
