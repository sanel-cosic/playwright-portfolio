import { type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumber } from '../../utils/nitData';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 02 Materijal i nabavka: stock table, KPIs, reservation and simulated receipt. */
export class MaterialPage extends BusinessSystemPage {
  readonly table: Locator;
  readonly reserveButton: Locator;
  readonly receiveButton: Locator;

  constructor(page: Page) {
    super(page, 'materijal');
    this.table = page.getByRole('table');
    // Labels change after the action ("Rezervisano za nalog", "Demo prijem evidentiran")
    this.reserveButton = page.getByRole('button', { name: /^(Rezerviši materijal|Rezervisano za nalog)/ });
    this.receiveButton = page.getByRole('button', { name: /^(Simuliraj prijem materijala|Demo prijem evidentiran)/ });
  }

  /** Table row of a material, e.g. materialRow('Čelik C45'). */
  materialRow(name: string | RegExp): Locator {
    return this.table.getByRole('row').filter({ hasText: name });
  }

  /** Numeric cell of a material row: Na stanju (1), Rezervisano (2), Treba nalogu (3). */
  async cellValue(row: Locator, column: 'Na stanju' | 'Rezervisano' | 'Treba nalogu'): Promise<number> {
    const index = { 'Na stanju': 1, Rezervisano: 2, 'Treba nalogu': 3 }[column];
    return parseLocalNumber(await row.getByRole('cell').nth(index).innerText());
  }

  /** The first table row that the selected order needs material from (Treba nalogu > 0). */
  async neededRow(): Promise<Locator> {
    const rows = this.table.locator('tbody tr');
    for (const row of await rows.all()) {
      // Rows the order does not use show a dash ("—") instead of a number
      const text = await row.getByRole('cell').nth(3).innerText();
      if (/\d/.test(text) && parseLocalNumber(text) > 0) return row;
    }
    throw new Error('No material row with a need for the selected order');
  }

  async reserve() {
    await this.reserveButton.click();
    await expect(this.reserveButton).toHaveText(/Rezervisano za nalog/);
    await expect(this.reserveButton).toBeDisabled();
  }
}
