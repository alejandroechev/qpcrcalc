import { test, expect } from '@playwright/test';

test('no React key warnings in console', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      warnings.push(msg.text());
    }
  });
  await page.goto('/');
  await expect(page.locator('.results-table')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(500);
  const keyWarnings = warnings.filter(w => w.includes('key'));
  // Report any key warnings found
  if (keyWarnings.length > 0) {
    console.log('KEY WARNINGS:', keyWarnings);
  }
  expect(keyWarnings.length).toBe(0);
});
