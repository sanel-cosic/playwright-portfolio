// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import { parseLocalNumber } from '../../utils/nitData';

test.describe('QAP-11 Material and production plan', () => {
  test('reserving material raises Rezervisano by the order need @smoke', async ({
    acceptedQuote,
    quotePage,
    materialPage,
  }) => {
    const customer = await quotePage.customer.inputValue();
    const quantity = await quotePage.quantity.inputValue();

    await test.step('open the new order from the accepted quote', async () => {
      await quotePage.newOrderLink.click();
      await expect(materialPage.heading).toHaveText('Materijal i nabavka');
      await expect.poll(() => materialPage.selectedOrder()).toContain(acceptedQuote.id);
      await expect(materialPage.headerField('Kupac')).toContainText(customer);
      await expect(materialPage.headerField('Količina')).toContainText(quantity);
    });

    const row = await materialPage.neededRow();
    const stockBefore = await materialPage.cellValue(row, 'Na stanju');
    const reservedBefore = await materialPage.cellValue(row, 'Rezervisano');
    const need = await materialPage.cellValue(row, 'Treba nalogu');

    await test.step('before reserving: no shortage and Potrebno equals the table need', async () => {
      expect(await materialPage.kpiValue('Nedostaje')).toBeGreaterThanOrEqual(0);
      expect(await materialPage.kpiValue('Potrebno')).toBeCloseTo(need, 1);
      await expect(materialPage.reserveButton).toBeEnabled();
    });

    await test.step('reserve the material', async () => {
      await materialPage.reserve();
    });

    await test.step('Rezervisano grew by exactly the need, stock is unchanged', async () => {
      expect(await materialPage.cellValue(row, 'Rezervisano')).toBeCloseTo(reservedBefore + need, 1);
      expect(await materialPage.cellValue(row, 'Na stanju')).toBeCloseTo(stockBefore, 1);
      expect(await materialPage.kpiValue('Nedostaje')).toBeGreaterThanOrEqual(0);
      await expect(materialPage.toast('Materijal rezervisan za odabrani nalog.')).toBeVisible();
      await expect(materialPage.reserveButton).toHaveText(/Rezervisano za nalog/);
      await expect(materialPage.reserveButton).toBeDisabled();
      await expect(materialPage.workspace).toContainText(
        'Materijal je raspoloživ. Možete planirati početak rada.',
      );
    });
  });

  test('shortage is shown as need minus available and a simulated receipt resolves it', async ({
    acceptedQuote,
    materialPage,
  }) => {
    await materialPage.goto(`&order=${acceptedQuote.index}`);
    await materialPage.pickOrder('RN-2602');
    await expect.poll(() => materialPage.selectedOrder()).toContain('RN-2602');

    const row = await materialPage.neededRow();
    const stockBefore = await materialPage.cellValue(row, 'Na stanju');
    const need = await materialPage.kpiValue('Potrebno');
    const available = await materialPage.kpiValue('Raspoloživo');
    const missing = await materialPage.kpiValue('Nedostaje');

    await test.step('before the receipt: shortage = need - available', async () => {
      expect(missing).toBeGreaterThan(0);
      expect(missing).toBeCloseTo(need - available, 1);
      await expect(materialPage.reserveButton).toBeDisabled();
      await expect(materialPage.receiveButton).toBeEnabled();
      await expect(materialPage.kpi('Dolazak materijala')).toContainText(
        /Ponedjeljak|Utorak|Srijeda|Četvrtak|Petak|Subota|Nedjelja/,
      );
      await expect(materialPage.kpi('Dolazak materijala')).not.toContainText('Zaprimljeno');
    });

    await test.step('simulate the receipt', async () => {
      await materialPage.receiveButton.click();
      await expect(materialPage.toast('Demo prijem evidentiran.')).toBeVisible();
    });

    await test.step('after the receipt: stock grew by the shortage and nothing is missing', async () => {
      expect(await materialPage.cellValue(row, 'Na stanju')).toBeCloseTo(stockBefore + missing, 1);
      expect(await materialPage.kpiValue('Nedostaje')).toBe(0);
      await expect(materialPage.kpi('Dolazak materijala')).toContainText('Zaprimljeno');
      await expect(materialPage.reserveButton).toBeEnabled();
    });
  });

  test('simulated receipt is unavailable when no material is missing', async ({
    acceptedQuote,
    materialPage,
  }) => {
    await materialPage.goto(`&order=${acceptedQuote.index}`);
    await expect.poll(() => materialPage.selectedOrder()).toContain(acceptedQuote.id);
    expect(await materialPage.kpiValue('Nedostaje')).toBe(0);
    await expect(materialPage.receiveButton).toBeDisabled();
    await expect(materialPage.kpi('Dolazak materijala')).toContainText('Na stanju');
  });

  test('planning an unreserved order is blocked @smoke', async ({
    acceptedQuote,
    planPage,
    materialPage,
    page,
  }) => {
    await test.step('the planner is blocked without a reservation', async () => {
      await planPage.goto();
      await expect(planPage.blockedHeading).toBeVisible();
      await expect(planPage.workspace).toContainText(
        'Ovaj nalog još nema rezervisan materijal. Rezervišite ga prije potvrde termina.',
      );
      await expect(planPage.confirmButton).toHaveCount(0);
      await expect(planPage.openMaterialLink).toHaveAttribute('href', 'materijal.html?lang=bs');
    });

    await test.step('the link leads to the material page with the same order selected', async () => {
      await planPage.openMaterialLink.click();
      await expect(page).toHaveURL(/materijal/);
      await expect(materialPage.heading).toHaveText('Materijal i nabavka');
      await expect.poll(() => materialPage.selectedOrder()).toContain(acceptedQuote.id);
    });

    await test.step('after reserving, the planner form appears', async () => {
      await materialPage.reserve();
      await planPage.goto();
      await expect(planPage.blockedHeading).toBeHidden();
      await expect(page.getByRole('heading', { name: 'Rasporedi odabrani nalog' })).toBeVisible();
    });
  });

  test('planner offers only machines suitable for the part', async ({ reservedOrder, planPage }) => {
    await planPage.goto(`&order=${reservedOrder.index}`);
    const options = planPage.machine.locator('option');

    await test.step('RN-2604 (lathe part) offers only CNC-04', async () => {
      await planPage.pickOrder('RN-2604');
      await expect(options).toHaveCount(1);
      await expect(options.first()).toHaveText(/^CNC-04/);
      await expect(planPage.machineHint).toBeVisible();
    });

    await test.step('RN-2601 (milling part) offers CNC-01, CNC-02 and CNC-03 only', async () => {
      await planPage.pickOrder('RN-2601');
      await expect(options).toHaveText([/^CNC-01/, /^CNC-02/, /^CNC-03/]);
      await expect(planPage.machineHint).toBeVisible();
    });

    await test.step('the reserved new order RN-2609 offers the same milling machines', async () => {
      await planPage.pickOrder(reservedOrder.id);
      await expect(options).toHaveText([/^CNC-01/, /^CNC-02/, /^CNC-03/]);
    });
  });

  test('a clashing slot is reported and cannot be confirmed', async ({ reservedOrder, planPage }) => {
    await planPage.goto(`&order=${reservedOrder.index}`);

    // CNC-01 Monday 08:00 of week 1 is occupied by a seeded order
    await planPage.chooseSlot('CNC-01', 'Ponedjeljak · Sedmica 1', '08:00');

    await expect(planPage.slotStatus).toHaveText(/Termin se preklapa s nalogom RN-\d+\./);
    await expect(planPage.confirmButton).toBeDisabled();
    await expect(planPage.kpi('Status plana')).toContainText('Čeka termin');
  });

  test('first free slot can be confirmed and appears in the weekly grid @smoke', async ({
    reservedOrder,
    planPage,
    page,
  }) => {
    await planPage.goto(`&order=${reservedOrder.index}`);
    await planPage.chooseSlot('CNC-01', 'Ponedjeljak · Sedmica 1', '08:00');
    await expect(planPage.confirmButton).toBeDisabled();

    await test.step('take the first free slot', async () => {
      await planPage.firstFreeButton.click();
      await expect(planPage.slotStatus).toHaveText('Termin je slobodan. Možete ga potvrditi.');
      await expect(planPage.confirmButton).toBeEnabled();
    });

    const hours = await planPage.kpiValue('Preostalo rada');
    const machineLabel = await planPage.machine.evaluate((s: HTMLSelectElement) => s.selectedOptions[0].text);
    const machine = machineLabel.split(' ·')[0];

    await test.step('confirm the slot', async () => {
      await planPage.confirmButton.click();
      await expect(planPage.toast('Termin je provjeren i sačuvan.')).toBeVisible();
      await expect(planPage.kpi('Status plana')).toContainText('Termin potvrđen');
    });

    await test.step('the order is in the weekly grid on the chosen machine with the remaining hours', async () => {
      const chip = planPage.gridChip(reservedOrder.id, machine);
      await expect(chip).toHaveCount(1);
      const chipHours = parseLocalNumber((await chip.innerText()).split('·')[1]);
      expect(chipHours).toBeCloseTo(hours, 1);
    });

    await test.step('the execution link leads to the work page', async () => {
      await planPage.trackLink.click();
      await expect(page).toHaveURL(/\/proizvodnja/);
    });
  });

  test('starting earlier never finishes later', async ({ reservedOrder, planPage }) => {
    await planPage.goto(`&order=${reservedOrder.index}`);

    const starts = [
      ['Srijeda · Sedmica 1', '12:30'],
      ['Četvrtak · Sedmica 1', '12:30'],
      ['Ponedjeljak · Sedmica 2', '08:00'],
    ] as const;

    const finishes: Date[] = [];
    for (const [day, time] of starts) {
      await test.step(`estimate the finish for a start on ${day} at ${time}`, async () => {
        await planPage.chooseSlot('CNC-01', day, time);
        await expect(planPage.finish).toContainText(/\d{2}\.\d{2}\.\d{4}\.\s*·\s*\d{1,2}:\d{2}/);
        finishes.push(await planPage.finishDate());
      });
    }

    for (let i = 1; i < finishes.length; i++) {
      expect(finishes[i - 1].getTime()).toBeLessThanOrEqual(finishes[i].getTime());
    }
  });
});
