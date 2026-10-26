import { test, expect } from '../../fixtures';
import { demoOrders } from '../../utils/nitData';

test.describe('Order overview', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto();
    await nitHome.openTool('orders');
  });

  test('lists all demo orders, five per page @smoke', async ({ orders }) => {
    await orders.expectShowing(demoOrders.total, demoOrders.total);
    await expect(orders.visibleRows).toHaveCount(demoOrders.pageSize);
    await expect(orders.pageInfo).toHaveText(`1–5 / ${demoOrders.total} naloga`);
    await expect(orders.previousPage).toBeDisabled();
  });

  test('pagination moves forward and back', async ({ orders }) => {
    await expect(orders.visibleRows).toHaveCount(demoOrders.pageSize);
    const firstPage = await orders.visibleRows.locator('b').allTextContents();

    await orders.nextPage.click();
    await expect(orders.pageInfo).toHaveText(`6–10 / ${demoOrders.total} naloga`);
    const secondPage = await orders.visibleRows.locator('b').allTextContents();
    expect(secondPage).not.toEqual(firstPage);

    await orders.previousPage.click();
    await expect(orders.visibleRows.locator('b')).toHaveText(firstPage);
  });

  // Data-driven: each production cell filter shows only that cell's orders
  for (const [cell, expected] of Object.entries(demoOrders.perCell)) {
    test(`filtering by "${cell}" shows only its ${expected} orders`, async ({ orders }) => {
      await orders.cellFilter.selectOption(cell);

      await orders.expectShowing(expected, demoOrders.total);
      await expect.poll(() => orders.kpi('Filtrirani nalozi')).toBe(expected);
      const cells = await orders.visibleRows.locator('td:nth-child(3)').allTextContents();
      expect(cells.length).toBeGreaterThan(0);
      expect(new Set(cells)).toEqual(new Set([cell]));
    });
  }

  test('search by order number finds exactly that order', async ({ orders }) => {
    await orders.search.fill('RN-041');

    await orders.expectShowing(1, demoOrders.total);
    await expect(orders.visibleRows).toHaveCount(1);
    await expect(orders.row('RN-041')).toContainText('Nosač AX-12');
  });

  test('shows a clear message when nothing matches', async ({ orders }) => {
    await orders.search.fill('no-such-order');

    await orders.expectShowing(0, demoOrders.total);
    await expect(orders.rows).toHaveText(['Nema naloga za odabrane filtere.']);
  });

  test('"clear filters" restores the full list', async ({ orders }) => {
    await orders.cellFilter.selectOption('Ćelija C');
    await orders.search.fill('RN-05');
    await orders.clearFilters.click();

    await orders.expectShowing(demoOrders.total, demoOrders.total);
    await expect(orders.search).toHaveValue('');
    await expect(orders.cellFilter).toHaveValue('all');
  });

  test('completing an order updates its status and the totals', async ({ orders }) => {
    // RN-036: 120 of 320 pieces done → 200 remaining
    const remainingBefore = await orders.kpi('Preostali komadi');

    await orders.findOrder('RN-036');
    await expect(orders.row('RN-036')).toContainText('U radu');
    await orders.setFinishedPieces('RN-036', 320);

    await expect(orders.row('RN-036')).toContainText('320 / 320');
    await expect(orders.row('RN-036')).toContainText('Završeno');
    await orders.clearFilters.click();
    await expect.poll(() => orders.kpi('Preostali komadi')).toBe(remainingBefore - 200);
  });

  test('finished pieces cannot exceed the order quantity', async ({ orders }) => {
    await orders.findOrder('RN-036');

    await orders.setFinishedPieces('RN-036', 999);

    // Browser validation blocks the change; the order keeps its old progress
    await expect(orders.row('RN-036')).toContainText('120 / 320');
    await expect(orders.row('RN-036').getByLabel('Završeni komadi')).toHaveJSProperty('validity.valid', false);
  });

  test('marking material as missing is counted in the KPIs', async ({ orders }) => {
    const blockedBefore = await orders.kpi('Otvoreni bez materijala');

    await orders.findOrder('RN-041');
    await orders.setMaterial('RN-041', 'Nedostaje');
    await orders.clearFilters.click();

    await expect.poll(() => orders.kpi('Otvoreni bez materijala')).toBe(blockedBefore + 1);
  });
});
