// spec: specs/QAP-4.md
// seed: tests/nit/seed.spec.ts
import { test, expect } from '../../fixtures';
import { serviceTabs } from '../../utils/nitData';

test.describe('QAP-6 Services tablist', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto('?lang=bs');
  });

  test('four service tabs, first selected, only the selected panel visible @smoke', async ({ nitHome }) => {
    // 1. Read the tabs in tablist "Usluge"
    await expect(nitHome.serviceTabs.getByRole('tab')).toHaveText(serviceTabs.map(t => t.name));
    await expect(nitHome.serviceTab(serviceTabs[0].name)).toHaveAttribute('aria-selected', 'true');
    for (const tab of serviceTabs.slice(1)) {
      await expect(nitHome.serviceTab(tab.name)).toHaveAttribute('aria-selected', 'false');
    }
    await expect(nitHome.servicePanel('web')).toBeVisible();
    await expect(nitHome.servicePanel('apps')).toBeHidden();
    await expect(nitHome.servicePanel('production')).toBeHidden();
    await expect(nitHome.servicePanel('external')).toBeHidden();

    // 2. Click each tab in turn
    for (const selected of serviceTabs) {
      await test.step(`select "${selected.name}"`, async () => {
        await nitHome.serviceTab(selected.name).click();
        for (const tab of serviceTabs) {
          const isSelected = tab.name === selected.name;
          await expect(nitHome.serviceTab(tab.name)).toHaveAttribute('aria-selected', String(isSelected));
          if (isSelected) {
            await expect(nitHome.servicePanel(tab.panel)).toBeVisible();
          } else {
            await expect(nitHome.servicePanel(tab.panel)).toBeHidden();
          }
        }
      });
    }
  });

  test('service tabs support keyboard navigation', async ({ nitHome, page }) => {
    // 1. Focus the first tab, press ArrowRight, End, Home, ArrowLeft
    const web = nitHome.serviceTab(serviceTabs[0].name);
    const apps = nitHome.serviceTab(serviceTabs[1].name);
    const production = nitHome.serviceTab(serviceTabs[2].name);
    const external = nitHome.serviceTab(serviceTabs[3].name);
    await web.focus();

    await test.step('ArrowRight selects and focuses the next tab', async () => {
      await page.keyboard.press('ArrowRight');
      await expect(apps).toHaveAttribute('aria-selected', 'true');
      await expect(apps).toBeFocused();
      await expect(nitHome.servicePanel('apps')).toBeVisible();
    });

    await test.step('End selects the last tab, Home the first', async () => {
      await page.keyboard.press('End');
      await expect(external).toHaveAttribute('aria-selected', 'true');
      await expect(external).toBeFocused();
      await page.keyboard.press('Home');
      await expect(web).toHaveAttribute('aria-selected', 'true');
      await expect(web).toBeFocused();
    });

    await test.step('ArrowLeft on the first tab wraps to the last', async () => {
      await page.keyboard.press('ArrowLeft');
      await expect(external).toHaveAttribute('aria-selected', 'true');
      await expect(external).toBeFocused();
    });

    await test.step('only the selected tab is in the tab order', async () => {
      await expect(external).toHaveAttribute('tabindex', '0');
      for (const other of [web, apps, production]) {
        await expect(other).toHaveAttribute('tabindex', '-1');
      }
    });
  });

  test('project tabs switch the story and the visit link @smoke', async ({ nitHome }) => {
    // 1. Click each project tab on the Web panel
    const projects = ['KJ Tools', 'UGANJAJ', 'Atlas BiH'] as const;
    const hrefs: string[] = [];
    for (const name of projects) {
      await test.step(`select project ${name}`, async () => {
        await nitHome.projectTab(name).click();
        await expect(nitHome.projectTab(name)).toHaveAttribute('aria-selected', 'true');
        await expect(nitHome.projectStory).toHaveText(name);
        await expect(nitHome.visitLink).toHaveAttribute('href', /^https:\/\//);
        hrefs.push((await nitHome.visitLink.getAttribute('href'))!);
      });
    }
    expect(new Set(hrefs).size).toBe(projects.length);
  });

  test('each project shows exactly one pressed view button', async ({ nitHome }) => {
    // 1. Per project: one pressed view, then click another view
    const projects = [
      { name: 'KJ Tools', views: 3, other: 'Katalog proizvoda' },
      { name: 'UGANJAJ', views: 3, other: 'Pretraga i oglasi' },
      { name: 'Atlas BiH', views: 2, other: '3D karta' },
    ] as const;
    const pressed = nitHome.projectPanel.getByRole('button', { pressed: true });
    for (const project of projects) {
      await test.step(project.name, async () => {
        await nitHome.projectTab(project.name).click();
        await expect(nitHome.projectTab(project.name)).toHaveAttribute('aria-selected', 'true');
        await expect(nitHome.projectViewButtons).toHaveCount(project.views);
        await expect(pressed).toHaveCount(1);

        const other = nitHome.projectViewButtons.filter({ hasText: project.other });
        await other.click();
        await expect(other).toHaveAttribute('aria-pressed', 'true');
        await expect(pressed).toHaveCount(1);
      });
    }
  });

  test('app tabs switch the app description', async ({ nitHome }) => {
    // 1. Open "PC i mobilne aplikacije" and click through the three app screens
    await nitHome.openService('PC i mobilne aplikacije');
    const copies: string[] = [];
    for (const name of ['Oglasi', 'Detalji objave', 'Moj biznis'] as const) {
      await nitHome.appTab(name).click();
      await expect(nitHome.appTab(name)).toHaveAttribute('aria-selected', 'true');
      const id = await nitHome.appTab(name).getAttribute('id');
      await expect(nitHome.appView).toHaveAttribute('aria-labelledby', id!);
      await expect(nitHome.appCopy).not.toBeEmpty();
      copies.push((await nitHome.appCopy.innerText()).trim());
    }
    expect(new Set(copies).size).toBe(3);
  });

  test('production panel lists the six business-system steps in order with the language @smoke', async ({ nitHome, page }) => {
    // 1. Open "Poslovni proračuni i analize" and read the step links
    await nitHome.openService('Poslovni proračuni i analize');
    const steps = [
      ['01 Kalkulacija ↗', 'kalkulacija'],
      ['02 Materijal ↗', 'materijal'],
      ['03 Plan ↗', 'plan'],
      ['04 Proizvodnja ↗', 'proizvodnja'],
      ['05 Kvalitet ↗', 'kvalitet'],
      ['06 Pregled firme ↗', 'pregled'],
    ];
    await expect(nitHome.productionSteps).toHaveCount(steps.length);
    for (const [i, [name, slug]] of steps.entries()) {
      const link = nitHome.productionSteps.nth(i);
      await expect(link).toHaveAccessibleName(name);
      await expect(link).toHaveAttribute('href', `poslovni-sistem/${slug}.html?lang=bs`);
    }
    await expect(nitHome.walkThroughLink).toHaveAttribute('href', 'poslovni-sistem/kalkulacija.html?lang=bs');
    await expect(nitHome.overviewLink).toHaveAttribute('href', 'poslovni-sistem/pregled.html?lang=bs');

    // 2. Open step 01
    await nitHome.productionStep('01').click();
    await expect(page).toHaveURL(/\/poslovni-sistem\/kalkulacija/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Kalkulacija i ponuda');
  });

  for (const { name, panel, hash } of serviceTabs.filter(t => t.hash)) {
    test(`hash #${hash} selects "${name}" and tab clicks write the hash back`, async ({ nitHome, page }) => {
      // 1. Open the deep link
      await nitHome.goto(`?lang=bs#${hash}`);
      await expect(nitHome.serviceTab(name)).toHaveAttribute('aria-selected', 'true');
      await expect(nitHome.servicePanel(panel)).toBeVisible();
      for (const other of serviceTabs.filter(t => t.panel !== panel)) {
        await expect(nitHome.servicePanel(other.panel)).toBeHidden();
      }

      // 2. Observed: selecting the tab writes the same hash into the URL
      // (the Web tab writes #projekti instead, so it is not part of this scenario)
      await nitHome.serviceTab(serviceTabs[0].name).click();
      await nitHome.serviceTab(name).click();
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    });
  }
});
