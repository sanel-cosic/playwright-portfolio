import { type FrameLocator, type Locator, type Page, expect } from '@playwright/test';
import { serviceTabs, type ServicePanel } from '../../utils/nitData';

/** The nIT home page (v2): header, hero, services tabs, project showcase, configurator embed. */
export class NitHomePage {
  readonly heading: Locator;
  readonly skipLink: Locator;
  readonly main: Locator;
  readonly mainNav: Locator;
  readonly projectsLink: Locator;
  readonly projectsSection: Locator;
  readonly contactButton: Locator;
  readonly animationToggle: Locator;

  /** "Usluge" tablist. Located through its first tab so it works in every language. */
  readonly serviceTabs: Locator;

  readonly projectTabs: Locator;
  readonly projectPanel: Locator;
  readonly projectStory: Locator;
  readonly projectViewButtons: Locator;
  readonly visitLink: Locator;

  readonly appTabs: Locator;
  readonly appView: Locator;
  readonly appCopy: Locator;

  readonly productionDemo: Locator;
  readonly productionSteps: Locator;
  readonly walkThroughLink: Locator;
  readonly overviewLink: Locator;

  /** Triggers inside panels/sections that open the contact dialog with a context line. */
  readonly partnerContactButton: Locator;
  readonly configuratorContactButton: Locator;

  readonly configuratorSection: Locator;
  readonly configFrameElement: Locator;
  readonly configFrame: FrameLocator;
  readonly fullToolLink: Locator;

  readonly languageMenu: Locator;
  readonly languageToggle: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.skipLink = page.getByRole('link', { name: 'Preskoči na sadržaj' });
    this.main = page.locator('#sadrzaj');
    this.mainNav = page.getByRole('navigation', { name: 'Glavna navigacija' });
    this.projectsLink = this.mainNav.getByRole('link', { name: 'Projekti' });
    this.projectsSection = page.locator('#projekti');
    this.contactButton = this.mainNav.getByRole('button', { name: 'Kontakt ↗' });
    // Name flips between "Pauziraj animaciju" and "Pokreni animaciju"
    this.animationToggle = page.locator('#thread-pause');

    this.serviceTabs = page.getByRole('tablist').filter({ has: page.locator('#service-tab-web') });

    this.projectTabs = page.getByRole('tablist', { name: 'Projekti' });
    this.projectPanel = page.locator('#project-panel');
    this.projectStory = this.projectPanel.getByRole('heading', { level: 3 });
    // View switch buttons carry aria-pressed; buttons inside the iframes are not reached
    this.projectViewButtons = this.projectPanel.locator('button[aria-pressed]');
    this.visitLink = this.projectPanel.getByRole('link', { name: 'Posjeti stranicu ↗' });

    this.appTabs = page.getByRole('tablist', { name: 'Ekrani aplikacije' });
    this.appView = page.locator('#app-view');
    this.appCopy = page.locator('#app-view-copy');

    this.productionDemo = page.locator('#production-demo');
    this.productionSteps = this.productionDemo.getByRole('listitem').getByRole('link');
    this.walkThroughLink = page.getByRole('link', { name: 'Prođi jedan nalog →' });
    this.overviewLink = this.productionDemo.getByRole('link', { name: 'Otvori pregled firme ↗', exact: true });

    this.partnerContactButton = page.getByRole('button', { name: 'Dogovorimo saradnju ↗' });
    this.configuratorContactButton = page.getByRole('button', { name: 'Želim nešto ovakvo za svoj posao ↗' });

    this.configuratorSection = page.locator('#isprobaj');
    this.configFrameElement = page.locator('#config-demo');
    this.configFrame = page.frameLocator('#config-demo');
    this.fullToolLink = page.getByRole('link', { name: /Otvori cijeli alat|Open the full tool/ });

    this.languageMenu = page.locator('details.language-flags');
    // A <summary> has no ARIA role of its own and its label changes with the language,
    // so it is located structurally; its aria-label announces the current language.
    this.languageToggle = this.languageMenu.locator('summary');
  }

  /** Opens the page. Pass e.g. '?lang=en' or '?lang=bs#proizvodnja'. */
  async goto(query = '') {
    // Keep the default 'load': before it, fonts and the iframes still shift the layout.
    await this.page.goto('/' + query);
    await expect(this.heading).toBeVisible();
    // The tabs are wired up by JS: a selected tab means the page is ready (any language)
    await expect(this.serviceTabs.getByRole('tab', { selected: true })).toBeVisible();
  }

  serviceTab(name: string): Locator {
    return this.serviceTabs.getByRole('tab', { name, exact: true });
  }

  servicePanel(panel: ServicePanel): Locator {
    return this.page.locator(`#service-${panel}`);
  }

  /** Selects a service tab (bs name) and waits until its panel is shown. */
  async openService(name: (typeof serviceTabs)[number]['name']) {
    const { panel } = serviceTabs.find(t => t.name === name)!;
    await this.serviceTab(name).click();
    await expect(this.serviceTab(name)).toHaveAttribute('aria-selected', 'true');
    await expect(this.servicePanel(panel)).toBeVisible();
  }

  projectTab(name: 'KJ Tools' | 'UGANJAJ' | 'Atlas BiH'): Locator {
    return this.projectTabs.getByRole('tab', { name: new RegExp(`^${name}`) });
  }

  appTab(name: 'Oglasi' | 'Detalji objave' | 'Moj biznis'): Locator {
    return this.appTabs.getByRole('tab', { name, exact: true });
  }

  /** Production panel step link by number, e.g. productionStep('01') → "01 Kalkulacija ↗". */
  productionStep(number: string): Locator {
    return this.productionDemo.getByRole('link', { name: new RegExp(`^${number} `) });
  }

  languageButton(name: string): Locator {
    return this.languageMenu.getByRole('button', { name, exact: true });
  }

  async chooseLanguage(name: string) {
    await this.openLanguageMenu();
    await this.languageButton(name).click();
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
