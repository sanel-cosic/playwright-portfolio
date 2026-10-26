import { type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumber } from '../../utils/nitData';

/** Tool 03 – order overview with filters, pagination and inline editing. */
export class OrdersPanel {
  readonly panel: Locator;
  readonly search: Locator;
  readonly cellFilter: Locator;
  readonly clearFilters: Locator;
  readonly count: Locator;
  readonly pageInfo: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;
  readonly rows: Locator;
  readonly visibleRows: Locator;
  readonly kpis: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator('#panel-orders');
    this.search = this.panel.getByRole('searchbox', { name: 'Pretraga' });
    this.cellFilter = this.panel.getByRole('combobox', { name: 'Ćelija', exact: true });
    this.clearFilters = this.panel.getByRole('button', { name: 'Očisti filtere' });
    this.count = page.locator('#filter-count');
    this.pageInfo = this.panel.getByText(/^\d+–\d+ \/ \d+ naloga$/);
    this.nextPage = this.panel.getByRole('button', { name: 'Sljedeća stranica naloga' });
    this.previousPage = this.panel.getByRole('button', { name: 'Prethodna stranica naloga' });
    this.rows = page.locator('#orders-body tr');
    this.visibleRows = page.locator('#orders-body tr:visible');
    this.kpis = page.locator('#order-kpis');
  }

  /** Row for one order, e.g. row('RN-036'). Use filters first if it may be on another page. */
  row(orderId: string): Locator {
    return this.rows.filter({ has: this.page.locator('b', { hasText: new RegExp(`^${orderId}$`) }) });
  }

  async expectShowing(shown: number, total: number) {
    await expect(this.count).toHaveText(`Prikazano ${shown} od ${total} naloga. Filteri se primjenjuju zajedno.`);
  }

  async kpi(label: 'Filtrirani nalozi' | 'Preostali komadi' | 'Preostali rad' | 'Otvoreni bez materijala') {
    const tile = this.kpis.locator('div', { has: this.page.locator('small', { hasText: label }) });
    await expect(tile).toBeVisible();
    return parseLocalNumber(await tile.locator('strong').textContent());
  }

  async findOrder(orderId: string) {
    await this.search.fill(orderId);
    await expect(this.row(orderId)).toBeVisible();
  }

  async setFinishedPieces(orderId: string, pieces: number) {
    const row = this.row(orderId);
    await row.locator('summary', { hasText: 'Detalji / izmjena' }).click();
    await row.getByLabel('Završeni komadi').fill(String(pieces));
    await row.getByRole('button', { name: 'Primijeni' }).click();
  }

  async setMaterial(orderId: string, value: 'Spreman' | 'Nedostaje') {
    await this.page.getByRole('combobox', { name: `Spremnost materijala ${orderId}` }).selectOption({ label: value });
  }
}
