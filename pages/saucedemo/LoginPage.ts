import { type Locator, type Page, expect } from '@playwright/test';
import { fillAndConfirm } from '../../utils/forms';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.getByTestId('error');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string) {
    await fillAndConfirm(this.username, username);
    await fillAndConfirm(this.password, password);
    await this.loginButton.click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.error).toBeVisible();
    await expect(this.error).toContainText(message);
  }
}
