import { test, expect } from '../../fixtures';

test.describe('Production planner', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto();
    await nitHome.openTool('plan');
  });

  test('builds a plan for the open demo orders on load @smoke', async ({ planner }) => {
    await expect(planner.status).toHaveText('Plan ažuriran — trenutni podaci i pravila.');
    // 18 demo orders, one already finished → 17 open
    await expect.poll(() => planner.openOrders()).toBe(17);
    await expect.poll(() => planner.kpi('Završava u roku')).toBeGreaterThan(0);
  });

  test('changing a setting marks the plan as out of date', async ({ planner }) => {
    await planner.setting('Raspoloživi kapacitet').selectOption('100');

    await expect(planner.status).toHaveText('Izmjene čekaju novi obračun.');
    await expect(planner.result).toHaveText(
      'Podaci ili pravila su promijenjeni. Generišite novi plan za ažurne rezultate.',
    );

    await planner.generatePlan();
    await expect(planner.result.locator('.kpi-grid')).toBeVisible();
  });

  // Metamorphic test: we can't know the "right" plan, but more capacity
  // must never make fewer orders finish on time.
  test('more shifts never mean fewer orders on time', async ({ planner }) => {
    const oneShift = await planner.kpi('Završava u roku');
    const oneShiftLoad = await planner.kpi('Popunjenost kapaciteta');

    await planner.setting('Smjena dnevno').selectOption('3');
    await planner.generatePlan();

    // Poll: the status line can update before the KPI tiles are re-rendered
    await expect.poll(() => planner.kpi('Popunjenost kapaciteta')).toBeLessThan(oneShiftLoad);
    await expect.poll(() => planner.kpi('Završava u roku')).toBeGreaterThanOrEqual(oneShift);
  });

  test('edits in the order overview flow into the next plan', async ({ nitHome, orders, planner }) => {
    const waitingBefore = await planner.kpi('Čeka materijal');

    await nitHome.openTool('orders');
    await orders.findOrder('RN-041');
    await orders.setMaterial('RN-041', 'Nedostaje');

    await nitHome.openTool('plan');
    await expect(planner.status).toHaveText('Izmjene čekaju novi obračun.');
    await planner.generatePlan();
    await expect.poll(() => planner.kpi('Čeka materijal')).toBe(waitingBefore + 1);
  });

  test('rejects a malformed order list and points at the bad row', async ({ planner }) => {
    await planner.openImportEditor();

    await planner.importList.fill('RN-900;Demo;Part;10'); // 4 of the 12 required fields
    await planner.applyList.click();

    await expect(planner.importMessage).toHaveText('Provjerite format reda 1');
    await expect(planner.rawSummary).toHaveText('Ulazna lista — 18 neuređenih naloga');
  });

  test('accepts a valid custom order list and can reset to demo data', async ({ planner }) => {
    await planner.openImportEditor();

    await planner.importList.fill(
      [
        'RN-901;Demo Test;Nosač T-1;100;0;5;Ćelija A;C45;2;30;da;Hitno',
        'RN-902;Demo Test;Nosač T-2;50;0;8;Ćelija B;Al 6082;3;20;ne;Normalan',
      ].join('\n'),
    );
    await planner.applyList.click();

    await expect(planner.importMessage).toHaveText('Lista je primijenjena.');
    await expect(planner.rawSummary).toHaveText('Ulazna lista — 2 neuređenih naloga');
    await expect.poll(() => planner.openOrders()).toBe(2);
    await expect.poll(() => planner.kpi('Čeka materijal')).toBe(1); // RN-902 has no material

    await planner.resetList.click();
    await expect(planner.importMessage).toHaveText('Vraćeni su početni demo podaci.');
    await expect(planner.rawSummary).toHaveText('Ulazna lista — 18 neuređenih naloga');
  });
});
