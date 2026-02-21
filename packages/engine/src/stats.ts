import type { CtRecord, ReplicateGroup } from './types.js';

/** Group CtRecords by Sample+Gene, compute stats */
export function groupReplicates(records: CtRecord[]): ReplicateGroup[] {
  const map = new Map<string, { sample: string; gene: string; cts: number[] }>();

  for (const r of records) {
    const key = `${r.sample}|||${r.gene}`;
    let g = map.get(key);
    if (!g) {
      g = { sample: r.sample, gene: r.gene, cts: [] };
      map.set(key, g);
    }
    if (r.ct !== null) g.cts.push(r.ct);
  }

  return Array.from(map.values()).map(g => {
    const n = g.cts.length;
    const meanCt = n > 0 ? g.cts.reduce((a, b) => a + b, 0) / n : NaN;
    const sd = n > 1
      ? Math.sqrt(g.cts.reduce((s, v) => s + (v - meanCt) ** 2, 0) / (n - 1))
      : 0;
    const cv = meanCt !== 0 && !isNaN(meanCt) ? (sd / meanCt) * 100 : 0;
    return { sample: g.sample, gene: g.gene, cts: g.cts, meanCt, sd, cv, n };
  });
}

export function mean(vals: number[]): number {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}

export function sem(sd: number, n: number): number {
  return n > 1 ? sd / Math.sqrt(n) : 0;
}

/** Geometric mean (for multiple reference genes) */
export function geometricMean(vals: number[]): number {
  if (!vals.length) return NaN;
  const product = vals.reduce((a, b) => a * b, 1);
  return Math.pow(product, 1 / vals.length);
}
