import { test, expect } from '../../fixtures';
import { users } from '../../utils/testData';

// Login tests must start signed out, so drop the saved session for this file.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('locked-out user sees a clear error', async ({ page, loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);

    await loginPage.expectError('Sorry, this user has been locked out.');
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  test('wrong credentials are rejected', async ({ loginPage }) => {
    await loginPage.login(users.invalid.username, users.invalid.password);

    await loginPage.expectError('Username and password do not match any user in this service');
  });

  // Data-driven: one test definition, several cases
  const missingFields = [
    { case: 'empty username', username: '', password: 'secret_sauce', error: 'Username is required' },
    { case: 'empty password', username: 'standard_user', password: '', error: 'Password is required' },
  ];

  for (const { case: name, username, password, error } of missingFields) {
    test(`validation: ${name}`, async ({ loginPage }) => {
      await loginPage.login(username, password);
      await loginPage.expectError(error);
    });
  }

  test('protected page redirects anonymous users to login', async ({ page, loginPage }) => {
    await page.goto('/inventory.html', { waitUntil: 'domcontentloaded' });

    await expect(loginPage.loginButton).toBeVisible();
    await loginPage.expectError("You can only access '/inventory.html' when you are logged in.");
  });
});
