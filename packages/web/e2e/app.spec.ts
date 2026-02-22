import { test, expect, type Page } from '@playwright/test';

// Helper: wait for results table to appear after data loads
async function waitForResults(page: Page) {
  await expect(page.locator('.results-table')).toBeVisible({ timeout: 5000 });
}

// Helper: select a sample dataset by name
async function loadSample(page: Page, name: string) {
  const select = page.locator('[data-testid="samples-select"]');
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

// ─── Dark Theme ─────────────────────────────────────────────────────────

test.describe('Dark Theme', () => {
  test('dark theme persists via localStorage', async ({ page }) => {
    await page.goto('/');
    // Enable dark mode
    await page.locator('button', { hasText: '🌙' }).click();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
    // Reload page — should restore dark
    await page.reload();
    await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
  });

  test('dark theme applies CSS custom properties to all surfaces', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: '🌙' }).click();
    await waitForResults(page);
    // App container background should be dark (inherits via data-theme)
    const appBg = await page.locator('.app').evaluate(el => getComputedStyle(el).backgroundColor);
    // .app doesn't have background set, check body gets dark via document element
    // Toolbar surface
    const toolbarBg = await page.locator('.toolbar').evaluate(el => getComputedStyle(el).backgroundColor);
    // #1e293b = rgb(30, 41, 59)
    expect(toolbarBg).toBe('rgb(30, 41, 59)');
    // Textarea
    const textareaBg = await page.locator('textarea').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(textareaBg).toBe('rgb(30, 41, 59)');
    // Table panel
    const tableBg = await page.locator('.table-panel').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe('rgb(30, 41, 59)');
  });
});

// ─── Two-Row Toolbar Layout ─────────────────────────────────────────────

test.describe('Toolbar Layout', () => {
  test('toolbar has two rows', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('.toolbar-row');
    await expect(rows).toHaveCount(2);
  });

  test('row 1 has title, samples select, upload, guide, feedback, theme', async ({ page }) => {
    await page.goto('/');
    const row1 = page.locator('.toolbar-row').first();
    await expect(row1.locator('h1')).toHaveText('qPCRCalc');
    await expect(row1.locator('[data-testid="samples-select"]')).toBeVisible();
    await expect(row1.locator('[data-testid="upload-btn"]')).toBeVisible();
    await expect(row1.locator('button', { hasText: '📖 Guide' })).toBeVisible();
    await expect(row1.locator('button', { hasText: '💬 Feedback' })).toBeVisible();
  });

  test('row 2 has ref gene checkboxes and control group selector', async ({ page }) => {
    await page.goto('/');
    const row2 = page.locator('[data-testid="toolbar-row-2"]');
    await expect(row2.locator('.ref-genes')).toBeVisible();
    await expect(row2.locator('select')).toBeVisible();
  });
});

// ─── File Upload ────────────────────────────────────────────────────────

test.describe('File Upload', () => {
  test('upload CSV via toolbar button populates textarea', async ({ page }) => {
    await page.goto('/');
    const csvContent = `Sample,Gene,Ct\nCtrl,GAPDH,20.0\nCtrl,GAPDH,20.2\nCtrl,GeneX,25.0\nCtrl,GeneX,25.2\nTest,GAPDH,20.1\nTest,GAPDH,20.3\nTest,GeneX,22.0\nTest,GeneX,22.2`;
    // Set file via hidden input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    // Textarea should update
    await expect(page.locator('textarea')).toContainText('GeneX');
    await waitForResults(page);
    const text = await getResultsTableText(page);
    expect(text).toContain('GeneX');
  });
});

// ─── In-Place Exports ───────────────────────────────────────────────────

test.describe('In-Place Exports', () => {
  test('results CSV button is on the table panel', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const btn = page.locator('[data-testid="results-csv-btn"]');
    await expect(btn).toBeVisible();
    // Should be inside table-panel
    const panel = page.locator('.table-panel');
    await expect(panel.locator('[data-testid="results-csv-btn"]')).toBeVisible();
  });

  test('input CSV button is on the data entry panel', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-testid="input-csv-btn"]');
    await expect(btn).toBeVisible();
    const panel = page.locator('.data-entry');
    await expect(panel.locator('[data-testid="input-csv-btn"]')).toBeVisible();
  });

  test('chart PNG and SVG buttons are on the chart panel', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const chart = page.locator('.chart-panel');
    await expect(chart.locator('[data-testid="chart-png-btn"]')).toBeVisible();
    await expect(chart.locator('[data-testid="chart-svg-btn"]')).toBeVisible();
  });

  test('no export buttons in toolbar', async ({ page }) => {
    await page.goto('/');
    const toolbar = page.locator('.toolbar');
    // Should not have CSV or PNG buttons in the toolbar
    await expect(toolbar.locator('button', { hasText: '📥 CSV' })).not.toBeVisible();
    await expect(toolbar.locator('button', { hasText: '📸 PNG' })).not.toBeVisible();
  });
});

// ─── State Persistence ──────────────────────────────────────────────────

test.describe('State Persistence', () => {
  test('data persists across page reload', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    const customData = `Sample,Gene,Ct\nCtrl,GAPDH,20.0\nCtrl,GeneX,25.0\nTest,GAPDH,20.1\nTest,GeneX,22.0`;
    await textarea.fill(customData);
    await page.waitForTimeout(700);
    await page.reload();
    await expect(textarea).toContainText('GeneX');
  });

  test('ref genes and control group persist across reload', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Default control is "Control" — change to "Treated"
    const controlSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Control' }) }).first();
    await controlSelect.selectOption('Treated');
    await page.waitForTimeout(700);
    await page.reload();
    await page.waitForTimeout(500);
    // Control should still be Treated
    const stored = await page.evaluate(() => {
      const json = localStorage.getItem('qpcrcalc-state');
      return json ? JSON.parse(json) : null;
    });
    expect(stored?.controlGroup).toBe('Treated');
  });
});

// ─── Toolbar Button Order ───────────────────────────────────────────────

test.describe('Toolbar Button Order', () => {
  test('row 1: Upload before Samples, then spacer, Guide, Feedback, Theme', async ({ page }) => {
    await page.goto('/');
    const row1 = page.locator('.toolbar-row').first();
    const html = await row1.innerHTML();
    const uploadIdx = html.indexOf('Upload');
    const samplesIdx = html.indexOf('samples-select');
    const spacerIdx = html.indexOf('toolbar-spacer');
    const guideIdx = html.indexOf('Guide');
    expect(uploadIdx).toBeLessThan(samplesIdx);
    expect(samplesIdx).toBeLessThan(spacerIdx);
    expect(spacerIdx).toBeLessThan(guideIdx);
  });
});
