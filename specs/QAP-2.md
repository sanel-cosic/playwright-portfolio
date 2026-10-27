# QAP-2 SauceDemo Product Details Page Test Plan

## Application Overview

Test plan for Jira QAP-2 "SauceDemo - product details page". Verified in the browser on 2026-10-27 as standard_user (saved session). Inventory: 6 products. Each name on the inventory page is a button named "View details for <name>" (data-test=item-N-title-link; the image is a second button with the same name, so scope to the product card or use the item-N-title-link test id). Details URL: /inventory-item.html?id=N. Ids: Bike Light=0, Bolt T-Shirt=1, Onesie=2, Test.allTheThings() T-Shirt (Red)=3, Backpack=4, Fleece Jacket=5. Details page elements: button "Back to products" (data-test=back-to-products); name div (data-test=inventory-item-name); description (inventory-item-desc); price (inventory-item-price); image (item-sauce-labs-backpack-img style id); toggle button "Add to cart" (data-test=add-to-cart) which becomes "Remove" (data-test=remove); cart link data-test=shopping-cart-link with aria-label "Cart, empty" or "Cart, N items"; badge data-test=shopping-cart-badge exists only when count > 0 (absent from the DOM when empty). Name, description, price and Add/Remove all reuse the same test ids as the inventory cards (inventory-item-name, inventory-item-price), but only one item exists on the details page. Cart state is persisted across navigation (including a direct page.goto of the details URL): after adding on details, the inventory card shows "Remove" and the badge stays 1. Seed: tests/saucedemo/seed.spec.ts (signed-in standard_user on /inventory.html, fresh cart). Tests do not need a login; the saucedemo projects supply storage state. Out of scope: invalid ids, sidebar, checkout, other users, sort order.

## Test Scenarios

### 1. Traceability (AC to scenario)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 1.1. Traceability matrix

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. AC1 (clicking a product name opens its details page) is covered by 1.1, 1.2. AC2 (same name and price as inventory list) is covered by 2.1 (data-driven over all 6 products), 2.2. AC3 (Add to cart updates the badge) is covered by 3.1, 3.2, 3.3, 3.4. AC4 (Back to products returns to inventory) is covered by 4.1, 4.2, 4.3. Every scenario maps to at least one AC; no scenario falls outside the ACs.
    - expect: Each AC has at least one @smoke or edge scenario

### 2. 1. Open details page (AC1)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 2.1. user can open a product's details page by clicking its name @smoke

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Start on /inventory.html (inventoryPage.goto()). Click the name link of 'Sauce Labs Backpack' inside its card (new InventoryPage.openProduct(name) = item(name).getByRole('button', { name: `View details for ${name}` }).first() click; or getByTestId('item-4-title-link')).
    - expect: URL matches /inventory-item\.html\?id=4/
    - expect: ProductDetailsPage.name has text 'Sauce Labs Backpack'
    - expect: ProductDetailsPage.backButton is visible
    - expect: ProductDetailsPage.description is visible and not empty

#### 2.2. each product name opens the details page for that product

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Data-driven over all 6 products (Bike Light id 0, Bolt T-Shirt 1, Onesie 2, Red T-Shirt 3, Backpack 4, Fleece Jacket 5; read names from inventoryPage.itemNames, do not hardcode ids if avoidable). For each, go to inventory, click the product's name.
    - expect: URL matches /inventory-item\.html\?id=\d+/
    - expect: Details name equals the clicked name (no other product opens)

### 3. 2. Name and price match inventory (AC2)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 3.1. product details shows the same name and price as the inventory list @smoke

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. On inventory read the name and price text of 'Sauce Labs Backpack' card (inventoryPage.item(name) scoped getByTestId('inventory-item-name') / 'inventory-item-price'). Open its details page.
    - expect: Details name toHaveText the inventory name ('Sauce Labs Backpack')
    - expect: Details price toHaveText the inventory price ('$29.99')

#### 3.2. name and price match the inventory for every product

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Data-driven: for each product on the inventory (6), record name and price from its card, open details, compare, then Back to products (or goto inventory). Include the cheapest ($7.99 Onesie), a name with special characters ('Test.allTheThings() T-Shirt (Red)') and two products with the same price ($15.99: Bolt T-Shirt and Red T-Shirt) to prove the right item is shown.
    - expect: Name and price on details equal the card values for each product
    - expect: The two $15.99 products show different names

