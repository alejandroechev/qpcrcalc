import { describe, it, expect } from 'vitest';
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

describe('parseCt', () => {
  it('parses CSV with Sample, Gene, Ct columns', () => {
    const records = parseCt(CSV);
    expect(records).toHaveLength(12);
    expect(records[0]).toEqual({ sample: 'Control', gene: 'GAPDH', ct: 20.1 });
  });

  it('parses TSV', () => {
    const tsv = CSV.replace(/,/g, '\t');
    const records = parseCt(tsv);
    expect(records).toHaveLength(12);
  });

  it('handles Undetermined values', () => {
    const csv = `Sample,Gene,Ct\nS1,G1,Undetermined`;
    const records = parseCt(csv);
    expect(records[0].ct).toBeNull();
  });

  it('handles NaN values', () => {
    const csv = `Sample,Gene,Ct\nS1,G1,NaN`;
    const records = parseCt(csv);
    expect(records[0].ct).toBeNull();
  });

  it('handles empty Ct', () => {
    const csv = `Sample,Gene,Ct\nS1,G1,`;
    const records = parseCt(csv);
    expect(records[0].ct).toBeNull();
  });

  it('throws on missing columns', () => {
    expect(() => parseCt('Name,Value\nA,1')).toThrow('Missing required columns');
  });

  it('returns empty for single line', () => {
    expect(parseCt('Sample,Gene,Ct')).toEqual([]);
  });
});
