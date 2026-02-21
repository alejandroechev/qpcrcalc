import { describe, it, expect } from 'vitest';
import { groupReplicates, mean, sem, geometricMean } from '../stats.js';
import type { CtRecord } from '../types.js';

describe('groupReplicates', () => {
  it('groups same Sample+Gene as replicates', () => {
    const records: CtRecord[] = [
      { sample: 'S1', gene: 'G1', ct: 20.0 },
      { sample: 'S1', gene: 'G1', ct: 20.2 },
      { sample: 'S1', gene: 'G1', ct: 20.4 },
    ];
    const groups = groupReplicates(records);
    expect(groups).toHaveLength(1);
    expect(groups[0].n).toBe(3);
    expect(groups[0].meanCt).toBeCloseTo(20.2, 4);
  });

  it('excludes null Ct values', () => {
    const records: CtRecord[] = [
      { sample: 'S1', gene: 'G1', ct: 20.0 },
      { sample: 'S1', gene: 'G1', ct: null },
    ];
    const groups = groupReplicates(records);
    expect(groups[0].n).toBe(1);
    expect(groups[0].meanCt).toBe(20.0);
  });

  it('computes SD and CV%', () => {
    const records: CtRecord[] = [
      { sample: 'S1', gene: 'G1', ct: 20.0 },
      { sample: 'S1', gene: 'G1', ct: 22.0 },
    ];
    const groups = groupReplicates(records);
    expect(groups[0].sd).toBeCloseTo(Math.sqrt(2), 4);
    expect(groups[0].cv).toBeGreaterThan(0);
  });
});

describe('mean', () => {
  it('computes arithmetic mean', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });
  it('returns NaN for empty', () => {
    expect(mean([])).toBeNaN();
  });
});

describe('sem', () => {
  it('computes SEM = SD/sqrt(n)', () => {
    expect(sem(2, 4)).toBe(1);
  });
  it('returns 0 for n <= 1', () => {
    expect(sem(2, 1)).toBe(0);
  });
});

describe('geometricMean', () => {
  it('computes geometric mean', () => {
    expect(geometricMean([4, 16])).toBeCloseTo(8, 4);
  });
});
