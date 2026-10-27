# SauceDemo Login Page Test Plan

## Application Overview

Test plan for the SauceDemo login page (https://www.saucedemo.com/). Controls: textbox Username (data-test=username, placeholder "Username"), textbox Password (type=password, data-test=password), button Login (data-test=login-button). Errors render in role=alert (data-test=error) with a "Dismiss error" button (data-test=error-button). All error texts are prefixed "Epic sadface: ". Edge-case results below were verified in the browser on 2026-10-27; third-party 401s from events.backtrace.io in the console are telemetry noise, not app bugs. Coverage legend: [COVERED] = already in tests/saucedemo/login.spec.ts; [GAP] = new. Page objects: pages/saucedemo/LoginPage.ts (goto, login, expectError, username, password, loginButton, error) and InventoryPage.ts (title). Locators added for this plan: LoginPage.errorDismissButton; InventoryPage.menuButton, InventoryPage.logoutLink and InventoryPage.logout() (used by 5.3 and 5.4). Do not assert CSS classes or error icons. Seed data: users.standard (standard_user/secret_sauce, may come from SAUCE_USERNAME/SAUCE_PASSWORD), users.lockedOut (locked_out_user/secret_sauce), users.invalid (not_a_user/wrong_password); extra accepted users problem_user, performance_glitch_user, error_user, visual_user (all secret_sauce).

## Test Scenarios

### 1. Setup (applies to all suites)

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 1.1. Setup: start every login scenario signed out

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. The seed test (tests/saucedemo/seed.spec.ts, project saucedemo-chromium) starts SIGNED IN on /inventory.html via the storage state saved by auth.setup.ts. Login scenarios must not use that session. In login.spec.ts add test.use({ storageState: { cookies: [], origins: [] } }) at file level (already present).
    - expect: No session-username cookie exists at the start of each test
  2. Add test.beforeEach that calls loginPage.goto() (navigates to / with waitUntil domcontentloaded and asserts the Login button is visible). Already present.
    - expect: Each test starts on the empty login form: both fields empty, no error alert
  3. Import { test, expect } from '../../fixtures' and users from '../../utils/testData'. Use web-first assertions only; no waitForTimeout.
    - expect: Tests are independent and can run in any order

### 2. Successful login

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 2.1. standard user can log in @smoke [COVERED: 'standard user can log in @smoke']

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Signed out, on /. Call loginPage.login(users.standard.username, users.standard.password).
    - expect: URL matches /inventory.html
    - expect: inventoryPage.title has text 'Products'

#### 2.2. login sets a session cookie for the user [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in as users.standard.
    - expect: Verified: cookie session-username with value equal to the username exists in page.context().cookies()
    - expect: URL is /inventory.html

#### 2.3. user can submit the form with the Enter key [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Fill Username and Password with users.standard; press Enter while focus is in the Password field (do not click Login).
    - expect: Verified: form submits, URL becomes /inventory.html, title 'Products'

#### 2.4. each other accepted user can sign in [GAP] (data-driven)

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. For each of problem_user, performance_glitch_user, error_user, visual_user: log in with password secret_sauce.
    - expect: Verified for all four: lands on /inventory.html with no error. performance_glitch_user may be slower, so rely on toHaveURL auto-wait, not timeouts. Behaviour after login is out of scope.

#### 2.5. reloading the inventory page keeps the user signed in [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in as users.standard, then page.reload().
    - expect: Verified: stays on /inventory.html, not redirected

### 3. Rejected credentials

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 3.1. locked-out user sees a clear error [COVERED]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in as users.lockedOut.
    - expect: Error contains 'Epic sadface: Sorry, this user has been locked out.'
    - expect: URL is not /inventory.html

#### 3.2. wrong credentials are rejected [COVERED]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in as users.invalid (not_a_user / wrong_password).
    - expect: Error contains 'Username and password do not match any user in this service'

#### 3.3. valid username with wrong password is rejected [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter standard_user and password 'wrong'; click Login.
    - expect: Verified: 'Epic sadface: Username and password do not match any user in this service' (same message as unknown user, so no user enumeration); stays on /

#### 3.4. unknown username with valid password is rejected [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter 'nobody' and secret_sauce; click Login.
    - expect: Verified: same 'do not match any user' error; stays on /

#### 3.5. username is case-sensitive [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter STANDARD_USER and secret_sauce; click Login.
    - expect: Verified: rejected with 'Username and password do not match any user in this service'; no session cookie

#### 3.6. password is case-sensitive [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter standard_user and SECRET_SAUCE; click Login.
    - expect: Verified: rejected with 'Username and password do not match any user in this service'

#### 3.7. username with leading or trailing whitespace is rejected [GAP] (data-driven: ' standard_user', 'standard_user ')

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter the padded username with secret_sauce; click Login. Note: fillAndConfirm in the page object must not trim the value; check utils/forms.ts first.
    - expect: Verified for both variants: rejected with 'Username and password do not match any user in this service' (input is not trimmed)

#### 3.8. password with trailing whitespace is rejected [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter standard_user and 'secret_sauce ' (trailing space); click Login.
    - expect: Verified: rejected with 'do not match any user' error

#### 3.9. hostile input in username is handled as plain text [GAP] (data-driven: "' OR 1=1 --", '<script>alert(1)</script>', 500 x 'a')

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter the payload as username and 'x' as password; click Login.
    - expect: Verified for all three: standard 'do not match any user' error, no navigation, no dialog, page remains usable. Optionally register page.on('dialog') and assert it never fires.

### 4. Field validation and error behaviour

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 4.1. validation: empty username [COVERED]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Leave Username empty, enter secret_sauce; click Login.
    - expect: 'Username is required' error

#### 4.2. validation: empty password [COVERED]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter standard_user, leave Password empty; click Login.
    - expect: 'Password is required' error

#### 4.3. submitting an empty form asks for a username first [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Click Login with both fields empty.
    - expect: Verified: 'Epic sadface: Username is required' (username check takes precedence over password); stays on /

#### 4.4. error can be dismissed without clearing values [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Enter 'x' as username and 'abc' as password; click Login to get an error.
    - expect: Error alert (role=alert) visible
  2. Click the 'Dismiss error' button (loginPage.errorDismissButton).
    - expect: Verified: alert disappears; Username still 'x' and Password still 'abc'

#### 4.5. user can correct credentials and sign in after an error [GAP] @smoke

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Submit invalid credentials, dismiss the error, then fill valid users.standard credentials and click Login.
    - expect: Verified: lands on /inventory.html, title 'Products'

#### 4.6. keyboard tab order is Username, Password, Login [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Load /, press Tab three times, checking focus after each.
    - expect: Verified: focus order is Username, Password, Login button (use toBeFocused on page-object locators)

### 5. Access control and logout

**Seed:** `tests/saucedemo/seed.spec.ts`

#### 5.1. protected page redirects anonymous users to login [COVERED for /inventory.html]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Signed out, page.goto('/inventory.html').
    - expect: Login button visible, error contains "You can only access '/inventory.html' when you are logged in."

#### 5.2. other protected pages redirect anonymous users to login [GAP] (data-driven: cart.html, checkout-step-one.html, inventory-item.html?id=1, checkout-complete.html)

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Signed out, page.goto each path.
    - expect: Verified: redirected to / with 'Epic sadface: You can only access '/<page>' when you are logged in.' (query string omitted from the path in the message, e.g. '/inventory-item.html'); login form visible

#### 5.3. user can log out and returns to the login page [GAP] @smoke

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in as users.standard, then inventoryPage.logout() (opens the 'Open Menu' button and clicks the 'Logout' link).
    - expect: Verified: URL is / and the login form is visible with empty Username and Password; session-username cookie is gone

#### 5.4. back button after logout does not restore the session [GAP]

**File:** `tests/saucedemo/login.spec.ts`

**Steps:**
  1. Log in, log out, then page.goBack().
    - expect: Verified: login form shown at /, error "You can only access '/inventory.html' when you are logged in." is displayed; inventory list not shown

Out of scope (reviewed): a signed-in user opening `/` sees the login form with no redirect. This is observed behaviour, not a requirement, so it is not tested.
