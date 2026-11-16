import { type FrameLocator, type Locator, type Page, expect } from '@playwright/test';
import { parseLocalNumber, type ConfiguratorModel } from '../../utils/nitData';

/**
 * Window and door configurator. Works on the standalone page (/konfigurator) and on the
 * iframe embedded on the home page: pass the Page or nitHome.configFrame.
 * The price numbers have no roles or test ids, so they are read via their label's parent.
 */
export class ConfiguratorPage {
  readonly heading: Locator;
  readonly viewGroup: Locator;
  readonly customerView: Locator;
  readonly companyView: Locator;
  readonly modelGroup: Locator;
  readonly settingsTabs: Locator;
  readonly width: Locator;
  readonly widthSlider: Locator;
  readonly height: Locator;
  readonly heightSlider: Locator;
  readonly rangeHint: Locator;
  readonly glassType: Locator;
  readonly glassWidth: Locator;
  readonly resetButton: Locator;
  readonly quantity: Locator;
  readonly selectionHeading: Locator;
  readonly dimensionText: Locator;
  readonly profileChip: Locator;
  readonly glassChip: Locator;
  readonly partsChip: Locator;
  readonly unitPrice: Locator;
  readonly total: Locator;
  readonly addButton: Locator;
  readonly firmButton: Locator;
  readonly status: Locator;
  readonly customerRegion: Locator;
  readonly firmRegion: Locator;

  constructor(private readonly root: Page | FrameLocator) {
    this.heading = root.getByRole('heading', { level: 1 });
    this.viewGroup = root.getByRole('group', { name: 'Odaberite pogled' });
    this.customerView = this.viewGroup.getByRole('button', { name: '01 Šta vidi kupac' });
    // The company view button gets a badge digit appended to its name
    this.companyView = this.viewGroup.getByRole('button', { name: /^02 Šta vidi firma/ });
    this.modelGroup = root.getByRole('group', { name: 'Odaberite model' });
    this.settingsTabs = root.getByRole('tablist', { name: 'Postavke proizvoda' });
    this.width = root.getByRole('spinbutton', { name: 'Širina mm' });
    this.widthSlider = root.getByRole('slider', { name: 'Podesi širinu proizvoda' });
    this.height = root.getByRole('spinbutton', { name: 'Visina mm' });
    this.heightSlider = root.getByRole('slider', { name: 'Podesi visinu proizvoda' });
    this.rangeHint = root.getByText(/^Demo raspon:/);
    this.glassType = root.getByRole('combobox', { name: 'Vrsta stakla' });
    this.glassWidth = root.getByRole('spinbutton', { name: 'Širina stakla mm' });
    this.resetButton = root.getByRole('button', { name: '↺ Vrati početni primjer' });
    this.quantity = root.getByRole('spinbutton', { name: 'Količina' });
    // The selection aside ("VAŠ ODABIR") holds the model name as its h2
    this.selectionHeading = this.customerRegionLocator()
      .getByRole('complementary')
      .filter({ hasText: 'VAŠ ODABIR' })
      .getByRole('heading', { level: 2 });
    // The "W × H mm" pattern also appears for the glass size, so use the summary span's id
    this.dimensionText = root.locator('#kc-dimensions');
    this.profileChip = root.getByText(/m profila$/);
    this.glassChip = root.getByText(/m² stakla$/);
    this.partsChip = root.getByText(/vrsta dijelova$/);
    this.unitPrice = root.getByText('Demo procjena / kom', { exact: true }).locator('..');
    this.total = root.getByText('Ukupno za odabir', { exact: true }).locator('..');
    this.addButton = root.getByRole('button', { name: 'Dodaj u demo upit +' });
    this.firmButton = root.getByRole('button', { name: 'Pogledajte šta dobija firma →' });
    // Other <output>s (e.g. the split value) also have role=status, so target the feedback line
    this.status = root.locator('#kc-feedback');
    this.customerRegion = this.customerRegionLocator();
    this.firmRegion = root.getByRole('region', { name: 'Poslovni pregled' });
  }

  private customerRegionLocator(): Locator {
    return this.root.getByRole('region', { name: 'Kupčev konfigurator' });
  }

  /** Standalone page; only valid when constructed with a Page. */
  async goto(query = '?lang=bs') {
    const page = this.root as Page;
    await page.goto('/konfigurator.html' + query);
    await expect(this.modelGroup).toBeVisible();
  }

  model(name: ConfiguratorModel): Locator {
    // Accessible names are "<model>, <tagline>"; the anchor keeps Luma from matching Luma Plus
    return this.modelGroup.getByRole('button', { name: new RegExp(`^${name},`) });
  }

  settingsTab(name: 'Mjere' | 'Izgled' | 'Staklo'): Locator {
    return this.settingsTabs.getByRole('tab', { name, exact: true });
  }

  /** Fills a number input and commits it (the page clamps on blur/Tab). */
  async setNumber(input: Locator, value: number | string) {
    await input.fill(String(value));
    await input.press('Tab');
  }

  async unitPriceValue(): Promise<number> {
    return parseLocalNumber((await this.unitPrice.innerText()).replace('Demo procjena / kom', ''));
  }

  async totalValue(): Promise<number> {
    return parseLocalNumber((await this.total.innerText()).replace('Ukupno za odabir', ''));
  }

  async profileValue(): Promise<number> {
    return parseLocalNumber(await this.profileChip.innerText());
  }

  async glassValue(): Promise<number> {
    return parseLocalNumber(await this.glassChip.innerText());
  }
}
