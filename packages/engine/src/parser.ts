import type { CtRecord } from './types.js';

/**
 * Parse CSV/TSV text into CtRecord[].
 * Expects columns: Sample, Gene, Ct (in any order, header required).
 * Handles "Undetermined", empty, and NaN Ct values.
 */
export function parseCt(text: string): CtRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());

  const sampleIdx = headers.findIndex(h => h === 'sample');
  const geneIdx = headers.findIndex(h => h === 'gene');
  const ctIdx = headers.findIndex(h => h === 'ct');
  if (sampleIdx === -1 || geneIdx === -1 || ctIdx === -1) {
    throw new Error('Missing required columns: Sample, Gene, Ct');
  }

  const records: CtRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim());
    const sample = cols[sampleIdx];
    const gene = cols[geneIdx];
    const raw = cols[ctIdx];
    if (!sample || !gene) continue;

    const ct = parseCtValue(raw);
    records.push({ sample, gene, ct });
  }
  return records;
}

function parseCtValue(raw: string): number | null {
  if (!raw || raw.toLowerCase() === 'undetermined' || raw.toLowerCase() === 'nan') {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
