// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import type { OverviewPage } from '../../pages/nit/OverviewPage';
import { parseLocalNumber, parseLocalNumbers } from '../../utils/nitData';

const customers = ['Adria oprema', 'Tehno fluid', 'Metal servis'] as const;
const cards = [
  'Poslovanje',
  'Plan proizvodnje',
  'Mašine i učinak',
  'Kvalitet i škart',
  'Kalkulacija i odstupanja',
  'Alati i održavanje',
] as const;

/** The three money figures of the 'Poslovanje' card (the page rounds to whole KM). */
async function money(overview: OverviewPage) {
  return {
    value: await overview.kpiValue('Vrijednost naloga'),
    cost: await overview.kpiValue('Očekivani trošak'),
    remaining: await overview.kpiValue('Preostaje'),
  };
}

function expectRemainingRelation(m: { value: number; cost: number; remaining: number }) {
  expect(Math.abs(m.value - m.cost - m.remaining)).toBeLessThanOrEqual(1);
}

test.describe('QAP-13 Company overview', () => {
  test("overview works on the seed and 'Preostaje' = 'Vrijednost naloga' - 'Očekivani trošak' @smoke", async ({
    overviewPage,
  }) => {
    await overviewPage.goto();
    await expect(overviewPage.heading).toHaveText('Pregled firme');
    await expect(overviewPage.historyFilter.locator('option:checked')).toHaveText('8 sedmica');
    await expect(overviewPage.machineFilter.locator('option:checked')).toHaveText('Sve mašine');
    await expect(overviewPage.customerFilter.locator('option:checked')).toHaveText('Svi kupci');
    await expect(overviewPage.whatIf('Osnova')).toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => overviewPage.orderCountValue()).toBe(8);
    const figures = await money(overviewPage);
    expect(figures.value).toBeGreaterThan(0);
    expect(figures.cost).toBeGreaterThan(0);
    expectRemainingRelation(figures);

    for (const heading of cards) {
      await expect(overviewPage.card(heading)).toBeVisible();
    }
  });

  test("material price what-if raises cost and lowers 'Preostaje'; 'Osnova' restores", async ({
    overviewPage,
  }) => {
    await overviewPage.goto();
    const modes = ['Osnova', '+10%', '+20%'] as const;

    const material = async () =>
      parseLocalNumber(await overviewPage.breakdownButton('Materijal').getAttribute('aria-label'));
    const expectOnlyPressed = async (active: (typeof modes)[number]) => {
      for (const mode of modes) {
        await expect(overviewPage.whatIf(mode)).toHaveAttribute('aria-pressed', mode === active ? 'true' : 'false');
      }
    };

    await expectOnlyPressed('Osnova');
    const base = { ...(await money(overviewPage)), material: await material() };
    expectRemainingRelation(base);

    await overviewPage.whatIf('+10%').click();
    await expectOnlyPressed('+10%');
    await expect.poll(() => overviewPage.kpiValue('Očekivani trošak')).toBeGreaterThan(base.cost);
    const plus10 = { ...(await money(overviewPage)), material: await material() };

    await overviewPage.whatIf('+20%').click();
    await expectOnlyPressed('+20%');
    await expect.poll(() => overviewPage.kpiValue('Očekivani trošak')).toBeGreaterThan(plus10.cost);
    const plus20 = { ...(await money(overviewPage)), material: await material() };

    expect(plus10.remaining).toBeLessThan(base.remaining);
    expect(plus20.remaining).toBeLessThan(plus10.remaining);
    expect(plus10.material).toBeGreaterThan(base.material);
    expect(plus20.material).toBeGreaterThan(plus10.material);
    // contracted prices stay the same
    expect(plus10.value).toBe(base.value);
    expect(plus20.value).toBe(base.value);
    expectRemainingRelation(plus10);
    expectRemainingRelation(plus20);

    await overviewPage.whatIf('Osnova').click();
    await expectOnlyPressed('Osnova');
    await expect.poll(() => overviewPage.kpiValue('Očekivani trošak')).toBe(base.cost);
    expect({ ...(await money(overviewPage)), material: await material() }).toEqual(base);
  });

  test("customer filters narrow the numbers and 'Svi kupci' restores them", async ({ overviewPage }) => {
    await overviewPage.goto();
    await expect.poll(() => overviewPage.orderCountValue()).toBe(8);
    const total = { count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) };

    let countSum = 0;
    for (const customer of customers) {
      await test.step(`filter by ${customer}`, async () => {
        await overviewPage.customerFilter.selectOption({ label: customer });
        await expect.poll(() => overviewPage.orderCountValue()).toBeLessThan(total.count);
        const count = await overviewPage.orderCountValue();
        expect(count).toBeGreaterThan(0);
        expect((await money(overviewPage)).value).toBeLessThanOrEqual(total.value);
        countSum += count;
      });
    }
    expect(countSum).toBe(total.count);

    await overviewPage.customerFilter.selectOption({ label: 'Svi kupci' });
    await expect.poll(() => overviewPage.orderCountValue()).toBe(total.count);
    expect({ count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) }).toEqual(total);
  });

  test("machine filter CNC-04 shows only its orders and 'Sve mašine' restores them", async ({
    overviewPage,
  }) => {
    await overviewPage.goto();
    await expect.poll(() => overviewPage.orderCountValue()).toBe(8);
    const total = { count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) };
    const planCard = overviewPage.card('Plan proizvodnje');

    // select by the full option label read from the page, never by a bare short label
    const cnc04 = (await overviewPage.machineFilter.locator('option', { hasText: /^CNC-04/ }).innerText()).trim();
    await overviewPage.machineFilter.selectOption({ label: cnc04 });

    await expect.poll(() => overviewPage.orderCountValue()).toBeLessThan(total.count);
    expect((await money(overviewPage)).value).toBeLessThanOrEqual(total.value);
    // the lathe orders of the seed
    await expect(planCard).toContainText('RN-2604');
    await expect(planCard).toContainText('RN-2606');
    await expect(planCard).not.toContainText('RN-2601');

    const all = (await overviewPage.machineFilter.locator('option', { hasText: /^Sve mašine/ }).innerText()).trim();
    await overviewPage.machineFilter.selectOption({ label: all });
    await expect.poll(() => overviewPage.orderCountValue()).toBe(total.count);
    expect({ count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) }).toEqual(total);
  });

  test('the history filter changes only the chart, not the figures', async ({ overviewPage }) => {
    await overviewPage.goto();
    await expect(overviewPage.chartBars).toHaveCount(8);
    const before = { count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) };

    await overviewPage.historyFilter.selectOption({ label: '4 sedmice' });

    await expect(overviewPage.chartBars).toHaveCount(4);
    expect({ count: await overviewPage.orderCountValue(), ...(await money(overviewPage)) }).toEqual(before);
  });

  test('cost breakdown of the selected order adds up to the expected cost', async ({ overviewPage }) => {
    await overviewPage.goto();
    await expect(overviewPage.card('Kalkulacija i odstupanja')).toBeVisible();
    await expect(overviewPage.breakdownButton('Materijal')).toHaveCount(1);

    const amounts = await overviewPage.breakdownAmounts();
    expect(amounts.length).toBeGreaterThanOrEqual(7);
    const [plan, expected] = parseLocalNumbers(await overviewPage.totalLine('Plan / očekivano').innerText());

    // the page rounds to whole KM
    expect(Math.abs(amounts.reduce((a, b) => a + b, 0) - expected)).toBeLessThanOrEqual(1);
    expect(expected).toBeGreaterThanOrEqual(plan);

    const [margin] = parseLocalNumbers(await overviewPage.totalLine('Marža').innerText());
    expect(margin).toBeGreaterThan(0);
    expect(margin).toBeLessThan(100);
  });

  test('tools below their minimum are flagged', async ({ overviewPage, page }) => {
    await overviewPage.goto();
    // the header row ('Alat | Stanje | Minimum') has no stock number
    const rows = overviewPage.toolRows().filter({ has: page.locator('b') });
    await expect(rows).toHaveCount(3);

    // Possible a11y bug (not asserted): the flag is only a colour/class, no text or ARIA.
    let flagged = 0;
    for (const row of await rows.all()) {
      const stock = parseLocalNumber(await row.locator('b').innerText());
      const minimum = parseLocalNumbers(await row.innerText()).at(-1)!;
      if (stock < minimum) {
        flagged++;
        await expect(row.locator('b')).toHaveClass(/warn/);
      } else {
        await expect(row.locator('b')).not.toHaveClass(/warn/);
      }
    }
    expect(flagged).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { name: 'Planirani servis' })).toBeVisible();
    await expect(overviewPage.card('Alati i održavanje')).toContainText(
      /CNC-0\d[\s\S]*(Ponedjeljak|Utorak|Srijeda|Četvrtak|Petak)[\s\S]*\d+(,\d+)? h/,
    );
  });

  test('upstream changes are reflected in the overview', async ({
    plannedOrder,
    workPage,
    qualityPage,
    overviewPage,
  }) => {
    const scrapTotal = async () =>
      parseLocalNumber(/Škart\s*(\d+) kom/.exec(await overviewPage.card('Kvalitet i škart').innerText())![1]);

    await test.step('enter work with downtime and inspect 5 / 3 / 2', async () => {
      await workPage.goto(`&order=${plannedOrder.index}`);
      await workPage.logWork(5, 45, 30, 'Kvar');
      await workPage.logWork(5);
      await qualityPage.goto(`&order=${plannedOrder.index}`);
      await expect(qualityPage.kpi('Čeka kontrolu')).toBeVisible();
      await qualityPage.inspect(5, 3, 2, 'Mjere van tolerancije');
    });

    await overviewPage.goto();
    await expect.poll(() => overviewPage.orderCountValue()).toBe(9);
    const changed = {
      value: await overviewPage.kpiValue('Vrijednost naloga'),
      scrap: await scrapTotal(),
      downtime: await overviewPage.kpiValue('Zabilježeni zastoji'),
    };

    await test.step('the new order is in the plan list and in the scrap list', async () => {
      await expect(overviewPage.card('Plan proizvodnje').getByRole('link', { name: plannedOrder.id })).toHaveAttribute(
        'href',
        `plan.html?lang=bs&order=${plannedOrder.index}`,
      );
      await expect(overviewPage.card('Kvalitet i škart')).toContainText(
        new RegExp(`${plannedOrder.id}\\s*3 kom`),
      );
    });

    await test.step('after the reset the seed figures are back', async () => {
      await overviewPage.resetButton.click();
      await expect.poll(() => overviewPage.orderCountValue()).toBe(8);
      expect(await overviewPage.kpiValue('Vrijednost naloga')).toBeLessThan(changed.value);
      expect(await scrapTotal()).toBe(changed.scrap - 3);
      expect(await overviewPage.kpiValue('Zabilježeni zastoji')).toBeLessThanOrEqual(changed.downtime - 30);
    });
  });

  test('the contact link leads to the contact footer of the home page', async ({ overviewPage, page }) => {
    await overviewPage.goto();
    await expect(overviewPage.contactLink).toHaveAttribute('href', /#kontakt$/);
    await overviewPage.contactLink.click();
    await expect(page).toHaveURL(/\/\?lang=bs#kontakt$/);
  });
});
