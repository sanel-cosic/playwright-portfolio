import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { users } from '../utils/testData';
import { AUTH_FILE } from '../playwright.config';

/**
 * Runs once before the UI projects. Logs in through the real UI and saves
 * cookies + localStorage, so every UI test starts already signed in.
 */
setup('authenticate as standard user', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(users.standard.username, users.standard.password);
  await expect(page).toHaveURL(/inventory\.html/);
  await page.context().storageState({ path: AUTH_FILE });
});
