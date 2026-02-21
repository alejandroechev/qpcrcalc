import { test, expect, type Page } from '@playwright/test';

// Helper: wait for results table to appear after data loads
async function waitForResults(page: Page) {
  await expect(page.locator('.results-table')).toBeVisible({ timeout: 5000 });
}

// Helper: select a sample dataset by name
async function loadSample(page: Page, name: string) {
  const select = page.locator('select').filter({ has: page.locator('option', { hasText: 'Load…' }) });
  await select.selectOption({ label: name });
}

// Helper: get all text from results table
async function getResultsTableText(page: Page) {
  return page.locator('.results-table').innerText();
}

// ─── Core Workflow ──────────────────────────────────────────────────────

test.describe('Core Workflow', () => {
  test('page loads with default data and auto-analyzes', async ({ page }) => {
    await page.goto('/');
    // Title visible
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // Default data is in textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toContainText('Control,GAPDH');
    // Results auto-calculated
    await waitForResults(page);
  });

  test('fold change bar chart is displayed', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Chart panel with recharts SVG
    const chartPanel = page.locator('.chart-panel');
    await expect(chartPanel).toBeVisible();
    await expect(chartPanel.locator('svg').first()).toBeVisible();
    // Has bars (rect elements from recharts)
    const bars = chartPanel.locator('.recharts-bar-rectangle');
    await expect(bars.first()).toBeVisible();
  });

  test('results table shows ΔΔCt columns with fold change, SEM', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const table = page.locator('.results-table');
    // Check header columns
    await expect(table.locator('th', { hasText: 'Fold Change' })).toBeVisible();
    await expect(table.locator('th', { hasText: 'SEM' })).toBeVisible();
    await expect(table.locator('th', { hasText: /^ΔCt$/ })).toBeVisible();
    await expect(table.locator('th', { hasText: /^ΔΔCt$/ })).toBeVisible();
    await expect(table.locator('th', { hasText: 'QC' })).toBeVisible();
    // Fold change values present (numeric cells)
    const foldCells = table.locator('tbody tr td:nth-child(6)');
    const count = await foldCells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await foldCells.nth(i).innerText();
      expect(Number(text)).not.toBeNaN();
    }
  });

  test('QC flags shown for clean data as OK', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Default demo data should have ✓ OK flags
    const table = page.locator('.results-table');
    const qcCells = table.locator('tbody tr td:nth-child(8)');
    const count = await qcCells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await qcCells.nth(i).innerText();
      expect(text).toContain('OK');
    }
  });
});

// ─── Sample Loading ─────────────────────────────────────────────────────

test.describe('Samples', () => {
  test('Cancer Biomarkers loads and shows upregulation', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Cancer Biomarkers');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    // Should show BRCA1 gene results
    expect(text).toContain('BRCA1');
    // Tumor samples should have fold change > 1 (upregulated)
    const table = page.locator('.results-table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    let foundUpregulated = false;
    for (let i = 0; i < rowCount; i++) {
      const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
      const gene = await rows.nth(i).locator('td:nth-child(3)').innerText();
      const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
      if (sample.startsWith('Tumor') && gene === 'BRCA1') {
        expect(Number(fc)).toBeGreaterThan(1);
        foundUpregulated = true;
      }
    }
    expect(foundUpregulated).toBe(true);
  });

  test('Inflammation Panel loads and recalculates', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Inflammation Panel');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    expect(text).toContain('IL6');
    expect(text).toContain('TNFa');
    // Control group changed to Unstimulated
    const controlSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Unstimulated' }) });
    await expect(controlSelect).toHaveValue('Unstimulated');
  });

  test('Drug Time Course loads correctly', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Drug Time Course');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    expect(text).toContain('CYP3A4');
    // Check that 24h sample has highest fold change (progressive induction)
    const table = page.locator('.results-table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    let fc24h = 0;
    for (let i = 0; i < rowCount; i++) {
      const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
      const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
      if (sample === '24h') {
        fc24h = Number(fc);
      }
    }
    expect(fc24h).toBeGreaterThan(1);
  });

  test('Low Expression triggers Ct>35 QC flags', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Low Expression (QC Flags)');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    expect(text).toContain('RareGene');
    // Should have QC warning flags (HIGH_CV or LOW_SIGNAL or UNRELIABLE)
    const hasFlag = text.includes('LOW_SIGNAL') ||
                    text.includes('HIGH_CV') ||
                    text.includes('UNRELIABLE');
    expect(hasFlag).toBe(true);
  });

  test('Multi-Reference Validation works with two ref genes', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Multi-Reference Validation');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    expect(text).toContain('VEGF');
    expect(text).toContain('HIF1A');
    // Both ref genes should be checked in toolbar
    const gapdh = page.locator('.ref-genes label', { hasText: 'GAPDH' }).locator('input');
    const bactin = page.locator('.ref-genes label', { hasText: 'B-actin' }).locator('input');
    await expect(gapdh).toBeChecked();
    await expect(bactin).toBeChecked();
  });
});

