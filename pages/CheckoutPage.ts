import { type Locator, type Page, expect } from '@playwright/test';

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly itemTotal: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.error = page.getByTestId('error');
    this.itemTotal = page.getByTestId('subtotal-label');
    this.completeHeader = page.getByTestId('complete-header');
  }

  async fillCustomer(customer: { firstName: string; lastName: string; postalCode: string }) {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
    await this.continueButton.click();
  }

  /** Reads "Item total: $39.98" from the overview step and returns 39.98. */
  async itemTotalValue(): Promise<number> {
    const text = (await this.itemTotal.textContent()) ?? '';
    return Number(text.replace(/[^0-9.]/g, ''));
  }

  async finish() {
    await this.finishButton.click();
  }

  async expectOrderComplete() {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
