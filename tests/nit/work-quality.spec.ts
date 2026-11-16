// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import { parseLocalNumbers } from '../../utils/nitData';

test.describe('QAP-12 Work, downtime, quality and rework', () => {
  test('logging N pieces raises Obrađeno and Čeka kontrolu by N but not Za kupca @smoke', async ({
    plannedOrder,
    workPage,
    qualityPage,
  }) => {
    const pieces = 5;
    await workPage.goto(`&order=${plannedOrder.index}`);
    const before = await workPage.rowValues(plannedOrder.id);
    const remainingBefore = await workPage.remainingPieces();

    await test.step('save a work entry of 5 pieces', async () => {
      await workPage.logWork(pieces, 45, 0);
      await expect(
        workPage.toast('Rad je evidentiran. Plan, kontrola i troškovi su ažurirani.'),
      ).toBeVisible();
    });

    await test.step('the order row and the form header follow the entry', async () => {
      await expect
        .poll(async () => (await workPage.rowValues(plannedOrder.id)).processed)
        .toBe(before.processed + pieces);
      const after = await workPage.rowValues(plannedOrder.id);
      expect(after.forCustomer).toBe(before.forCustomer);
      expect(after.remainingHours).toBeLessThan(before.remainingHours);
      await expect(workPage.remainingText).toContainText(`Preostalo: ${remainingBefore - pieces} kom`);
      await expect(workPage.recentChanges).toContainText('Unos rada');
      await expect(workPage.recentChanges).toContainText('5 kom · 45 min');
    });

    await test.step('the quality page shows the pieces waiting for inspection', async () => {
      await qualityPage.goto(`&order=${plannedOrder.index}`);
      await expect(qualityPage.kpi('Obrađeno')).toBeVisible();
      expect(await qualityPage.kpiValue('Obrađeno')).toBe(before.processed + pieces);
      expect(await qualityPage.kpiValue('Čeka kontrolu')).toBe(pieces);
      await expect(qualityPage.kpi('Spremno za kupca')).toContainText(/(?<!\d)0 \/ \d+/);
    });
  });

  test('more pieces than remain are rejected', async ({ plannedOrder, workPage }) => {
    await workPage.goto(`&order=${plannedOrder.index}`);
    const remaining = await workPage.remainingPieces();
    const before = await workPage.rowValues(plannedOrder.id);

    await test.step('N + 1 pieces cannot be saved', async () => {
      await workPage.piecesInput.fill(String(remaining + 1));
      await expect(workPage.entryStatus).toHaveText('Količina prelazi preostale komade naloga.');
      await expect(workPage.saveButton).toBeDisabled();
      await expect(workPage.piecesInput).toHaveAttribute('max', String(remaining));
    });

    await test.step('exactly N pieces are accepted', async () => {
      await workPage.piecesInput.fill(String(remaining));
      await expect(workPage.entryStatus).toHaveText('Unos je spreman za čuvanje.');
      await expect(workPage.saveButton).toBeEnabled();
    });

    await test.step('the table row is unchanged', async () => {
      expect(await workPage.rowValues(plannedOrder.id)).toEqual(before);
    });
  });

  test('downtime is added to the total and shown in the log', async ({ plannedOrder, workPage }) => {
    await workPage.goto(`&order=${plannedOrder.index}`);
    await expect(workPage.kpi('Dosadašnji zastoji')).toContainText('0 min');
    const costBefore = await workPage.kpiValue('Očekivani trošak');

    await test.step('save 5 pieces with 30 min downtime (Kvar)', async () => {
      await workPage.logWork(5, 45, 30, 'Kvar');
      await expect(workPage.kpi('Dosadašnji zastoji')).toContainText('30 min');
      await expect(workPage.recentChanges).toContainText('5 kom · 45 min · 30 min zastoj');
      expect(await workPage.kpiValue('Očekivani trošak')).toBeGreaterThanOrEqual(costBefore);
    });

    await test.step('a second 30 min entry adds up to 60 min', async () => {
      await workPage.logWork(5, 45, 30, 'Kvar');
      await expect(workPage.kpi('Dosadašnji zastoji')).toContainText('60 min');
    });
  });

  test('downtime above the allowed maximum is not saved', async ({ plannedOrder, workPage }) => {
    // Possible bug (not asserted): with 481 min (max 480) the input is natively invalid, yet the
    // status still says 'Unos je spreman za čuvanje.' and 'Sačuvaj unos' stays enabled, while the
    // pieces-over-remaining case does show a message and disables the button.
    await workPage.goto(`&order=${plannedOrder.index}`);
    const before = await workPage.rowValues(plannedOrder.id);

    await workPage.downtimeInput.fill('481');
    await expect(workPage.downtimeInput).toHaveAttribute('max', '480');
    await workPage.saveButton.click();

    await expect(workPage.kpi('Dosadašnji zastoji')).toContainText('0 min');
    expect(await workPage.rowValues(plannedOrder.id)).toEqual(before);
  });

  test('inspection moves pieces into accepted, scrap and rework @smoke', async ({
    workedOrder,
    qualityPage,
  }) => {
    await qualityPage.goto(`&order=${workedOrder.index}`);
    await expect(qualityPage.kpi('Čeka kontrolu')).toBeVisible();
    const waiting = await qualityPage.kpiValue('Čeka kontrolu');
    const processed = await qualityPage.kpiValue('Obrađeno');
    expect(waiting).toBe(10);
    await expect(qualityPage.allocation).toHaveText(`Raspoređeno: ${waiting} / ${waiting} kom`);

    await test.step('confirm the inspection 5 accepted / 3 scrap / 2 rework', async () => {
      await qualityPage.inspect(5, 3, 2, 'Mjere van tolerancije');
      await expect(qualityPage.toast('Kontrola je evidentirana u nalogu i pregledu firme.')).toBeVisible();
    });

    await test.step('the pieces are distributed over the KPIs', async () => {
      expect(await qualityPage.kpiValue('Čeka kontrolu')).toBe(0);
      expect(await qualityPage.kpiValue('Na doradi')).toBe(2);
      await expect(qualityPage.kpi('Spremno za kupca')).toContainText(/(?<!\d)5 \/ \d+/);
      await expect(qualityPage.kpi('Evidentirani škart')).toContainText('3 kom');
      await expect(qualityPage.kpi('Evidentirani škart')).toContainText(
        `${((3 / processed) * 100).toFixed(1).replace('.', ',')}%`,
      );
      await expect(qualityPage.workspace).toContainText(/Mjere van tolerancije\s*5 kom/);
      // Every processed piece is inspected: the inspection form is gone, only the rework step remains
      await expect(qualityPage.confirmInspection).toBeHidden();
      await expect(qualityPage.confirmRework).toBeVisible();
    });
  });

  test('inspection quantities beyond the pieces waiting cannot be confirmed', async ({
    workedOrder,
    qualityPage,
  }) => {
    await qualityPage.goto(`&order=${workedOrder.index}`);
    await expect(qualityPage.kpi('Čeka kontrolu')).toBeVisible();

    await qualityPage.accepted.fill('8');
    await qualityPage.scrap.fill('3');
    await qualityPage.reworkInput.fill('0');

    await expect(qualityPage.allocation).toHaveText('Raspoređeno: 11 / 10 kom');
    await expect(qualityPage.allocationHint).toBeVisible();
    await expect(qualityPage.confirmInspection).toBeDisabled();

    // nothing changed
    expect(await qualityPage.kpiValue('Čeka kontrolu')).toBe(10);
    expect(await qualityPage.kpiValue('Na doradi')).toBe(0);
    await expect(qualityPage.kpi('Spremno za kupca')).toContainText(/(?<!\d)0 \/ \d+/);
  });

  test('confirming the rework makes the pieces ready for the customer', async ({
    workedOrder,
    workPage,
    qualityPage,
    page,
  }) => {
    await workPage.goto(`&order=${workedOrder.index}`);
    const before = await workPage.rowValues(workedOrder.id);

    await test.step('inspect 5 accepted / 3 scrap / 2 rework', async () => {
      await qualityPage.goto(`&order=${workedOrder.index}`);
      await expect(qualityPage.kpi('Čeka kontrolu')).toBeVisible();
      await qualityPage.inspect(5, 3, 2, 'Mjere van tolerancije');
    });

    await test.step('confirm the rework', async () => {
      await qualityPage.confirmRework.click();
      await expect(qualityPage.toast('Dorada završena; komadi su prihvaćeni.')).toBeVisible();
      await expect(qualityPage.doneHeading).toBeVisible();
      await expect(qualityPage.continueLink).toBeVisible();
      await expect(qualityPage.kpi('Na doradi')).toHaveCount(0);
    });

    await test.step('the work page shows 5 + 2 pieces for the customer and more work left', async () => {
      await qualityPage.continueLink.click();
      await expect(page).toHaveURL(/\/proizvodnja/);
      await expect.poll(async () => (await workPage.rowValues(workedOrder.id)).forCustomer).toBe(5 + 2);
      const after = await workPage.rowValues(workedOrder.id);
      expect(after.processed).toBe(before.processed);
      expect(after.processedTarget).toBeGreaterThan(before.processedTarget);
      expect(after.remainingHours).toBeGreaterThan(before.remainingHours);
    });
  });

  test('more scrap never lowers the expected cost per piece', async ({ workedOrder, qualityPage }) => {
    // Deviation from the plan: instead of two separate runs (10/0/0 vs 7/3/0) the state before the
    // inspection (no scrap recorded) is compared with the state after 5/3/2; with 7/3/0 the whole
    // workspace is replaced by 'Ova kontrola je završena' and the cost line would be gone.
    await qualityPage.goto(`&order=${workedOrder.index}`);
    await expect(qualityPage.kpi('Čeka kontrolu')).toBeVisible();
    const [costWithoutScrap] = parseLocalNumbers(
      await qualityPage.totalLine('Očekivani trošak / kom').innerText(),
    );
    await expect(qualityPage.kpi('Evidentirani škart')).toContainText('0 kom');

    await qualityPage.inspect(5, 3, 2, 'Mjere van tolerancije');

    await expect(qualityPage.kpi('Evidentirani škart')).toContainText('3 kom');
    const [costWithScrap] = parseLocalNumbers(
      await qualityPage.totalLine('Očekivani trošak / kom').innerText(),
    );
    expect(costWithScrap).toBeGreaterThanOrEqual(costWithoutScrap);
  });
});
