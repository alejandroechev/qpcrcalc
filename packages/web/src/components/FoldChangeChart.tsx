import { useRef, useCallback } from 'react';
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
  const chartRef = useRef<HTMLDivElement>(null);
  const genes = [...new Set(results.map(r => r.gene))];
  const samples = [...new Set(results.map(r => r.sample))];
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--warn)', '#ec4899'];

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

  const getSvgElement = useCallback(() => {
    return chartRef.current?.querySelector('.recharts-wrapper svg') as SVGSVGElement | null;
  }, []);

  const handleExportPng = useCallback(() => {
    const el = chartRef.current?.querySelector('.recharts-wrapper') as HTMLElement | null;
    if (!el) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(el).then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'qpcrcalc_chart.png';
        a.click();
      });
    });
  }, []);

  const handleExportSvg = useCallback(() => {
    const svg = getSvgElement();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpcrcalc_chart.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [getSvgElement]);

  return (
    <div className="chart-panel" ref={chartRef}>
      <div className="panel-header">
        <h2>Fold Change (2⁻ᐩᐩᶜᵗ)</h2>
        <button className="inline-btn" data-testid="chart-png-btn" onClick={handleExportPng}>📸 PNG</button>
        <button className="inline-btn" data-testid="chart-svg-btn" onClick={handleExportSvg}>🖼️ SVG</button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="gene" tick={{ fill: 'var(--fg)' }} />
          <YAxis label={{ value: 'Fold Change', angle: -90, position: 'insideLeft', fill: 'var(--fg)' }} tick={{ fill: 'var(--fg)' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-fg)' }} />
          <Legend />
          <ReferenceLine y={1} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: 'No change', fill: 'var(--fg)' }} />
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
