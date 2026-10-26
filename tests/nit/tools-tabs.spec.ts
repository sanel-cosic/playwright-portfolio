import { test, expect } from '../../fixtures';
import { nitTools, type NitTool } from '../../utils/nitData';

const tools = Object.keys(nitTools) as NitTool[];

test.describe('Tools workbench tabs', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto();
  });

  test('offers five demo tools, the calculator open by default @smoke', async ({ nitHome }) => {
    await expect(nitHome.toolTabs.getByRole('tab')).toHaveCount(tools.length);
    for (const tool of tools) {
      await expect(nitHome.tab(tool)).toHaveAccessibleName(nitTools[tool]);
    }
    await expect(nitHome.tab('quote')).toHaveAttribute('aria-selected', 'true');
  });

  // Data-driven: each tab shows its own panel and hides all others
  for (const tool of tools) {
    test(`tab "${nitTools[tool]}" shows only its own panel`, async ({ nitHome }) => {
      await nitHome.openTool(tool);

      for (const other of tools.filter((t) => t !== tool)) {
        await expect(nitHome.tab(other)).toHaveAttribute('aria-selected', 'false');
        await expect(nitHome.panel(other)).toBeHidden();
      }
    });
  }

  test('tabs can be operated with the keyboard', async ({ page, nitHome }) => {
    // WAI-ARIA tabs pattern: arrows move between tabs, Home/End jump to the ends, focus wraps
    await nitHome.tab('quote').focus();

    await page.keyboard.press('ArrowRight');
    await expect(nitHome.tab('plan')).toHaveAttribute('aria-selected', 'true');
    await expect(nitHome.tab('plan')).toBeFocused();

    await page.keyboard.press('End');
    await expect(nitHome.tab('efficiency')).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(nitHome.tab('quote')).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowLeft'); // wraps around from the first tab to the last
    await expect(nitHome.tab('efficiency')).toHaveAttribute('aria-selected', 'true');
    await expect(nitHome.tab('efficiency')).toBeFocused();
  });
});
