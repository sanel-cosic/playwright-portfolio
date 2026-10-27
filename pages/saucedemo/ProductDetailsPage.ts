import { type Locator, type Page, expect } from '@playwright/test';

export class ProductDetailsPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly backButton: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    // The details page reuses the inventory card test ids, but holds only one item
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.description = page.getByTestId('inventory-item-desc');
    this.backButton = page.getByRole('button', { name: 'Back to products' });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+/);
    await expect(this.backButton).toBeVisible();
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async remove() {
    await this.removeButton.click();
  }

  async backToProducts() {
    await this.backButton.click();
  }

  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
