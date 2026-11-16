import { type Locator, type Page } from '@playwright/test';
import { parseLocalNumber } from '../../utils/nitData';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 06 Pregled firme: filters, material what-if, cards with figures. Page rounds to whole KM. */
export class OverviewPage extends BusinessSystemPage {
  readonly historyFilter: Locator;
  readonly machineFilter: Locator;
  readonly customerFilter: Locator;
  readonly orderCount: Locator;
  readonly chart: Locator;
  readonly chartBars: Locator;
  readonly contactLink: Locator;

  constructor(page: Page) {
    super(page, 'pregled');
    this.historyFilter = page.getByRole('combobox', { name: 'Historija' });
    this.machineFilter = page.getByRole('combobox', { name: 'Mašina' });
    this.customerFilter = page.getByRole('combobox', { name: 'Kupac' });
    // "N naloga" also appears under "Rok u riziku", so scope it to the Poslovanje card
    this.orderCount = this.card('Poslovanje').getByText(/^\d+ naloga$/);
    this.chart = page.getByRole('img', { name: 'Historija vrijednosti poslova i troškova' });
    this.chartBars = this.chart.locator('text').filter({ hasText: /^S\d+$/ });
    this.contactLink = page.getByRole('link', { name: /^Razgovarajmo o vašem poslu/ });
  }

  whatIf(name: 'Osnova' | '+10%' | '+20%'): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Card by its heading, e.g. card('Alati i održavanje'). */
  card(heading: string): Locator {
    return this.page
      .locator('article, section')
      .filter({ has: this.page.getByRole('heading', { name: heading, exact: true }) })
      .last();
  }

  /** Breakdown button of the selected order, aria-label like "Materijal: 870,61 KM". */
  breakdownButton(label: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${label}: `) });
  }

  /** All breakdown amounts in 'Kalkulacija i odstupanja'. */
  async breakdownAmounts(): Promise<number[]> {
    const buttons = this.card('Kalkulacija i odstupanja').getByRole('button', { name: /^[^:]+: [\d.,]+ KM$/ });
    const names = await buttons.evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''));
    return names.map(n => parseLocalNumber(n.split(':')[1]));
  }

  async orderCountValue(): Promise<number> {
    return parseLocalNumber(await this.orderCount.first().innerText());
  }

  /** Tool rows without the header row (only data rows have the <b> stock number). */
  toolRows(): Locator {
    return this.page.locator('.toolrow').filter({ has: this.page.locator('b') });
  }
}
