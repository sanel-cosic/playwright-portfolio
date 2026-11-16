import { test as base } from '@playwright/test';
// SauceDemo
import { LoginPage } from '../pages/saucedemo/LoginPage';
import { InventoryPage } from '../pages/saucedemo/InventoryPage';
import { CartPage } from '../pages/saucedemo/CartPage';
import { CheckoutPage } from '../pages/saucedemo/CheckoutPage';
import { ProductDetailsPage } from '../pages/saucedemo/ProductDetailsPage';
// nIT
import { NitHomePage } from '../pages/nit/NitHomePage';
import { ContactDialog } from '../pages/nit/ContactDialog';
import { ConfiguratorPage } from '../pages/nit/ConfiguratorPage';
import { QuotePage } from '../pages/nit/QuotePage';
import { MaterialPage } from '../pages/nit/MaterialPage';
import { PlanPage } from '../pages/nit/PlanPage';
import { WorkPage } from '../pages/nit/WorkPage';
import { QualityPage } from '../pages/nit/QualityPage';
import { OverviewPage } from '../pages/nit/OverviewPage';
import { newOrder } from '../utils/nitData';
// API
import { BookingApi } from '../utils/BookingApi';

type NitOrder = typeof newOrder;

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productDetailsPage: ProductDetailsPage;
  nitHome: NitHomePage;
  contactDialog: ContactDialog;
  configurator: ConfiguratorPage;
  quotePage: QuotePage;
  materialPage: MaterialPage;
  planPage: PlanPage;
  workPage: WorkPage;
  qualityPage: QualityPage;
  overviewPage: OverviewPage;
  /** Seed quote accepted through the UI → RN-2609 exists, steps 02–05 unlocked. Page stays on 01. */
  acceptedQuote: NitOrder;
  /** acceptedQuote + material reserved for RN-2609. Page stays on 02. */
  reservedOrder: NitOrder;
  /** reservedOrder + a free slot confirmed on 03. Page stays on 03. */
  plannedOrder: NitOrder;
  /** plannedOrder + two work entries of 5 pieces on 04 (10 pieces wait for inspection). Page stays on 04. */
  workedOrder: NitOrder;
  bookingApi: BookingApi;
};

/**
 * Custom fixtures: every test gets ready-made page objects injected by name,
 * e.g. test('...', async ({ inventoryPage }) => { ... }).
 * Import { test, expect } from here instead of '@playwright/test'.
 *
 * The nIT business-system chain fixtures drive the real UI (no localStorage seeding),
 * and every test has its own browser context, so each starts from the seed data.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  nitHome: async ({ page }, use) => use(new NitHomePage(page)),
  contactDialog: async ({ page }, use) => use(new ContactDialog(page)),
  configurator: async ({ page }, use) => use(new ConfiguratorPage(page)),
  quotePage: async ({ page }, use) => use(new QuotePage(page)),
  materialPage: async ({ page }, use) => use(new MaterialPage(page)),
  planPage: async ({ page }, use) => use(new PlanPage(page)),
  workPage: async ({ page }, use) => use(new WorkPage(page)),
  qualityPage: async ({ page }, use) => use(new QualityPage(page)),
  overviewPage: async ({ page }, use) => use(new OverviewPage(page)),

  acceptedQuote: async ({ quotePage }, use) => {
    await quotePage.goto();
    await use(await quotePage.acceptQuote());
  },
  reservedOrder: async ({ acceptedQuote, materialPage }, use) => {
    await materialPage.goto(`&order=${acceptedQuote.index}`);
    await materialPage.reserve();
    await use(acceptedQuote);
  },
  plannedOrder: async ({ reservedOrder, planPage }, use) => {
    await planPage.goto(`&order=${reservedOrder.index}`);
    await planPage.confirmFreeSlot();
    await use(reservedOrder);
  },
  workedOrder: async ({ plannedOrder, workPage }, use) => {
    await workPage.goto(`&order=${plannedOrder.index}`);
    await workPage.logWork(5);
    await workPage.logWork(5);
    await use(plannedOrder);
  },

  bookingApi: async ({ request }, use) => use(new BookingApi(request)),
});

export { expect } from '@playwright/test';
