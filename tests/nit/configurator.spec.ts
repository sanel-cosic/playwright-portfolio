// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import { ConfiguratorPage } from '../../pages/nit/ConfiguratorPage';
import { parseLocalNumbers, type ConfiguratorModel } from '../../utils/nitData';

test.describe('QAP-8 Configurator', () => {
  test('default Luma 1000 x 2100 shows a positive price @smoke', async ({ configurator }) => {
    // 1. configurator.goto() (/konfigurator.html?lang=bs, redirects to /konfigurator)
    await configurator.goto();

    await expect(configurator.heading).toHaveText('Konfigurator prozora i vrata');
    await expect(configurator.customerView).toHaveAttribute('aria-pressed', 'true');

    await expect(configurator.modelGroup.getByRole('button')).toHaveCount(6);
    for (const name of ['Solo', 'Duo', 'Panorama', 'Linea', 'Luma', 'Luma Plus'] as const) {
      await expect(configurator.model(name)).toBeVisible();
    }
    await expect(configurator.model('Luma')).toHaveAccessibleName('Luma, Podesivo ostakljenje');
    await expect(configurator.model('Luma')).toHaveAttribute('aria-pressed', 'true');

    await expect(configurator.settingsTabs.getByRole('tab')).toHaveText(['Mjere', 'Izgled', 'Staklo']);
    await expect(configurator.settingsTab('Mjere')).toHaveAttribute('aria-selected', 'true');

    await expect(configurator.width).toHaveValue('1000');
    await expect(configurator.height).toHaveValue('2100');
    await expect(configurator.dimensionText).toHaveText('1000 × 2100 mm');

    await expect(configurator.profileChip).toHaveText(/\d/);
    await expect(configurator.glassChip).toHaveText(/\d/);
    await expect(configurator.partsChip).toHaveText(/\d/);

    const unit = await configurator.unitPriceValue();
    expect(unit).toBeGreaterThan(0);
    await expect(configurator.quantity).toHaveValue('1');
    expect(await configurator.totalValue()).toBeCloseTo(unit, 2);
  });

  const otherModels: ConfiguratorModel[] = ['Solo', 'Duo', 'Panorama', 'Linea', 'Luma Plus'];
  for (const name of otherModels) {
    test(`user can select the ${name} model and the summary follows`, async ({ configurator }) => {
      await configurator.goto();

      // 1. Click the model, read heading in 'VAŠ ODABIR', chips, unit price
      await configurator.model(name).click();

      await expect(configurator.model(name)).toHaveAttribute('aria-pressed', 'true');
      await expect(configurator.modelGroup.getByRole('button', { pressed: true })).toHaveCount(1);
      await expect(configurator.selectionHeading).toHaveText(name);

      await expect(configurator.profileChip).toHaveText(/\d/);
      await expect(configurator.glassChip).toHaveText(/\d/);
      expect(await configurator.unitPriceValue()).toBeGreaterThan(0);

      // the summary shows the model's default size, which is what the inputs hold
      const width = await configurator.width.inputValue();
      const height = await configurator.height.inputValue();
      await expect(configurator.dimensionText).toHaveText(`${width} × ${height} mm`);
    });
  }

  test('Panorama and Luma have different unit prices', async ({ configurator }) => {
    await configurator.goto();
    const luma = await configurator.unitPriceValue();

    await configurator.model('Panorama').click();
    await expect(configurator.selectionHeading).toHaveText('Panorama');

    expect(await configurator.unitPriceValue()).not.toBe(luma);
  });

  for (const name of ['Luma', 'Panorama', 'Luma Plus'] as const) {
    test(`out-of-range sizes and quantities are clamped to the ${name} range`, async ({
      configurator,
      page,
    }) => {
      await configurator.goto();
      await configurator.model(name).click();
      await expect(configurator.selectionHeading).toHaveText(name);

      const limit = async (input: typeof configurator.width, attr: 'min' | 'max') =>
        Number(await input.getAttribute(attr));
      const widthMin = await limit(configurator.width, 'min');
      const widthMax = await limit(configurator.width, 'max');
      const heightMin = await limit(configurator.height, 'min');
      const heightMax = await limit(configurator.height, 'max');
      const quantityMax = await limit(configurator.quantity, 'max');

      await test.step('the range hint matches the input limits', async () => {
        const hint = parseLocalNumbers(await configurator.rangeHint.innerText());
        expect(hint).toEqual([widthMin, widthMax, heightMin, heightMax]);
      });

      await test.step('width above max and height below min are clamped on Tab', async () => {
        await configurator.setNumber(configurator.width, widthMax + 1000);
        await configurator.setNumber(configurator.height, heightMin - 1000);

        await expect(configurator.width).toHaveValue(String(widthMax));
        await expect(configurator.height).toHaveValue(String(heightMin));
        await expect(configurator.widthSlider).toHaveValue(String(widthMax));
        await expect(configurator.heightSlider).toHaveValue(String(heightMin));
        await expect(configurator.dimensionText).toHaveText(`${widthMax} × ${heightMin} mm`);
      });

      await test.step('quantity above the input maximum is clamped', async () => {
        await configurator.setNumber(configurator.quantity, 25);
        await expect(configurator.quantity).toHaveValue(String(quantityMax));
      });

      await test.step('inputs are valid and show no validation message', async () => {
        for (const input of [configurator.width, configurator.height, configurator.quantity]) {
          expect(await input.evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(true);
          expect(await input.evaluate((e: HTMLInputElement) => e.validationMessage)).toBe('');
        }
      });
    });
  }

  test('a wider frame never needs less profile', async ({ configurator }) => {
    await configurator.goto();
    const min = Number(await configurator.width.getAttribute('min'));
    const max = Number(await configurator.width.getAttribute('max'));
    const mid = Math.round((min + max) / 2 / 10) * 10;

    const profile: number[] = [];
    const glass: number[] = [];
    for (const value of [min, mid, max]) {
      await configurator.setNumber(configurator.width, value);
      await expect(configurator.dimensionText).toContainText(`${value} ×`);
      profile.push(await configurator.profileValue());
      glass.push(await configurator.glassValue());
    }

    expect(profile[1]).toBeGreaterThanOrEqual(profile[0]);
    expect(profile[2]).toBeGreaterThanOrEqual(profile[1]);
    expect(profile[2]).toBeGreaterThan(profile[0]);
    // the glass size is set separately in the Staklo tab, so the area must at least never shrink
    expect(glass[1]).toBeGreaterThanOrEqual(glass[0]);
    expect(glass[2]).toBeGreaterThanOrEqual(glass[1]);
  });

  test('a taller frame never needs less profile', async ({ configurator }) => {
    await configurator.goto();
    const min = Number(await configurator.height.getAttribute('min'));
    const max = Number(await configurator.height.getAttribute('max'));
    const mid = Math.round((min + max) / 2 / 10) * 10;

    const profile: number[] = [];
    const glass: number[] = [];
    for (const value of [min, mid, max]) {
      await configurator.setNumber(configurator.height, value);
      await expect(configurator.dimensionText).toContainText(`× ${value} mm`);
      profile.push(await configurator.profileValue());
      glass.push(await configurator.glassValue());
    }

    expect(profile[1]).toBeGreaterThanOrEqual(profile[0]);
    expect(profile[2]).toBeGreaterThanOrEqual(profile[1]);
    expect(profile[2]).toBeGreaterThan(profile[0]);
    expect(glass[1]).toBeGreaterThanOrEqual(glass[0]);
    expect(glass[2]).toBeGreaterThanOrEqual(glass[1]);
  });

  test('a wider glass pane increases the glass area and never lowers the price', async ({
    configurator,
  }) => {
    await configurator.goto();

    // 1. Open tab 'Staklo'. Record 'm² stakla' and unit price
    await configurator.settingsTab('Staklo').click();
    const glassBefore = await configurator.glassValue();
    const priceBefore = await configurator.unitPriceValue();
    const widthBefore = Number(await configurator.glassWidth.inputValue());

    await configurator.setNumber(configurator.glassWidth, widthBefore + 170);
    await expect(configurator.glassWidth).toHaveValue(String(widthBefore + 170));

    await expect.poll(() => configurator.glassValue()).toBeGreaterThan(glassBefore);
    expect(await configurator.unitPriceValue()).toBeGreaterThanOrEqual(priceBefore);
  });

  test('triple glazing never lowers the unit price', async ({ configurator }) => {
    await configurator.goto();
    await configurator.settingsTab('Staklo').click();
    const priceBefore = await configurator.unitPriceValue();
    const glassBefore = await configurator.glassValue();

    await configurator.glassType.selectOption('Troslojno');

    await expect.poll(() => configurator.unitPriceValue()).toBeGreaterThanOrEqual(priceBefore);
    expect(await configurator.glassValue()).toBeGreaterThanOrEqual(glassBefore);
  });

  for (const quantity of [1, 3, 20]) {
    test(`total equals unit price times quantity for ${quantity} pcs${quantity === 3 ? ' @smoke' : ''}`, async ({
      configurator,
    }) => {
      await configurator.goto();
      const unit = await configurator.unitPriceValue();

      await configurator.setNumber(configurator.quantity, quantity);
      await expect(configurator.quantity).toHaveValue(String(quantity));

      await expect.poll(() => configurator.totalValue()).toBeCloseTo(unit * quantity, 2);
      expect(await configurator.unitPriceValue()).toBeCloseTo(unit, 2);
    });
  }

  test('reset restores the starting example', async ({ configurator }) => {
    await configurator.goto();
    const startUnit = await configurator.unitPriceValue();
    const startProfile = await configurator.profileValue();
    const startGlass = await configurator.glassValue();

    await test.step('change model, quantity, width and glass', async () => {
      await configurator.model('Duo').click();
      await expect(configurator.selectionHeading).toHaveText('Duo');
      await configurator.setNumber(configurator.quantity, 5);
      await configurator.setNumber(configurator.width, 1300);
      await configurator.settingsTab('Staklo').click();
      await configurator.glassType.selectOption('Troslojno');
    });

    await test.step('reset', async () => {
      await configurator.resetButton.click();
      // Observed: reset keeps the selected settings tab, so go back to Mjere to read the sizes
      await configurator.settingsTab('Mjere').click();
    });

    await expect(configurator.model('Luma')).toHaveAttribute('aria-pressed', 'true');
    await expect(configurator.selectionHeading).toHaveText('Luma');
    await expect(configurator.width).toHaveValue('1000');
    await expect(configurator.height).toHaveValue('2100');
    await expect(configurator.quantity).toHaveValue('1');
    await expect(configurator.dimensionText).toHaveText('1000 × 2100 mm');
    await expect.poll(() => configurator.unitPriceValue()).toBeCloseTo(startUnit, 2);
    expect(await configurator.totalValue()).toBeCloseTo(startUnit, 2);
    expect(await configurator.profileValue()).toBeCloseTo(startProfile, 2);
    expect(await configurator.glassValue()).toBeCloseTo(startGlass, 2);
  });

  test("'Pogledajte šta dobija firma' switches to the company view @smoke", async ({ configurator }) => {
    await configurator.goto();

    // 1. Click 'Pogledajte šta dobija firma →'
    await configurator.firmButton.click();

    await expect(configurator.companyView).toHaveAttribute('aria-pressed', 'true');
    await expect(configurator.customerView).toHaveAttribute('aria-pressed', 'false');
    await expect(configurator.customerRegion).toBeHidden();
    await expect(configurator.firmRegion).toBeVisible();
    await expect(
      configurator.firmRegion.getByRole('heading', { name: 'Ponuda i priprema proizvodnje' }),
    ).toBeVisible();

    const subTabs = configurator.firmRegion.getByRole('group', { name: 'Poslovni pregled' });
    await expect(subTabs.getByRole('button')).toHaveText([
      'Ponuda',
      'Materijal',
      'Rezanje',
      'Sklapanje',
      'Isporuka',
    ]);
    await expect(subTabs.getByRole('button', { name: 'Ponuda' })).toHaveAttribute('aria-pressed', 'true');

    await configurator.customerView.click();
    await expect(configurator.customerRegion).toBeVisible();
    await expect(configurator.firmRegion).toBeHidden();
  });

  test('home page embeds the configurator and links to the full tool', async ({ nitHome, configurator }) => {
    await nitHome.goto('?lang=bs');

    // 1. nitHome.goto('?lang=bs'); scroll to #isprobaj; use ConfiguratorPage on the iframe
    await nitHome.configuratorSection.scrollIntoViewIfNeeded();
    const embedded = new ConfiguratorPage(nitHome.configFrame);
    await expect(embedded.modelGroup).toBeVisible();
    await expect(embedded.model('Luma')).toHaveAttribute('aria-pressed', 'true');

    await expect(nitHome.fullToolLink).toHaveText('Otvori cijeli alat ↗');
    await expect(nitHome.fullToolLink).toHaveAttribute('href', '/konfigurator.html?lang=bs');

    await nitHome.fullToolLink.click();
    await expect(configurator.heading).toHaveText('Konfigurator prozora i vrata');
    await expect(configurator.model('Luma')).toHaveAttribute('aria-pressed', 'true');
    await expect(configurator.width).toHaveValue('1000');
    await expect(configurator.height).toHaveValue('2100');
  });

  test('home page embed and full-tool link follow the English language', async ({ nitHome }) => {
    await nitHome.goto('?lang=en');

    await expect(nitHome.configFrameElement).toHaveAttribute('src', /lang=en$/);
    await expect(nitHome.fullToolLink).toHaveText('Open the full tool ↗');
    await expect(nitHome.fullToolLink).toHaveAttribute('href', '/konfigurator.html?lang=en');
  });

  test('user can add a selection to the demo inquiry', async ({ configurator }) => {
    await configurator.goto();
    const addedMessage = 'Stavka je u demo upitu. Možete dodati drugi model ili otvoriti pregled firme.';

    await test.step('add the default Luma', async () => {
      await configurator.addButton.click();
      await expect(configurator.status).toHaveText(addedMessage);
      // Observed: a fresh load already shows badge 1, adding the same Luma keeps it at 1
      await expect(configurator.companyView).toHaveAccessibleName(/^02 Šta vidi firma\s*1$/);
    });

    await test.step('select Duo and add it', async () => {
      await configurator.model('Duo').click();
      await expect(configurator.selectionHeading).toHaveText('Duo');
      await configurator.addButton.click();
      await expect(configurator.status).toHaveText(addedMessage);
      await expect(configurator.companyView).toHaveAccessibleName(/^02 Šta vidi firma\s*2$/);
    });

    await test.step('the company view lists both items', async () => {
      await configurator.companyView.click();
      await expect(configurator.firmRegion.getByRole('heading', { name: 'Luma · 1 kom' })).toBeVisible();
      await expect(configurator.firmRegion.getByRole('heading', { name: 'Duo · 1 kom' })).toBeVisible();
    });
  });
});
