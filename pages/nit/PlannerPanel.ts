import { type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumber } from '../../utils/nitData';

/** Tool 02 – production planner that schedules orders over 10 working days. */
export class PlannerPanel {
  readonly panel: Locator;
  readonly generate: Locator;
  readonly status: Locator;
  readonly result: Locator;
  readonly rawSummary: Locator;
  readonly importList: Locator;
  readonly applyList: Locator;
  readonly resetList: Locator;
  readonly importMessage: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.locator('#panel-plan');
    this.generate = this.panel.getByRole('button', { name: 'Generiši proizvodni plan' });
    this.status = page.locator('#plan-dirty');
    this.result = page.locator('#plan-result');
    this.rawSummary = page.locator('#raw-summary');
    this.importList = this.panel.getByRole('textbox', { name: /^Ulazni nalozi/ });
    this.applyList = this.panel.getByRole('button', { name: 'Primijeni listu' });
    this.resetList = this.panel.getByRole('button', { name: 'Vrati demo podatke' });
    this.importMessage = page.locator('#import-error');
  }

  setting(name: 'Pravilo rasporeda' | 'Mašina po ćeliji' | 'Smjena dnevno' | 'Raspoloživi kapacitet'): Locator {
    return this.panel.getByRole('combobox', { name, exact: true });
  }

  /** Reads one KPI tile from the generated plan, e.g. kpi('Završava u roku') → 9 */
  async kpi(label: 'Završava u roku' | 'Čeka materijal' | 'Popunjenost kapaciteta'): Promise<number> {
    const tile = this.result.locator('.kpi-grid > div', { has: this.page.locator('small', { hasText: label }) });
    await expect(tile).toBeVisible();
    return parseLocalNumber(await tile.locator('strong').textContent());
  }

  /** "od 17 otvorenih naloga" → 17 */
  async openOrders(): Promise<number> {
    const note = this.result.getByText(/^od \d+ otvorenih naloga$/);
    await expect(note).toBeVisible();
    return parseLocalNumber(await note.textContent());
  }

  async generatePlan() {
    await this.generate.click();
    await expect(this.status).toHaveText('Plan ažuriran — trenutni podaci i pravila.');
  }

  async openImportEditor() {
    await this.panel.locator('summary', { hasText: 'Ulazna lista' }).click();
    await this.panel.locator('summary', { hasText: 'Izmijeni / zalijepi ulazne podatke' }).click();
    await expect(this.importList).toBeVisible();
  }
}
