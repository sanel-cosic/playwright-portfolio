import { test, expect } from '../../fixtures';
import { users } from '../../utils/testData';
import { fillAndConfirm } from '../../utils/forms';

// Login tests must start signed out, so drop the saved session for this file.
test.use({ storageState: { cookies: [], origins: [] } });

const NO_MATCH = 'Username and password do not match any user in this service';

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

    await loginPage.expectError(NO_MATCH);
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

  test.describe('Successful login', () => {
    test('login sets a session cookie for the user', async ({ page, loginPage }) => {
      await loginPage.login(users.standard.username, users.standard.password);

      await expect(page).toHaveURL(/inventory\.html/);
      await expect
        .poll(async () => {
          const cookies = await page.context().cookies();
          return cookies.find((c) => c.name === 'session-username')?.value;
        })
        .toBe(users.standard.username);
    });

    test('user can submit the form with the Enter key', async ({ page, loginPage, inventoryPage }) => {
      await fillAndConfirm(loginPage.username, users.standard.username);
      await fillAndConfirm(loginPage.password, users.standard.password);
      await loginPage.password.press('Enter');

      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.title).toHaveText('Products');
    });

    // Data-driven: the other accepted demo users
    const otherUsers = ['problem_user', 'performance_glitch_user', 'error_user', 'visual_user'];

    for (const username of otherUsers) {
      test(`${username} can sign in`, async ({ page, loginPage }) => {
        await loginPage.login(username, users.standard.password);

        await expect(page).toHaveURL(/inventory\.html/);
        await expect(loginPage.error).toBeHidden();
      });
    }

    test('reloading the inventory page keeps the user signed in', async ({ page, loginPage, inventoryPage }) => {
      await loginPage.login(users.standard.username, users.standard.password);
      await expect(inventoryPage.title).toHaveText('Products');

      await page.reload();

      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.title).toHaveText('Products');
    });
  });

  test.describe('Rejected credentials', () => {
    test('valid username with wrong password is rejected', async ({ page, loginPage }) => {
      await loginPage.login(users.standard.username, 'wrong');

      await loginPage.expectError(`Epic sadface: ${NO_MATCH}`);
      await expect(page).not.toHaveURL(/inventory\.html/);
    });

    test('unknown username with valid password is rejected', async ({ page, loginPage }) => {
      await loginPage.login('nobody', users.standard.password);

      await loginPage.expectError(NO_MATCH);
      await expect(page).not.toHaveURL(/inventory\.html/);
    });

    test('username is case-sensitive', async ({ page, loginPage }) => {
      await loginPage.login(users.standard.username.toUpperCase(), users.standard.password);

      await loginPage.expectError(NO_MATCH);
      await expect(page).not.toHaveURL(/inventory\.html/);
      const cookies = await page.context().cookies();
      expect(cookies.find((c) => c.name === 'session-username')).toBeUndefined();
    });

    test('password is case-sensitive', async ({ loginPage }) => {
      await loginPage.login(users.standard.username, users.standard.password.toUpperCase());

      await loginPage.expectError(NO_MATCH);
    });

    // Data-driven: the input must not be trimmed
    const paddedUsernames = [
      { case: 'leading space', username: ` ${users.standard.username}` },
      { case: 'trailing space', username: `${users.standard.username} ` },
    ];

    for (const { case: name, username } of paddedUsernames) {
      test(`username with ${name} is rejected`, async ({ loginPage }) => {
        await loginPage.login(username, users.standard.password);

        await loginPage.expectError(NO_MATCH);
      });
    }

    test('password with trailing whitespace is rejected', async ({ loginPage }) => {
      await loginPage.login(users.standard.username, `${users.standard.password} `);

      await loginPage.expectError(NO_MATCH);
    });

    // Data-driven: hostile payloads are treated as plain text
    const hostileUsernames = [
      { case: 'SQL injection', payload: "' OR 1=1 --" },
      { case: 'script tag', payload: '<script>alert(1)</script>' },
      { case: '500-character string', payload: 'a'.repeat(500) },
    ];

    for (const { case: name, payload } of hostileUsernames) {
      test(`hostile username (${name}) is handled as plain text`, async ({ page, loginPage }) => {
        const dialogs: string[] = [];
        page.on('dialog', (dialog) => {
          dialogs.push(dialog.message());
          void dialog.dismiss();
        });

        await loginPage.login(payload, 'x');

        await loginPage.expectError(NO_MATCH);
        await expect(page).not.toHaveURL(/inventory\.html/);
        await expect(loginPage.loginButton).toBeEnabled();
        expect(dialogs).toEqual([]);
      });
    }
  });

  test.describe('Field validation and error behaviour', () => {
    test('submitting an empty form asks for a username first', async ({ page, loginPage }) => {
      await loginPage.loginButton.click();

      await loginPage.expectError('Epic sadface: Username is required');
      await expect(page).not.toHaveURL(/inventory\.html/);
    });

    test('error can be dismissed without clearing values', async ({ loginPage }) => {
      await loginPage.login('x', 'abc');
      await expect(loginPage.error).toBeVisible();

      await loginPage.errorDismissButton.click();

      await expect(loginPage.error).toBeHidden();
      await expect(loginPage.username).toHaveValue('x');
      await expect(loginPage.password).toHaveValue('abc');
    });

    test('user can correct credentials and sign in after an error @smoke', async ({
      page,
      loginPage,
      inventoryPage,
    }) => {
      await test.step('submit invalid credentials and dismiss the error', async () => {
        await loginPage.login(users.invalid.username, users.invalid.password);
        await loginPage.expectError(NO_MATCH);
        await loginPage.errorDismissButton.click();
        await expect(loginPage.error).toBeHidden();
      });

      await test.step('sign in with valid credentials', async () => {
        await loginPage.login(users.standard.username, users.standard.password);
        await expect(page).toHaveURL(/inventory\.html/);
        await expect(inventoryPage.title).toHaveText('Products');
      });
    });

    test('keyboard tab order is Username, Password, Login', async ({ page, loginPage }) => {
      await page.keyboard.press('Tab');
      await expect(loginPage.username).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.password).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.loginButton).toBeFocused();
    });
  });

  test.describe('Access control and logout', () => {
    // Data-driven: other protected pages
    const protectedPages = [
      { path: 'cart.html', shown: '/cart.html' },
      { path: 'checkout-step-one.html', shown: '/checkout-step-one.html' },
      { path: 'inventory-item.html?id=1', shown: '/inventory-item.html' },
      { path: 'checkout-complete.html', shown: '/checkout-complete.html' },
    ];

    for (const { path, shown } of protectedPages) {
      test(`${path} redirects anonymous users to login`, async ({ page, loginPage }) => {
        await page.goto(`/${path}`, { waitUntil: 'domcontentloaded' });

        await expect(loginPage.loginButton).toBeVisible();
        await expect(page).toHaveURL(/\/$/);
        await loginPage.expectError(`Epic sadface: You can only access '${shown}' when you are logged in.`);
      });
    }

    test('user can log out and returns to the login page @smoke', async ({
      page,
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.login(users.standard.username, users.standard.password);
      await expect(inventoryPage.title).toHaveText('Products');

      await inventoryPage.logout();

      await expect(page).toHaveURL(/\/$/);
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.username).toHaveValue('');
      await expect(loginPage.password).toHaveValue('');
      await expect
        .poll(async () => {
          const cookies = await page.context().cookies();
          return cookies.some((c) => c.name === 'session-username');
        })
        .toBe(false);
    });

    test('back button after logout does not restore the session', async ({ page, loginPage, inventoryPage }) => {
      await test.step('log in and log out', async () => {
        await loginPage.login(users.standard.username, users.standard.password);
        await expect(inventoryPage.title).toHaveText('Products');
        await inventoryPage.logout();
        await expect(loginPage.loginButton).toBeVisible();
      });

      await test.step('go back to the inventory page', async () => {
        await page.goBack();

        await expect(loginPage.loginButton).toBeVisible();
        await loginPage.expectError("You can only access '/inventory.html' when you are logged in.");
        await expect(inventoryPage.title).toBeHidden();
      });
    });
  });
});
