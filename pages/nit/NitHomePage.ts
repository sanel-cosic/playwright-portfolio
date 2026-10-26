import { type Locator, type Page, expect } from '@playwright/test';
import { nitTools, type NitTool } from '../../utils/nitData';

/** The nIT one-page site: header, hero, language picker and the tools workbench. */
export class NitHomePage {
  readonly heading: Locator;
  readonly mainNav: Locator;
  readonly motionToggle: Locator;
  readonly processSwitch: Locator;
  readonly processDetail: Locator;
  readonly languageMenu: Locator;
  readonly languageToggle: Locator;
  readonly toolTabs: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.mainNav = page.locator('header nav');
    this.motionToggle = page.locator('#motion-toggle');
    this.processSwitch = page.locator('.process-switch');
    this.processDetail = page.locator('#process-detail');
    this.languageMenu = page.locator('details.language-flags');
    // A <summary> has no ARIA role of its own, and its label changes with the
    // language, so it is located structurally rather than by role + name.
    this.languageToggle = this.languageMenu.locator('summary');
    this.toolTabs = page.getByRole('tablist', { name: /Primjeri alata|Tool examples|Beispiele/ });
  }

  /** Opens the page. Pass e.g. '?lang=en' to start in another language. */
  async goto(query = '') {
    // Keep the default 'load': before it, fonts and the KJ Tools iframe still shift the layout,
    // and clicks land beside their target (seen in WebKit traces under parallel load).
    await this.page.goto('/' + query);
    await expect(this.heading).toBeVisible();
    // The tabs are wired up by JS: a selected tab means the tools are ready (any language)
    await expect(this.toolTabs.getByRole('tab', { selected: true })).toBeVisible();
  }

  navLink(name: string): Locator {
    return this.mainNav.getByRole('link', { name, exact: true });
  }

  processButton(name: 'Kalkulacija' | 'Plan' | 'Pregled'): Locator {
    return this.processSwitch.getByRole('button', { name, exact: true });
  }

  tab(tool: NitTool): Locator {
    return this.page.getByRole('tab', { name: nitTools[tool] });
  }

  panel(tool: NitTool): Locator {
    return this.page.locator(`#panel-${tool}`);
  }

  async openTool(tool: NitTool) {
    await this.tab(tool).click();
    await expect(this.tab(tool)).toHaveAttribute('aria-selected', 'true');
    await expect(this.panel(tool)).toBeVisible();
  }

  async chooseLanguage(name: string) {
    await this.openLanguageMenu();
    await this.languageMenu.getByRole('button', { name, exact: true }).click();
  }

  /**
   * Opens the flag menu and confirms it opened. In full WebKit runs a single click
   * could hang on the actionability check for the whole test timeout, so each click
   * is bounded and retried; it only clicks while the menu is still closed.
   */
  async openLanguageMenu() {
    await expect(this.languageToggle).toBeVisible();
    await expect(async () => {
      if (!(await this.languageMenu.evaluate((d: HTMLDetailsElement) => d.open))) {
        await this.languageToggle.click({ timeout: 5_000 });
      }
      await expect(this.languageMenu).toHaveAttribute('open', '', { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
  }

  htmlLang(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }
}
