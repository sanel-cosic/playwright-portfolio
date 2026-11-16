import { type Locator, type Page, expect } from '@playwright/test';

/**
 * The contact <dialog> on the home page. It currently has no accessible name
 * (possible a11y bug, QAP-4), so it is located by id rather than by role + name.
 */
export class ContactDialog {
  readonly root: Locator;
  readonly heading: Locator;
  readonly closeButton: Locator;
  readonly copyButton: Locator;
  readonly copyFeedback: Locator;
  /** Context line, filled from the trigger's data-interest value. */
  readonly context: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#contact-dialog');
    this.heading = this.root.getByRole('heading', { name: 'Razgovarajmo o projektu' });
    this.closeButton = this.root.getByRole('button', { name: 'Zatvori kontakt' });
    this.copyButton = this.root.getByRole('button', { name: 'Kopiraj email adresu' });
    this.copyFeedback = this.root.getByRole('status');
    this.context = this.root.locator('#contact-context');
  }

  /** Clicks a trigger and waits for the dialog. The trigger must be visible (see openService). */
  async open(trigger: Locator) {
    await trigger.click();
    await expect(this.root).toBeVisible();
  }

  async closeWithButton() {
    await this.closeButton.click();
    await expect(this.root).toBeHidden();
  }

  async closeWithEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.root).toBeHidden();
  }
}
