import { test as base } from '@playwright/test';
// SauceDemo
import { LoginPage } from '../pages/saucedemo/LoginPage';
import { InventoryPage } from '../pages/saucedemo/InventoryPage';
import { CartPage } from '../pages/saucedemo/CartPage';
import { CheckoutPage } from '../pages/saucedemo/CheckoutPage';
import { ProductDetailsPage } from '../pages/saucedemo/ProductDetailsPage';
// nIT
import { NitHomePage } from '../pages/nit/NitHomePage';
import { QuoteCalculator } from '../pages/nit/QuoteCalculator';
import { PlannerPanel } from '../pages/nit/PlannerPanel';
import { OrdersPanel } from '../pages/nit/OrdersPanel';
import { StockPanel } from '../pages/nit/StockPanel';
// API
import { BookingApi } from '../utils/BookingApi';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productDetailsPage: ProductDetailsPage;
  nitHome: NitHomePage;
  quote: QuoteCalculator;
  planner: PlannerPanel;
  orders: OrdersPanel;
  stock: StockPanel;
  bookingApi: BookingApi;
};

/**
 * Custom fixtures: every test gets ready-made page objects injected by name,
 * e.g. test('...', async ({ inventoryPage }) => { ... }).
 * Import { test, expect } from here instead of '@playwright/test'.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  nitHome: async ({ page }, use) => use(new NitHomePage(page)),
  quote: async ({ page }, use) => use(new QuoteCalculator(page)),
  planner: async ({ page }, use) => use(new PlannerPanel(page)),
  orders: async ({ page }, use) => use(new OrdersPanel(page)),
  stock: async ({ page }, use) => use(new StockPanel(page)),
  bookingApi: async ({ request }, use) => use(new BookingApi(request)),
});

export { expect } from '@playwright/test';
