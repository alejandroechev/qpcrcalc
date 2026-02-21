import { describe, it, expect } from 'vitest';
import { analyze } from '../index.js';
import { exportCsv } from '../export.js';

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

describe('analyze (full pipeline)', () => {
  it('returns complete analysis result', () => {
    const result = analyze(CSV, ['GAPDH'], ['Control']);
    expect(result.records).toHaveLength(12);
    expect(result.groups).toHaveLength(4);
    expect(result.deltaCtResults).toHaveLength(2);
    expect(result.results).toHaveLength(2);
  });
});

describe('QC flags', () => {
  it('flags Ct > 35 as LOW_SIGNAL', () => {
    const csv = `Sample,Gene,Ct
S1,REF,20
S1,TARGET,36
S1,TARGET,36.5`;
    const result = analyze(csv, ['REF'], ['S1']);
    const target = result.results.find(r => r.gene === 'TARGET');
    expect(target?.flags).toContain('LOW_SIGNAL');
  });

  it('flags high CV%', () => {
    const csv = `Sample,Gene,Ct
S1,REF,20
S1,REF,20.1
S1,TARGET,25
S1,TARGET,30`;
    const result = analyze(csv, ['REF'], ['S1']);
    const target = result.results.find(r => r.gene === 'TARGET');
    // SD is large → CV% > 5% → UNRELIABLE
    expect(
      target?.flags.includes('UNRELIABLE') || target?.flags.includes('HIGH_CV'),
    ).toBe(true);
  });
});

describe('exportCsv', () => {
  it('produces valid CSV', () => {
    const result = analyze(CSV, ['GAPDH'], ['Control']);
    const csv = exportCsv(result.results);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Sample');
    expect(lines[0]).toContain('Fold Change');
    expect(lines).toHaveLength(3); // header + 2 results
  });
});
