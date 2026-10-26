import { test, expect } from '../../fixtures';
import { checkoutCustomer, products } from '../../utils/testData';

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('user can buy two products end to end @smoke', async ({ inventoryPage, cartPage, checkoutPage }) => {
    await test.step('add products to cart', async () => {
      await inventoryPage.addToCart(products.backpack, products.bikeLight);
      await inventoryPage.openCart();
    });

    await test.step('review cart', async () => {
      await cartPage.expectLoaded();
      await cartPage.expectItems([products.backpack, products.bikeLight]);
      await cartPage.checkout();
    });

    await test.step('enter customer details and verify total', async () => {
      await checkoutPage.fillCustomer(checkoutCustomer);
      // Backpack $29.99 + Bike Light $9.99
      expect(await checkoutPage.itemTotalValue()).toBeCloseTo(39.98, 2);
    });

    await test.step('place order', async () => {
      await checkoutPage.finish();
      await checkoutPage.expectOrderComplete();
      await inventoryPage.expectCartCount(0);
    });
  });

  test('checkout requires customer details', async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.continueButton.click();

    await expect(checkoutPage.error).toContainText('First Name is required');
  });

  test('cart contents survive navigating back to the shop', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(products.boltTShirt);
    await inventoryPage.openCart();
    await cartPage.continueShoppingButton.click();

    await inventoryPage.expectCartCount(1);
  });
});
