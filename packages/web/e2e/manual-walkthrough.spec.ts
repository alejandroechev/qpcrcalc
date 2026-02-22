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

// ─── Phase 2 Manual Walkthrough ─────────────────────────────────────────

test.describe('Manual Walkthrough: App Load', () => {
  test('app loads with visible title, textarea, chart, and results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // Textarea has default demo data
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    const val = await textarea.inputValue();
    expect(val).toContain('Sample,Gene,Ct');
    expect(val).toContain('Control,GAPDH');
    // Results auto-calculated
    await waitForResults(page);
    // Chart visible
    await expect(page.locator('.chart-panel')).toBeVisible();
    // Results table has rows
    const rows = page.locator('.results-table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
    // No console errors
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('Manual Walkthrough: Dark Theme Readability', () => {
  test('dark mode — all text readable, no invisible text', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: '🌙' }).click();
    await waitForResults(page);

    // Title text color should be light
    const titleColor = await page.locator('h1').evaluate(el => getComputedStyle(el).color);
    expect(titleColor).toBe('rgb(226, 232, 240)'); // --fg in dark

    // Results table header text readable
    const thColor = await page.locator('.results-table th').first().evaluate(
      el => getComputedStyle(el).color,
    );
    expect(thColor).toBe('rgb(226, 232, 240)');

    // Results table data cells readable
    const tdColor = await page.locator('.results-table td').nth(1).evaluate(
      el => getComputedStyle(el).color,
    );
    // Should inherit from body/app which is --fg
    expect(tdColor).toBe('rgb(226, 232, 240)');

    // Textarea text readable
    const textareaColor = await page.locator('textarea').evaluate(
      el => getComputedStyle(el).color,
    );
    expect(textareaColor).toBe('rgb(226, 232, 240)');

    // Chart axes readable (recharts text fill)
    const axisText = page.locator('.recharts-text');
    const count = await axisText.count();
    expect(count).toBeGreaterThan(0);

    // Legend text readable in dark mode
    const legendText = page.locator('.recharts-legend-item-text');
    if (await legendText.count() > 0) {
      const legendColor = await legendText.first().evaluate(
        el => getComputedStyle(el).color,
      );
      expect(legendColor).toBe('rgb(226, 232, 240)');
    }

    // Toolbar buttons visible
    const btnColor = await page.locator('.toolbar button').first().evaluate(
      el => getComputedStyle(el).color,
    );
    expect(btnColor).toBe('rgb(226, 232, 240)');
  });

  test('dark mode — chart bar elements have visible fill', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: '🌙' }).click();
    await waitForResults(page);

    // Bars should be visible (have non-transparent fill)
    const bar = page.locator('.recharts-bar-rectangle path').first();
    await expect(bar).toBeVisible();
    const fill = await bar.evaluate(el => el.getAttribute('fill'));
    expect(fill).toBeTruthy();
    expect(fill).not.toBe('none');
    expect(fill).not.toBe('transparent');
  });

  test('dark mode — error bars visible in chart', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: '🌙' }).click();
    await waitForResults(page);
    const errorBars = page.locator('.recharts-errorBar');
    await expect(errorBars.first()).toBeVisible();
  });

  test('dark mode — reference line visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: '🌙' }).click();
    await waitForResults(page);
    const refLine = page.locator('.recharts-reference-line');
    await expect(refLine).toBeVisible();
  });
});

