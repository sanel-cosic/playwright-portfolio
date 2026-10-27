// spec: specs/QAP-2.md
// seed: tests/saucedemo/seed.spec.ts

import { test, expect } from '../../fixtures';
import { products } from '../../utils/testData';

test.describe('Product details', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test("user can open a product's details page by clicking its name @smoke", async ({
    inventoryPage,
    productDetailsPage,
    page,
  }) => {
    // 1. Click the name link of 'Sauce Labs Backpack' inside its card
    await inventoryPage.openProduct(products.backpack);

    await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
    await expect(productDetailsPage.name).toHaveText(products.backpack);
    await expect(productDetailsPage.backButton).toBeVisible();
    await expect(productDetailsPage.description).toBeVisible();
    await expect(productDetailsPage.description).not.toBeEmpty();
  });

  test('each product name opens the details page for that product', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. For each product, go to inventory and click the product's name
    await expect(inventoryPage.items).toHaveCount(6);
    const names = await inventoryPage.itemNames.allTextContents();

    for (const name of names) {
      await test.step(`opens details for ${name}`, async () => {
        await inventoryPage.goto();
        await inventoryPage.openProduct(name);

        await productDetailsPage.expectLoaded();
        await expect(productDetailsPage.name).toHaveText(name);
      });
    }
  });

  test('product details shows the same name and price as the inventory list @smoke', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Read name and price of the Backpack card, then open its details page
    const card = inventoryPage.item(products.backpack);
    const name = (await card.getByTestId('inventory-item-name').textContent()) ?? '';
    const price = (await card.getByTestId('inventory-item-price').textContent()) ?? '';
    expect(price).toMatch(/^\$\d+\.\d{2}$/);

    await inventoryPage.openProduct(products.backpack);

    await expect(productDetailsPage.name).toHaveText(name);
    await expect(productDetailsPage.price).toHaveText(price);
  });

  test('name and price match the inventory for every product', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. For each product record name and price from its card, open details, compare
    await expect(inventoryPage.items).toHaveCount(6);
    const names = await inventoryPage.itemNames.allTextContents();
    const prices = await inventoryPage.itemPrices.allTextContents();
    expect(prices).toHaveLength(names.length);

    const shown: { name: string; price: string }[] = [];

    for (const [i, name] of names.entries()) {
      await test.step(`${name} matches its inventory card`, async () => {
        await inventoryPage.openProduct(name);

        await expect(productDetailsPage.name).toHaveText(name);
        await expect(productDetailsPage.price).toHaveText(prices[i]);
        shown.push({
          name: (await productDetailsPage.name.textContent()) ?? '',
          price: (await productDetailsPage.price.textContent()) ?? '',
        });

        await productDetailsPage.backToProducts();
        await expect(inventoryPage.title).toHaveText('Products');
      });
    }

    // Products sharing a price must still show different names
    await test.step('products with the same price show different names', async () => {
      const byPrice = new Map<string, string[]>();
      for (const { name, price } of shown) {
        byPrice.set(price, [...(byPrice.get(price) ?? []), name]);
      }
      const duplicates = [...byPrice.values()].filter((group) => group.length > 1);
      expect(duplicates.length).toBeGreaterThan(0);
      for (const group of duplicates) {
        expect(new Set(group).size).toBe(group.length);
      }
    });
  });

  test('user can add a product to the cart from its details page @smoke', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Open Backpack details, assert no badge, click 'Add to cart'
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.expectLoaded();
    await productDetailsPage.expectCartCount(0);

    await productDetailsPage.addToCart();

    await productDetailsPage.expectCartCount(1);
    await expect(productDetailsPage.removeButton).toBeVisible();
    await expect(productDetailsPage.addToCartButton).toBeHidden();
  });

  test('cart badge increments from an existing count when adding from details', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Add Bike Light on inventory, then open Onesie details and add it
    await inventoryPage.addToCart(products.bikeLight);
    await inventoryPage.expectCartCount(1);

    await inventoryPage.openProduct(products.onesie);
    await productDetailsPage.expectLoaded();
    await productDetailsPage.expectCartCount(1);

    await productDetailsPage.addToCart();

    await productDetailsPage.expectCartCount(2);
    await expect(productDetailsPage.removeButton).toBeVisible();
  });

  test('user can remove a product from its details page and the badge clears', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Open Backpack details, Add to cart, click 'Remove'
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.addToCart();
    await productDetailsPage.expectCartCount(1);

    await productDetailsPage.remove();

    await productDetailsPage.expectCartCount(0);
    await expect(productDetailsPage.addToCartButton).toBeVisible();
    await expect(productDetailsPage.cartLink).toHaveAccessibleName('Cart, empty');
  });

  test('removing the details item with two items in the cart decrements the badge from 2 to 1', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 2. Variant: one item added on inventory, one on details, remove the details item
    await inventoryPage.addToCart(products.bikeLight);
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.addToCart();
    await productDetailsPage.expectCartCount(2);

    await productDetailsPage.remove();

    await productDetailsPage.expectCartCount(1);
    await expect(productDetailsPage.addToCartButton).toBeVisible();
  });

  test('a product already in the cart shows Remove and the badge on its details page', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Add Backpack on inventory, then open its details page
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.expectCartCount(1);

    await inventoryPage.openProduct(products.backpack);

    await expect(productDetailsPage.removeButton).toBeVisible();
    await expect(productDetailsPage.addToCartButton).toBeHidden();
    await productDetailsPage.expectCartCount(1);
  });

  test('user can return to the inventory with Back to products @smoke', async ({
    inventoryPage,
    productDetailsPage,
    page,
  }) => {
    // 1. Open a product's details page, click 'Back to products'
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.expectLoaded();

    await productDetailsPage.backToProducts();

    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('cart state added on the details page persists after Back to products', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Open Backpack details, Add to cart, click Back to products
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.addToCart();
    await productDetailsPage.backToProducts();

    await expect(inventoryPage.title).toHaveText('Products');
    await inventoryPage.expectCartCount(1);
    await expect(
      inventoryPage.item(products.backpack).getByRole('button', { name: 'Remove' }),
    ).toBeVisible();
    await expect(inventoryPage.items.getByRole('button', { name: 'Add to cart' })).toHaveCount(5);
  });

  test('removing a product on the details page is reflected after Back to products', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    // 1. Add Backpack on inventory, open its details, Remove, Back to products
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.expectCartCount(1);
    await inventoryPage.openProduct(products.backpack);
    await productDetailsPage.remove();
    await productDetailsPage.backToProducts();

    await expect(inventoryPage.title).toHaveText('Products');
    await inventoryPage.expectCartCount(0);
    await expect(
      inventoryPage.item(products.backpack).getByRole('button', { name: 'Add to cart' }),
    ).toBeVisible();
  });
});
