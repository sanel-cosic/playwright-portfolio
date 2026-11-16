import { type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumbers } from '../../utils/nitData';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 04 Rad i zastoji: orders in progress, work entry form, downtime log. */
export class WorkPage extends BusinessSystemPage {
  readonly table: Locator;
  readonly piecesInput: Locator;
  readonly minutesInput: Locator;
  readonly downtimeInput: Locator;
  readonly downtimeReason: Locator;
  readonly saveButton: Locator;
  readonly entryStatus: Locator;
  readonly remainingText: Locator;
  readonly recentChanges: Locator;

  constructor(page: Page) {
    super(page, 'proizvodnja');
    this.table = page.getByRole('table');
    this.piecesInput = page.getByRole('spinbutton', { name: 'Obrađeni komadi kom' });
    this.minutesInput = page.getByRole('spinbutton', { name: 'Vrijeme obrade min' });
    this.downtimeInput = page.getByRole('spinbutton', { name: 'Zastoj min' });
    this.downtimeReason = page.getByRole('combobox', { name: 'Razlog zastoja' });
    this.saveButton = page.getByRole('button', { name: 'Sačuvaj unos' });
    this.entryStatus = this.workspace.getByRole('status').first();
    this.remainingText = page.getByText(/Preostalo: \d+ kom/);
    // Innermost section/aside holding the heading (outer containers come first in DOM order)
    this.recentChanges = page
      .locator('section, aside')
      .filter({ has: page.getByRole('heading', { name: 'Posljednje promjene' }) })
      .last();
  }

  orderRow(id: string): Locator {
    return this.table.getByRole('row').filter({ hasText: new RegExp(`^\\s*${id}`) });
  }

  /** Cells of an order row as numbers: Obrađeno "5 / 100", Za kupca "0 / 100", Preostalo "14,3 h". */
  async rowValues(id: string) {
    const cells = this.orderRow(id).getByRole('cell');
    const [processed, processedTarget] = parseLocalNumbers(await cells.nth(1).innerText());
    const [forCustomer, customerTarget] = parseLocalNumbers(await cells.nth(2).innerText());
    const [remainingHours] = parseLocalNumbers(await cells.nth(3).innerText());
    return { processed, processedTarget, forCustomer, customerTarget, remainingHours };
  }

  async remainingPieces(): Promise<number> {
    return parseLocalNumbers((await this.remainingText.innerText()).replace(/^.*Preostalo:/, ''))[0];
  }

  /** Saves one work entry and waits for the confirmation toast. */
  async logWork(pieces: number, minutes = 45, downtime = 0, reason?: string) {
    await this.piecesInput.fill(String(pieces));
    await this.minutesInput.fill(String(minutes));
    await this.downtimeInput.fill(String(downtime));
    if (reason) await this.downtimeReason.selectOption({ label: reason });
    await this.saveButton.click();
    await expect(this.toast('Rad je evidentiran.')).toBeVisible();
  }
}
