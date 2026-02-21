import { describe, it, expect } from 'vitest';
import { computeDeltaCt, computeDeltaDeltaCt } from '../analysis.js';
import { groupReplicates } from '../stats.js';
import { parseCt } from '../parser.js';

const CSV = `Sample,Gene,Ct
Control,GAPDH,20.1
Control,GAPDH,20.3
Control,GAPDH,20.2
Control,BRCA1,25.5
Control,BRCA1,25.7
Control,BRCA1,25.6
Treated,GAPDH,20.0
Treated,GAPDH,20.2
Treated,GAPDH,20.1
Treated,BRCA1,22.1
Treated,BRCA1,22.3
Treated,BRCA1,22.2`;

describe('computeDeltaCt', () => {
  it('computes ΔCt = target - reference', () => {
    const records = parseCt(CSV);
    const groups = groupReplicates(records);
    const dcts = computeDeltaCt(groups, ['GAPDH']);

    expect(dcts).toHaveLength(2); // Control+BRCA1, Treated+BRCA1
    const controlDct = dcts.find(d => d.sample === 'Control')!;
    // BRCA1 mean ~25.6, GAPDH mean ~20.2 → ΔCt ~5.4
    expect(controlDct.deltaCt).toBeCloseTo(5.4, 1);

    const treatedDct = dcts.find(d => d.sample === 'Treated')!;
    // BRCA1 mean ~22.2, GAPDH mean ~20.1 → ΔCt ~2.1
    expect(treatedDct.deltaCt).toBeCloseTo(2.1, 1);
  });
});

describe('computeDeltaDeltaCt', () => {
  it('computes ΔΔCt and fold change', () => {
    const records = parseCt(CSV);
    const groups = groupReplicates(records);
    const dcts = computeDeltaCt(groups, ['GAPDH']);
    const results = computeDeltaDeltaCt(dcts, groups, ['Control']);

    // Control ΔΔCt should be ~0, fold change ~1
    const ctrl = results.find(r => r.sample === 'Control')!;
    expect(ctrl.deltaDeltaCt).toBeCloseTo(0, 1);
    expect(ctrl.foldChange).toBeCloseTo(1, 1);

    // Treated ΔΔCt = 2.1 - 5.4 = -3.3, fold change = 2^3.3 ≈ 9.85
    const treated = results.find(r => r.sample === 'Treated')!;
    expect(treated.deltaDeltaCt).toBeCloseTo(-3.3, 1);
    expect(treated.foldChange).toBeCloseTo(Math.pow(2, 3.3), 0);
  });

  it('computes error bounds', () => {
    const records = parseCt(CSV);
    const groups = groupReplicates(records);
    const dcts = computeDeltaCt(groups, ['GAPDH']);
    const results = computeDeltaDeltaCt(dcts, groups, ['Control']);

    const treated = results.find(r => r.sample === 'Treated')!;
    expect(treated.foldChangeLo).toBeLessThan(treated.foldChange);
    expect(treated.foldChangeHi).toBeGreaterThan(treated.foldChange);
  });
});
