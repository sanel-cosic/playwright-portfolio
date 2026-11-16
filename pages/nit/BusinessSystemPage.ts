import { type Locator, type Page, expect } from '@playwright/test';
import {
  businessStateKey,
  lockedStepTitle,
  parseLocalNumber,
  type BusinessSlug,
} from '../../utils/nitData';

/**
 * Shared shell of the six /poslovni-sistem/ pages: header, step nav, order picker,
 * language links, undo/reset and toasts. State lives in localStorage, and every
 * Playwright test gets a fresh context, so each test starts from the seed data.
 */
export abstract class BusinessSystemPage {
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly stepNav: Locator;
  /** Steps 02–05 while no quote is accepted: <a aria-disabled> without href or link role. */
  readonly lockedSteps: Locator;
  readonly languageMenu: Locator;
  readonly languageToggle: Locator;
  readonly orderPicker: Locator;
  readonly undoButton: Locator;
  readonly resetButton: Locator;
  readonly workspace: Locator;

  protected constructor(
    protected readonly page: Page,
    readonly slug: BusinessSlug,
  ) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.backLink = page.getByRole('link', { name: 'Povratak na nIT' });
    this.stepNav = page.getByRole('navigation', { name: 'Tok jednog naloga' });
    this.lockedSteps = this.stepNav.getByTitle(lockedStepTitle);
    this.languageMenu = page.locator('header details.lang');
    this.languageToggle = this.languageMenu.locator('summary');
    this.orderPicker = page.getByRole('combobox', { name: 'Odaberite nalog' });
    this.undoButton = page.getByRole('button', { name: 'Vrati posljednju promjenu' });
    this.resetButton = page.getByRole('button', { name: 'Početni podaci' });
    this.workspace = page.locator('#workspace');
  }

  /** Opens this page. Extra query, e.g. '&order=8', is appended to ?lang=bs. */
  async goto(extraQuery = '', lang = 'bs') {
    await this.page.goto(`/poslovni-sistem/${this.slug}.html?lang=${lang}${extraQuery}`);
    await expect(this.heading).toBeVisible();
  }

  /** An enabled step link, e.g. step('Materijal i nabavka'). */
  step(label: string): Locator {
    return this.stepNav.getByRole('link', { name: new RegExp(`^0\\d ${label}`) });
  }

  languageLink(name: 'Bosanski' | 'English' | 'Deutsch'): Locator {
    return this.languageMenu.getByRole('link', { name, exact: true });
  }

  async openLanguageMenu() {
    await this.languageToggle.click();
    await expect(this.languageMenu).toHaveAttribute('open', '');
  }

  /** Picks an order by id, e.g. 'RN-2602' (option text is "RN-2602 · <part>"). */
  async pickOrder(id: string) {
    const label = await this.orderPicker
      .locator('option', { hasText: new RegExp(`^${id}\\b`) })
      .first()
      .innerText();
    await this.orderPicker.selectOption({ label: label.trim() });
  }

  /** Text of the selected order option, e.g. "RN-2609 · Nosač M12". */
  selectedOrder(): Promise<string> {
    return this.orderPicker.evaluate((s: HTMLSelectElement) => s.selectedOptions[0]?.text ?? '');
  }

  orderOptions(): Promise<string[]> {
    return this.orderPicker.locator('option').allInnerTexts();
  }

  /** Header field of the selected order: 'Kupac' | 'Količina' | 'Rok isporuke'. */
  headerField(label: 'Kupac' | 'Količina' | 'Rok isporuke'): Locator {
    return this.page.getByText(label, { exact: true }).first().locator('..');
  }

  /** A toast / status message containing the text. */
  toast(text: string | RegExp): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  /** A KPI block (label + value). Read its number with kpiValue(). */
  kpi(label: string): Locator {
    return this.page.locator('.kpi').filter({ has: this.page.getByText(label, { exact: true }) });
  }

  /** A total line (div.totalline: label + value), e.g. 'Očekivani trošak / kom', 'Plan / očekivano', 'Marža'. */
  totalLine(label: string): Locator {
    return this.page.locator('.totalline').filter({ has: this.page.getByText(label, { exact: true }) });
  }

  async kpiValue(label: string): Promise<number> {
    const text = await this.kpi(label).innerText();
    return parseLocalNumber(text.replace(label, ''));
  }

  /** Parsed business-system state from localStorage (only for persistence assertions). */
  async readState(): Promise<{ orders?: unknown[] } & Record<string, unknown>> {
    return this.page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), businessStateKey);
  }

  async expectLocked() {
    await expect(this.lockedSteps).toHaveCount(4);
    for (const el of await this.lockedSteps.all()) {
      await expect(el).toHaveAttribute('aria-disabled', 'true');
      await expect(el).not.toHaveAttribute('href', /.+/);
    }
  }

  async expectUnlocked() {
    await expect(this.lockedSteps).toHaveCount(0);
    for (const label of ['Materijal i nabavka', 'Plan proizvodnje', 'Rad i zastoji', 'Kvalitet i dorada']) {
      await expect(this.step(label)).toHaveAttribute('href', /\.html\?lang=/);
    }
  }
}
