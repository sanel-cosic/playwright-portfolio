import { type Locator, type Page } from '@playwright/test';
import { stockItems } from '../../utils/nitData';

export type StockItem = keyof typeof stockItems;

/** Tool 04 – stock levels with reorder warnings. */
export class StockPanel {
  readonly panel: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator('#panel-stock');
    this.alert = page.locator('#stock-alert');
  }

  input(item: StockItem): Locator {
    return this.panel.getByRole('spinbutton', { name: stockItems[item].input });
  }

  /** The status text shown in the same row as the input ("Dovoljna zaliha" / "Dopuniti …"). */
  status(item: StockItem): Locator {
    // `has` is evaluated relative to each row, so use an unscoped role locator here
    const input = this.page.getByRole('spinbutton', { name: stockItems[item].input });
    return this.panel.locator('.stock-row', { has: input }).locator('.stock-status');
  }

  async setQuantity(item: StockItem, value: number | string) {
    await this.input(item).fill(String(value));
  }
}
