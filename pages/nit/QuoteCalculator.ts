import { type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumber } from '../../utils/nitData';

export type QuoteField =
  | 'Dobri komadi za isporuku'
  | 'Sirovac po komadu'
  | 'Cijena materijala'
  | 'Planirani škart'
  | 'Ciljna marža'
  | 'Dodatna režija';

/** Fields that live inside the collapsed "Alati, režija i marža" section. */
const COLLAPSED_FIELDS: QuoteField[] = ['Ciljna marža', 'Dodatna režija'];

/** Tool 01 – production quote calculator. */
export class QuoteCalculator {
  readonly panel: Locator;
  readonly result: Locator;
  readonly unitPrice: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator('#panel-quote');
    this.result = page.locator('#cost-result');
    this.unitPrice = this.result.locator('strong').first();
    this.alert = this.result.getByRole('alert');
  }

  /** Inputs are named by their visible label, which also contains the unit ("… kom"). */
  input(field: QuoteField): Locator {
    return this.panel.getByRole('spinbutton', { name: new RegExp('^' + field) });
  }

  async set(field: QuoteField, value: number | string) {
    if (COLLAPSED_FIELDS.includes(field)) await this.expandSection('Alati, režija i marža');
    await this.input(field).fill(String(value));
  }

  async expandSection(title: string) {
    const section = this.panel.locator('details', { has: this.page.locator('summary', { hasText: title }) });
    if (!(await section.evaluate((d: HTMLDetailsElement) => d.open))) {
      await section.locator('summary').first().click();
    }
  }

  /** Value next to a label in the result panel, e.g. row('Trošak po komadu') → 30.22 */
  async row(label: string): Promise<number> {
    const row = this.result.locator('.cost-row', { hasText: label }).first();
    return parseLocalNumber(await row.locator('b').textContent());
  }

  async unitPriceValue(): Promise<number> {
    await expect(this.unitPrice).toHaveText(/\d+,\d{2} KM/);
    return parseLocalNumber(await this.unitPrice.textContent());
  }

  /** Snapshot of the headline numbers shown for the current inputs. */
  async totals() {
    return {
      unitPrice: await this.unitPriceValue(),
      totalPrice: await this.row('Ponuda za'),
      unitCost: await this.row('Trošak po komadu'),
      contribution: await this.row('Razlika cijene i troška'),
      plannedInput: await this.row('Planirati ulaznih komada'),
    };
  }

  /** Unit prices from the "compare batches" block (50 / 240 / 1.000 kom). */
  async batchPrices(): Promise<number[]> {
    await this.expandSection('Uporedi serije');
    const prices = this.result.locator('.batch-grid b');
    await expect(prices).toHaveCount(3);
    return (await prices.allTextContents()).map(parseLocalNumber);
  }
}