### 4. 3. Add to cart from details (AC3)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 4.1. user can add a product to the cart from its details page @smoke

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Fresh cart. Open Sauce Labs Backpack details. Assert no badge. Click 'Add to cart' (ProductDetailsPage.addToCartButton = getByRole('button', {name:'Add to cart'})).
    - expect: Cart badge (shopping-cart-badge) has text '1'
    - expect: The button is replaced by 'Remove' (ProductDetailsPage.removeButton) and 'Add to cart' is gone

#### 4.2. cart badge increments from an existing count when adding from details

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. On inventory add 'Sauce Labs Bike Light' via inventoryPage.addToCart (badge 1). Click the name of 'Sauce Labs Onesie' to open details and click 'Add to cart'.
    - expect: Badge shows '1' before the add and '2' after
    - expect: Details button toggles to 'Remove'

#### 4.3. user can remove a product from its details page and the badge clears

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Open Backpack details, Add to cart (badge 1), click 'Remove'.
    - expect: Badge is hidden (toBeHidden; it is removed from the DOM when empty, use inventoryPage.expectCartCount(0))
    - expect: Button shows 'Add to cart' again
    - expect: Cart link accessible name is 'Cart, empty'
  2. Variant: with two items in cart (one added on inventory, one on details), Remove the details item.
    - expect: Badge decrements from '2' to '1'

#### 4.4. a product already in the cart shows Remove and the badge on its details page

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. On inventory add 'Sauce Labs Backpack' (badge 1). Click its name to open details.
    - expect: Details button reads 'Remove' (not 'Add to cart')
    - expect: Badge still '1'

### 5. 4. Back to products (AC4)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 5.1. user can return to the inventory with Back to products @smoke

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Open any product's details page, click button 'Back to products' (ProductDetailsPage.backToProducts()).
    - expect: URL matches /inventory\.html$/ (no id param)
    - expect: inventoryPage.title has text 'Products'
    - expect: All 6 inventory items are visible (inventoryPage.items toHaveCount(6))

#### 5.2. cart state added on the details page persists after Back to products

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. Open Backpack details, Add to cart, click Back to products.
    - expect: Inventory badge shows '1'
    - expect: The Backpack card shows 'Remove'; the other 5 cards show 'Add to cart'

#### 5.3. removing a product on the details page is reflected after Back to products

**File:** `tests/saucedemo/product-details.spec.ts`

**Steps:**
  1. On inventory add Backpack (badge 1). Open its details, click 'Remove', click Back to products.
    - expect: Badge hidden
    - expect: Backpack card shows 'Add to cart'

### 6. 5. Page object notes (plan only, nothing implemented)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 6.1. Page object and fixture changes needed

**File:** `pages/saucedemo/ProductDetailsPage.ts`

**Steps:**
  1. Create pages/saucedemo/ProductDetailsPage.ts with locators: name = getByTestId('inventory-item-name'); price = getByTestId('inventory-item-price'); description = getByTestId('inventory-item-desc'); image = getByRole('img', {name: ...}) via method or page.locator('main').getByRole('img'); backButton = getByRole('button', {name:'Back to products'}); addToCartButton = getByRole('button', {name:'Add to cart'}); removeButton = getByRole('button', {name:'Remove'}); cartBadge = getByTestId('shopping-cart-badge'); cartLink = getByTestId('shopping-cart-link'). Methods: expectLoaded() (URL /inventory-item.html and name visible), addToCart(), remove(), backToProducts(). Reuse InventoryPage.expectCartCount for badge assertions (or duplicate it here if needed).
    - expect: Locators live only in the page object; no XPath; no waitForTimeout
  2. Add to InventoryPage: openProduct(name) clicking item(name).getByRole('button', {name: `View details for ${name}`}).first() (image button has the same accessible name, so scope or use .first()), plus priceOf(name)/nameOf helpers only if 2+ tests need them. Register productDetailsPage in fixtures/index.ts.
    - expect: npm run typecheck passes
