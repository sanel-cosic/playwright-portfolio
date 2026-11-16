import { type Locator, type Page, expect } from '@playwright/test';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 05 Kvalitet i dorada: batch inspection and rework confirmation. */
export class QualityPage extends BusinessSystemPage {
  readonly accepted: Locator;
  readonly scrap: Locator;
  readonly reworkInput: Locator;
  readonly cause: Locator;
  readonly allocation: Locator;
  readonly allocationHint: Locator;
  readonly confirmInspection: Locator;
  readonly confirmRework: Locator;
  /** Replaces the whole workspace once every processed piece is inspected. */
  readonly doneHeading: Locator;
  readonly continueLink: Locator;

  constructor(page: Page) {
    super(page, 'kvalitet');
    this.accepted = page.getByRole('spinbutton', { name: 'Prihvaćeno kom' });
    this.scrap = page.getByRole('spinbutton', { name: 'Škart kom' });
    this.reworkInput = page.getByRole('spinbutton', { name: 'Dorada kom' });
    this.cause = page.getByRole('combobox', { name: 'Uzrok' });
    this.allocation = page.getByText(/^Raspoređeno: /);
    this.allocationHint = page.getByText(/^Zbir prihvaćenih, odbačenih i komada za doradu/);
    this.confirmInspection = page.getByRole('button', { name: 'Potvrdi kontrolu' });
    this.confirmRework = page.getByRole('button', { name: 'Potvrdi doradu i prihvati komade' });
    this.doneHeading = page.getByRole('heading', { name: 'Ova kontrola je završena' });
    this.continueLink = page.getByRole('link', { name: 'Nastavi obradu →' });
  }

  /** Fills the inspection split and confirms it. */
  async inspect(accepted: number, scrap: number, rework: number, cause?: string) {
    await this.accepted.fill(String(accepted));
    await this.scrap.fill(String(scrap));
    await this.reworkInput.fill(String(rework));
    if (cause) await this.cause.selectOption({ label: cause });
    await this.confirmInspection.click();
    await expect(this.toast('Kontrola je evidentirana')).toBeVisible();
  }
}
