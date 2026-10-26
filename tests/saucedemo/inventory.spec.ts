import { test, expect } from '../../fixtures';
import { products } from '../../utils/testData';

test.describe('Inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('shows the full product catalogue @smoke', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('sorts products by price, low to high', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);
    const expected = (await inventoryPage.prices()).sort((a, b) => a - b);

    await inventoryPage.sortBy('lohi');

    // Poll: a single read can land before the list has re-rendered in the new order
    await expect.poll(() => inventoryPage.prices()).toEqual(expected);
  });

  test('sorts products by name, Z to A', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);
    const expected = (await inventoryPage.itemNames.allTextContents()).sort().reverse();

    await inventoryPage.sortBy('za');

    await expect.poll(() => inventoryPage.itemNames.allTextContents()).toEqual(expected);
  });

  test('cart badge tracks added and removed items', async ({ inventoryPage }) => {
    await inventoryPage.expectCartCount(0);

    await inventoryPage.addToCart(products.backpack, products.bikeLight);
    await inventoryPage.expectCartCount(2);

    await inventoryPage.removeFromCart(products.backpack);
    await inventoryPage.expectCartCount(1);
  });

  test('product images load (no broken images)', async ({ inventoryPage }) => {
    await expect(inventoryPage.itemImages).toHaveCount(6);

    for (const img of await inventoryPage.itemImages.all()) {
      // naturalWidth is 0 both while an image is still loading AND when it is broken,
      // so keep polling until it has loaded; a truly broken image still fails (Case #1).
      await expect
        .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
          message: `broken image: ${await img.getAttribute('src')}`,
        })
        .toBe(true);
    }
  });
});
