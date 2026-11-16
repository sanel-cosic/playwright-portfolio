import { type Locator, type Page, expect } from '@playwright/test';
import { newOrder, parseLocalNumber } from '../../utils/nitData';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 01 Kalkulacija i ponuda: quote form, live result, batch comparison, preview and acceptance. */
export class QuotePage extends BusinessSystemPage {
  readonly form: Locator;
  readonly part: Locator;
  readonly customer: Locator;
  readonly quantity: Locator;
  readonly scrap: Locator;
  readonly unitPrice: Locator;
  readonly targetMargin: Locator;
  readonly suggestButton: Locator;
  readonly marginText: Locator;
  readonly belowTargetWarning: Locator;
  /** Shown instead of the result block while an input is invalid (two nodes carry it). */
  readonly incomplete: Locator;
  readonly breakdown: Locator;
  readonly formulaDialog: Locator;
  readonly previewButton: Locator;
  readonly preview: Locator;
  readonly saveButton: Locator;
  readonly acceptButton: Locator;
  readonly previewCloseButton: Locator;
  readonly record: Locator;
  readonly newOrderLink: Locator;
  readonly newDraftButton: Locator;

  constructor(page: Page) {
    super(page, 'kalkulacija');
    this.form = page.locator('#quotation-entry');
    this.part = page.getByRole('combobox', { name: 'Dio iz kataloga' });
    this.customer = page.getByRole('textbox', { name: 'Kupac' });
    this.quantity = page.getByRole('spinbutton', { name: 'Količina kom' });
    this.scrap = page.getByRole('spinbutton', { name: 'Dodatak za škart %' });
    this.unitPrice = page.getByRole('spinbutton', { name: 'Naša cijena po komadu KM' });
    this.targetMargin = page.getByRole('spinbutton', { name: 'Ciljana marža %' });
    this.suggestButton = page.getByRole('button', { name: 'Predloži cijenu prema ciljanoj marži ↗' });
    this.marginText = page.getByText(/^Marža: .*Nije neto dobit\.$/);
    this.belowTargetWarning = page.getByText('Trenutna cijena je ispod ciljane marže.');
    this.incomplete = page.getByText('Dopunite ispravne podatke za novi obračun.').first();
    this.breakdown = page.locator('#quote-breakdown');
    this.formulaDialog = page.locator('#quote-formula');
    this.previewButton = page.getByRole('button', { name: 'Pregledaj ponudu za kupca →' });
    this.preview = page.locator('#quote-preview');
    this.saveButton = this.preview.getByRole('button', { name: 'Sačuvaj ovu verziju ponude' });
    this.acceptButton = this.preview.getByRole('button', { name: 'Označi da je kupac prihvatio' });
    this.previewCloseButton = this.preview.getByRole('button', { name: 'Zatvori' });
    this.record = page.locator('#quote-record');
    this.newOrderLink = this.record.getByRole('link', { name: /^Otvori novi nalog RN-\d+/ });
    this.newDraftButton = page.getByRole('button', { name: 'Nova ponuda iz predloška' });
  }

  /** Result figure by label, e.g. result('Trošak po komadu'). */
  result(label:
    | 'Trošak po komadu'
    | 'Trošak cijele serije'
    | 'Ukupno za kupca bez PDV-a'
    | 'Ostaje nakon obračunatih troškova'): Locator {
    return this.page.getByText(label, { exact: true }).locator('..');
  }

  async resultValue(label: Parameters<QuotePage['result']>[0]): Promise<number> {
    return parseLocalNumber((await this.result(label).innerText()).replace(label, ''));
  }

  /** The margin percentage from "Marža: 15,7% · Nije neto dobit." */
  async marginValue(): Promise<number> {
    return parseLocalNumber(await this.marginText.innerText());
  }

  /** "50 kom" / "100 kom" / "500 kom" comparison button (name also contains the cost/kom). */
  batchButton(pieces: 50 | 100 | 500): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${pieces} kom`) });
  }

  /** Cost per piece printed on a batch button (the number after "<n> kom"). */
  async batchCost(pieces: 50 | 100 | 500): Promise<number> {
    const text = (await this.batchButton(pieces).innerText()).replace(new RegExp(`^\\s*${pieces} kom`), '');
    return parseLocalNumber(text);
  }

  /**
   * Breakdown amount button of a category. The buttons are named only by the amount
   * (possible a11y bug), so the row is found through the category label.
   */
  breakdownAmount(label: string): Locator {
    return this.breakdown.getByText(label, { exact: true }).locator('..').getByRole('button');
  }

  private async openDetails(id: string) {
    const details = this.page.locator(`details#${id}`);
    if (!(await details.evaluate((d: HTMLDetailsElement) => d.open))) {
      await details.locator('summary').click();
    }
    await expect(details).toHaveAttribute('open', '');
  }

  openTechnology() { return this.openDetails('technology'); }
  openBreakdown() { return this.openDetails('quote-breakdown'); }

  /** Is the input natively valid? (validation messages are browser-locale text) */
  isValid(input: Locator): Promise<boolean> {
    return input.evaluate((el: HTMLInputElement) => el.validity.valid);
  }

  async previewQuote() {
    await this.previewButton.click();
    await expect(this.preview).toBeVisible();
  }

  /**
   * Preview → save → accept on the current draft. On the untouched seed draft this
   * creates RN-2609 and unlocks steps 02–05.
   */
  async acceptQuote(): Promise<typeof newOrder> {
    await this.previewQuote();
    await this.saveButton.click();
    await this.acceptButton.click();
    await expect(this.preview).toBeHidden();
    await expect(this.record).toContainText(/kupac je prihvatio/i);
    await expect(this.newOrderLink).toHaveText(new RegExp(newOrder.id));
    return newOrder;
  }
}