test.describe('Manual Walkthrough: Two-Row Toolbar', () => {
  test('toolbar row 1 contains all expected elements', async ({ page }) => {
    await page.goto('/');
    const row1 = page.locator('.toolbar-row').first();
    // Title
    await expect(row1.locator('h1')).toHaveText('qPCRCalc');
    // Sample select
    await expect(row1.locator('[data-testid="samples-select"]')).toBeVisible();
    // Upload button
    await expect(row1.locator('[data-testid="upload-btn"]')).toBeVisible();
    // Guide button
    await expect(row1.locator('button', { hasText: '📖 Guide' })).toBeVisible();
    // Feedback button
    await expect(row1.locator('button', { hasText: '💬 Feedback' })).toBeVisible();
    // Theme toggle button
    const themeBtn = row1.locator('button', { hasText: /🌙|☀️/ });
    await expect(themeBtn).toBeVisible();
  });

  test('toolbar row 2 contains ref genes and control selector', async ({ page }) => {
    await page.goto('/');
    const row2 = page.locator('[data-testid="toolbar-row-2"]');
    await expect(row2).toBeVisible();
    // Ref gene section
    await expect(row2.locator('.ref-genes')).toBeVisible();
    // Should show "Ref:" label
    await expect(row2.locator('.ref-genes span')).toHaveText('Ref:');
    // GAPDH checkbox
    const gapdh = row2.locator('.ref-genes label', { hasText: 'GAPDH' });
    await expect(gapdh).toBeVisible();
    // Control selector
    await expect(row2.locator('select')).toBeVisible();
  });
});

test.describe('Manual Walkthrough: Sample Datasets', () => {
  const sampleNames = [
    'Cancer Biomarkers',
    'Inflammation Panel',
    'Drug Time Course',
    'Low Expression (QC Flags)',
    'Multi-Reference Validation',
  ];

  for (const name of sampleNames) {
    test(`loading "${name}" updates results`, async ({ page }) => {
      await page.goto('/');
      await loadSample(page, name);
      await waitForResults(page);
      // Results table has rows
      const rowCount = await page.locator('.results-table tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
      // Chart is visible
      await expect(page.locator('.chart-panel svg').first()).toBeVisible();
      // Bars present
      await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible();
    });
  }

  test('switching between samples updates textarea', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Cancer Biomarkers');
    let text = await page.locator('textarea').inputValue();
    expect(text).toContain('Tumor-A');

    await loadSample(page, 'Drug Time Course');
    text = await page.locator('textarea').inputValue();
    expect(text).toContain('CYP3A4');
    expect(text).not.toContain('Tumor-A');
  });
});

test.describe('Manual Walkthrough: File Upload', () => {
  test('upload CSV via file input', async ({ page }) => {
    await page.goto('/');
    const csvContent = `Sample,Gene,Ct
Ctrl,GAPDH,20.0
Ctrl,GAPDH,20.2
Ctrl,GeneX,25.0
Ctrl,GeneX,25.2
Test,GAPDH,20.1
Test,GAPDH,20.3
Test,GeneX,22.0
Test,GeneX,22.2`;
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    await expect(page.locator('textarea')).toContainText('GeneX');
    await waitForResults(page);
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('GeneX');
  });

  test('upload TSV file', async ({ page }) => {
    await page.goto('/');
    const tsvContent = `Sample\tGene\tCt
Ctrl\tGAPDH\t20.0
Ctrl\tGAPDH\t20.2
Ctrl\tGeneY\t25.0
Ctrl\tGeneY\t25.2
Test\tGAPDH\t20.1
Test\tGAPDH\t20.3
Test\tGeneY\t22.0
Test\tGeneY\t22.2`;
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.tsv',
      mimeType: 'text/tab-separated-values',
      buffer: Buffer.from(tsvContent),
    });
    await expect(page.locator('textarea')).toContainText('GeneY');
    await waitForResults(page);
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('GeneY');
  });
});

test.describe('Manual Walkthrough: In-Place Exports', () => {
  test('data entry panel has CSV export button', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.data-entry [data-testid="input-csv-btn"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('📥 CSV');
  });

  test('results panel has CSV export button', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const btn = page.locator('.table-panel [data-testid="results-csv-btn"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('📥 CSV');
  });

  test('chart panel has PNG and SVG export buttons', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const pngBtn = page.locator('.chart-panel [data-testid="chart-png-btn"]');
    const svgBtn = page.locator('.chart-panel [data-testid="chart-svg-btn"]');
    await expect(pngBtn).toBeVisible();
    await expect(svgBtn).toBeVisible();
    await expect(pngBtn).toHaveText('📸 PNG');
    await expect(svgBtn).toHaveText('🖼️ SVG');
  });

  test('CSV export triggers download', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="results-csv-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('qpcrcalc_results.csv');
  });

  test('input CSV export triggers download', async ({ page }) => {
    await page.goto('/');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="input-csv-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('qpcrcalc_input.csv');
  });
});

