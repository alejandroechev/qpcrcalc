import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DeltaDeltaCtResult } from '@qpcrcalc/engine';

interface FoldChangeChartProps {
  results: DeltaDeltaCtResult[];
}

export function FoldChangeChart({ results }: FoldChangeChartProps) {
  const genes = [...new Set(results.map(r => r.gene))];
  const samples = [...new Set(results.map(r => r.sample))];
  const colors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b', '#ec4899'];

  // Build data: one entry per gene, with fold change per sample
  const data = genes.map(gene => {
    const entry: Record<string, unknown> = { gene };
    for (const sample of samples) {
      const r = results.find(x => x.gene === gene && x.sample === sample);
      if (r) {
        entry[sample] = Number(r.foldChange.toFixed(3));
        entry[`${sample}_err`] = [
          Number((r.foldChange - r.foldChangeLo).toFixed(3)),
          Number((r.foldChangeHi - r.foldChange).toFixed(3)),
        ];
      }
    }
    return entry;
  });

  return (
    <div className="chart-panel">
      <h2>Fold Change (2⁻ᐩᐩᶜᵗ)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="gene" />
          <YAxis label={{ value: 'Fold Change', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={1} stroke="#888" strokeDasharray="4 4" label="No change" />
          {samples.map((sample, i) => (
            <Bar key={sample} dataKey={sample} fill={colors[i % colors.length]} barSize={40}>
              <ErrorBar dataKey={`${sample}_err`} width={6} strokeWidth={1.5} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
