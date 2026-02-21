import { useState } from 'react';
import type { DeltaDeltaCtResult, ReplicateGroup } from '@qpcrcalc/engine';

interface ResultsTableProps {
  results: DeltaDeltaCtResult[];
  groups: ReplicateGroup[];
}

export function ResultsTable({ results, groups }: ResultsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const flagClass = (flags: string[]) => {
    if (flags.includes('UNRELIABLE') || flags.includes('UNDETERMINED')) return 'flag-err';
    if (flags.includes('HIGH_CV') || flags.includes('LOW_SIGNAL')) return 'flag-warn';
    return 'flag-ok';
  };

  return (
    <div className="table-panel">
      <h2>Results</h2>
      <table className="results-table">
        <thead>
          <tr>
            <th></th>
            <th>Sample</th>
            <th>Gene</th>
            <th>ΔCt</th>
            <th>ΔΔCt</th>
            <th>Fold Change</th>
            <th>SEM</th>
            <th>QC</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => {
            const key = `${r.sample}|${r.gene}`;
            const grp = groups.find(g => g.sample === r.sample && g.gene === r.gene);
            const isExpanded = expanded.has(key);
            return (
              <>
                <tr key={key}>
                  <td>
                    {grp && grp.n > 0 && (
                      <button className="expand-btn" onClick={() => toggle(key)}>
                        {isExpanded ? '▾' : '▸'}
                      </button>
                    )}
                  </td>
                  <td>{r.sample}</td>
                  <td>{r.gene}</td>
                  <td>{r.deltaCt.toFixed(3)}</td>
                  <td>{r.deltaDeltaCt.toFixed(3)}</td>
                  <td>{r.foldChange.toFixed(3)}</td>
                  <td>{r.sem.toFixed(3)}</td>
                  <td className={flagClass(r.flags)}>
                    {r.flags.length ? r.flags.join(', ') : '✓ OK'}
                  </td>
                </tr>
                {isExpanded &&
                  grp?.cts.map((ct, i) => (
                    <tr key={`${key}-${i}`} className="replicate-row">
                      <td></td>
                      <td></td>
                      <td>Rep {i + 1}</td>
                      <td colSpan={5}>Ct = {ct.toFixed(2)}</td>
                    </tr>
                  ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
