import { type Locator, expect } from '@playwright/test';

/**
 * Fills a field and confirms it kept the value, refilling if the app wiped it.
 * Under load a React form can re-render right after a fill and reset the input,
 * so the form gets submitted with an empty field.
 */
export async function fillAndConfirm(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 1_000 });
  }).toPass();
}