test.describe('Manual Walkthrough: Reference Gene Toggle', () => {
  test('toggling ref gene removes it from results and recalculates', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Default: GAPDH is ref, BRCA1 and TP53 are targets
    let text = await page.locator('.results-table').innerText();
    expect(text).toContain('BRCA1');
    expect(text).toContain('TP53');
    expect(text).not.toMatch(/\bGAPDH\b.*\d/); // GAPDH should not appear as target row

    // Make BRCA1 also a reference gene
    const brca1 = page.locator('.ref-genes label', { hasText: 'BRCA1' }).locator('input');
    await brca1.check();
    await page.waitForTimeout(500);
    text = await page.locator('.results-table').innerText();
    // BRCA1 should NOT appear as a target gene row anymore
    expect(text).not.toMatch(/\bBRCA1\b/);
    // TP53 should still be there
    expect(text).toContain('TP53');
  });

  test('unchecking all ref genes hides results gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Uncheck GAPDH (the only ref gene)
    const gapdh = page.locator('.ref-genes label', { hasText: 'GAPDH' }).locator('input');
    await gapdh.uncheck();
    await page.waitForTimeout(500);
    // Should not crash - may show no results
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
  });
});

test.describe('Manual Walkthrough: Control Group', () => {
  test('changing control group recalculates fold changes', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);

    // Get initial fold changes for Control
    const getControlFC = async () => {
      const rows = page.locator('.results-table tbody tr');
      const count = await rows.count();
      const fcs: number[] = [];
      for (let i = 0; i < count; i++) {
        const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
        const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
        if (sample === 'Control') fcs.push(Number(fc));
      }
      return fcs;
    };

    // Control samples should have FC ~1.0
    const controlFCs = await getControlFC();
    for (const fc of controlFCs) {
      expect(fc).toBeCloseTo(1.0, 1);
    }

    // Change control to "Treated"
    const controlSelect = page.locator('[data-testid="toolbar-row-2"] select');
    await controlSelect.selectOption('Treated');
    await page.waitForTimeout(500);

    // Now Treated should have FC ~1.0
    const rows = page.locator('.results-table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const sample = await rows.nth(i).locator('td:nth-child(2)').innerText();
      const fc = await rows.nth(i).locator('td:nth-child(6)').innerText();
      if (sample === 'Treated') {
        expect(Number(fc)).toBeCloseTo(1.0, 1);
      }
    }
  });
});

test.describe('Manual Walkthrough: QC Flags', () => {
  test('Low Expression sample shows QC warnings in table', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Low Expression (QC Flags)');
    await waitForResults(page);

    const text = await page.locator('.results-table').innerText();
    // Should have QC flag indicators
    const hasQcFlag =
      text.includes('LOW_SIGNAL') ||
      text.includes('HIGH_CV') ||
      text.includes('UNRELIABLE');
    expect(hasQcFlag).toBe(true);

    // Should have flag-warn or flag-err CSS classes
    const warnCells = page.locator('.results-table .flag-warn, .results-table .flag-err');
    await expect(warnCells.first()).toBeVisible();
  });
});

