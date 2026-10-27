import { type Locator, type Page, expect } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly itemImages: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    // CSS selector on purpose: each image has its own data-test id, so there is no shared test id
    this.itemImages = page.locator('img.inventory_item_img');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    // The sidebar entry is an <a> with role="button", so it is not a link to assistive tech
    this.logoutLink = page.getByRole('button', { name: 'Logout' });
  }

  async goto() {
    await this.page.goto('/inventory.html', { waitUntil: 'domcontentloaded' });
    await expect(this.title).toHaveText('Products');
  }

  /** A single product card, located by its visible name. */
  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async addToCart(...names: string[]) {
    for (const name of names) {
      await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
    }
  }

  /** Opens a product's details page by clicking its name. */
  async openProduct(name: string) {
    // The image is a second button with the same accessible name, so take the first (the title)
    await this.item(name).getByRole('button', { name: `View details for ${name}` }).first().click();
    // The details page reuses the card test ids and button names, and the URL changes before
    // the cards are unmounted, so wait for the details-only Back button and for the list to go
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+/);
    await expect(this.page.getByRole('button', { name: 'Back to products' })).toBeVisible();
    await expect(this.items).toHaveCount(1);
  }

  async removeFromCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }

  async prices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
