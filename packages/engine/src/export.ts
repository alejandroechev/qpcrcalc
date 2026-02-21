import type { DeltaDeltaCtResult } from './types.js';

/** Export results to CSV string */
export function exportCsv(results: DeltaDeltaCtResult[]): string {
  const header = 'Sample,Gene,ΔCt,ΔΔCt,Fold Change,Fold Change Lo,Fold Change Hi,SEM,Flags';
  const rows = results.map(r =>
    [
      r.sample,
      r.gene,
      r.deltaCt.toFixed(4),
      r.deltaDeltaCt.toFixed(4),
      r.foldChange.toFixed(4),
      r.foldChangeLo.toFixed(4),
      r.foldChangeHi.toFixed(4),
      r.sem.toFixed(4),
      r.flags.join(';') || 'OK',
    ].join(','),
  );
  return [header, ...rows].join('\n');
}