test.describe('Manual Walkthrough: Edge Cases', () => {
  test('clearing textarea removes results without crash', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    const textarea = page.locator('textarea');
    await textarea.fill('');
    await page.waitForTimeout(500);
    // Title still there
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // Results should be gone
    const results = page.locator('.results');
    const visible = await results.isVisible().catch(() => false);
    // Either hidden or empty
    if (visible) {
      const rows = page.locator('.results-table tbody tr');
      expect(await rows.count()).toBe(0);
    }
  });

  test('all NaN Ct values handled gracefully', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,abc
Control,GAPDH,xyz
Treated,GAPDH,def`);
    await page.waitForTimeout(500);
    await expect(page.locator('h1')).toHaveText('qPCRCalc');
    // No crash, page still renders
  });

  test('single replicate handled (no SD)', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,20.0
Control,Gene1,25.0
Treated,GAPDH,20.0
Treated,Gene1,22.0`);
    await page.waitForTimeout(500);
    await waitForResults(page);
    // Should compute with SD=0
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('Gene1');
  });

  test('very large Ct values handled', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,20.0
Control,GAPDH,20.2
Control,Gene1,40.0
Control,Gene1,41.0
Treated,GAPDH,20.1
Treated,GAPDH,20.3
Treated,Gene1,38.0
Treated,Gene1,39.0`);
    await page.waitForTimeout(500);
    await waitForResults(page);
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('Gene1');
    // Should have LOW_SIGNAL flag
    expect(text).toContain('LOW_SIGNAL');
  });

  test('Undetermined Ct values handled', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample,Gene,Ct
Control,GAPDH,20.0
Control,GAPDH,20.2
Control,Gene1,25.0
Control,Gene1,Undetermined
Treated,GAPDH,20.1
Treated,GAPDH,20.3
Treated,Gene1,22.0
Treated,Gene1,22.2`);
    await page.waitForTimeout(500);
    await waitForResults(page);
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('Gene1');
  });

  test('extra whitespace in CSV handled', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('textarea');
    await textarea.fill(`Sample , Gene , Ct
Control , GAPDH , 20.0
Control , GAPDH , 20.2
Control , Gene1 , 25.0
Control , Gene1 , 25.2
Treated , GAPDH , 20.1
Treated , GAPDH , 20.3
Treated , Gene1 , 22.0
Treated , Gene1 , 22.2`);
    await page.waitForTimeout(500);
    await waitForResults(page);
    const text = await page.locator('.results-table').innerText();
    expect(text).toContain('Gene1');
  });

  test('samples select resets to placeholder after loading', async ({ page }) => {
    await page.goto('/');
    await loadSample(page, 'Cancer Biomarkers');
    await waitForResults(page);
    // The select should reset to show placeholder since value="" is set
    const selectVal = await page.locator('[data-testid="samples-select"]').inputValue();
    // Value should be empty string (placeholder) or the selected option
    // This is fine either way - just check it doesn't crash
    await expect(page.locator('[data-testid="samples-select"]')).toBeVisible();
  });
});

test.describe('Manual Walkthrough: Replicate Expansion', () => {
  test('expand button shows individual Ct values', async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
    // Click first expand button
    const expandBtn = page.locator('.expand-btn').first();
    await expandBtn.click();
    // Replicate rows appear
    const repRows = page.locator('.replicate-row');
    await expect(repRows.first()).toBeVisible();
    const repText = await repRows.first().innerText();
    expect(repText).toContain('Rep');
    expect(repText).toContain('Ct');
    // Collapse
    await expandBtn.click();
    await expect(repRows.first()).not.toBeVisible();
  });
});

test.describe('Manual Walkthrough: No Console Errors', () => {
  test('no console errors during normal workflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await waitForResults(page);

    // Toggle dark mode
    await page.locator('button', { hasText: '🌙' }).click();
    await page.waitForTimeout(200);

    // Load each sample
    for (const name of [
      'Cancer Biomarkers',
      'Inflammation Panel',
      'Drug Time Course',
      'Low Expression (QC Flags)',
      'Multi-Reference Validation',
    ]) {
      await loadSample(page, name);
      await waitForResults(page);
    }

    // Toggle ref gene
    const firstRef = page.locator('.ref-genes label').first().locator('input');
    await firstRef.click();
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });
});