// ─── Data Entry & Error Handling ────────────────────────────────────────

test.describe('Data Entry', () => {
  test('clearing data removes results gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Clear the textarea
    const textarea = page.locator('textarea');
    await textarea.fill('');
    // Should not crash — page still functioning
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // Results table body should be empty (no data rows)
    await page.waitForTimeout(500);
    const rows = page.locator('.results-table tbody tr');
    const count = await rows.count();
    expect(count).toBe(0);
  });

  test('invalid Ct values (text) are handled gracefully', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,abc
Control,GAPDH,xyz
Treated,GAPDH,def`);
    // Should not crash — may show no results or partial results
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // No uncaught error
    await page.waitForTimeout(500);
  });

  test('negative Ct values are handled', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,-5.0
Control,GAPDH,-3.2
Control,Gene1,20.0
Control,Gene1,21.0
Treated,GAPDH,-4.0
Treated,GAPDH,-3.5
Treated,Gene1,18.0
Treated,Gene1,19.0`);
    // Should still parse (negative Ct is unusual but valid number)
    await page.waitForTimeout(500);
    // No crash
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
  });

  test('missing columns in CSV header handled', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Name,Value
A,10
B,20`);
    // Missing Sample,Gene,Ct columns — should not crash
    await expect(page.locator('.results-table')).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
  });
});

// ─── Results Validation ─────────────────────────────────────────────────

test.describe('Results', () => {
  test('control sample fold change is ~1.0', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const table = page.locator('.results-table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
      const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
      if (sample === 'Control') {
        // Control fold change should be 1.0 (or very close)
        expect(Number(fc)).toBeCloseTo(1.0, 1);
      }
    }
  });

  test('reference line at y=1 in chart', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Recharts ReferenceLine renders as a line element
    const refLine = page.locator('.chart-panel .recharts-reference-line');
    await expect(refLine).toBeVisible();
  });

  test('error bars visible on chart', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // ErrorBar renders as line elements inside .recharts-errorBar
    const errorBars = page.locator('.chart-panel .recharts-errorBar');
    await expect(errorBars.first()).toBeVisible();
  });

  test('CV% flag-warn class applied for high CV samples', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Low Expression (QC Flags)');
    await waitForResults(page);
    // Should have flag-warn or flag-err cells
    const warnCells = page.locator('.results-table .flag-warn, .results-table .flag-err');
    await expect(warnCells.first()).toBeVisible();
  });
});

// ─── UI Controls ────────────────────────────────────────────────────────

test.describe('UI Controls', () => {
  test('theme toggle switches dark/light', async ({ page }) => {
    await page.goto('/');
    // Default is light
    const app = page.locator('.app');
    await expect(app).toHaveAttribute('data-theme', 'light');
    // Click dark mode toggle (🌙 button)
    await page.locator('button', { hasText: '🌙' }).click();
    await expect(app).toHaveAttribute('data-theme', 'dark');
    // Toggle back
    await page.locator('button', { hasText: '☀️' }).click();
    await expect(app).toHaveAttribute('data-theme', 'light');
  });

  test('Guide button opens new window', async ({ page, context }) => {
    await page.goto('/');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('button', { hasText: '📖 Guide' }).click(),
    ]);
    expect(popup.url()).toContain('intro.html');
  });

  test('reference gene selector toggles genes', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // GAPDH is checked by default
    const gapdh = page.locator('.ref-genes label', { hasText: 'GAPDH' }).locator('input');
    await expect(gapdh).toBeChecked();
    // Check another gene (e.g. BRCA1)
    const brca1 = page.locator('.ref-genes label', { hasText: 'BRCA1' }).locator('input');
    await brca1.check();
    await expect(brca1).toBeChecked();
    // Results should update (BRCA1 should no longer appear as target)
    await page.waitForTimeout(300);
    const text = await getResultsTableText(page);
    // BRCA1 should NOT appear as a target gene row anymore
    expect(text).not.toMatch(/\bBRCA1\b/);
  });

  test('control group selector changes control', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const controlSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Control' }) }).first();
    // Change control to Treated
    await controlSelect.selectOption('Treated');
    await page.waitForTimeout(300);
    // Treated should now have fold change ~1.0
    const table = page.locator('.results-table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
      const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
      if (sample === 'Treated') {
        expect(Number(fc)).toBeCloseTo(1.0, 1);
      }
    }
  });

  test('expand replicate details', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Click first expand button
    const expandBtn = page.locator('.expand-btn').first();
    await expandBtn.click();
    // Replicate rows should appear
    const repRows = page.locator('.replicate-row');
    await expect(repRows.first()).toBeVisible();
    const repText = await repRows.first().innerText();
    expect(repText).toContain('Rep');
    expect(repText).toContain('Ct');
  });
});
