import { useState, useMemo, useCallback } from 'react';
import {
  analyze,
  parseCt,
  groupReplicates,
  exportCsv,
  type AnalysisResult,
} from '@qpcrcalc/engine';
import { Toolbar } from './components/Toolbar.tsx';
import { DataEntry } from './components/DataEntry.tsx';
import { FoldChangeChart } from './components/FoldChangeChart.tsx';
import { ResultsTable } from './components/ResultsTable.tsx';

const DEMO_CSV = `Sample,Gene,Ct
Control,GAPDH,20.1
Control,GAPDH,20.3
Control,GAPDH,20.2
Control,BRCA1,25.5
Control,BRCA1,25.7
Control,BRCA1,25.6
Control,TP53,28.1
Control,TP53,28.3
Control,TP53,28.0
Treated,GAPDH,20.0
Treated,GAPDH,20.2
Treated,GAPDH,20.1
Treated,BRCA1,22.1
Treated,BRCA1,22.3
Treated,BRCA1,22.2
Treated,TP53,26.5
Treated,TP53,26.7
Treated,TP53,26.6`;

export function App() {
  const [rawText, setRawText] = useState(DEMO_CSV);
  const [refGenes, setRefGenes] = useState<string[]>(['GAPDH']);
  const [controlGroup, setControlGroup] = useState('Control');
  const [dark, setDark] = useState(false);

  // Derive available genes and samples from parsed data
  const { genes, samples } = useMemo(() => {
    try {
      const records = parseCt(rawText);
      const groups = groupReplicates(records);
      return {
        genes: [...new Set(groups.map(g => g.gene))],
        samples: [...new Set(groups.map(g => g.sample))],
      };
    } catch {
      return { genes: [] as string[], samples: [] as string[] };
    }
  }, [rawText]);

  const result: AnalysisResult | null = useMemo(() => {
    if (!refGenes.length || !controlGroup) return null;
    try {
      return analyze(rawText, refGenes, [controlGroup]);
    } catch {
      return null;
    }
  }, [rawText, refGenes, controlGroup]);

  const handleExportCsv = useCallback(() => {
    if (!result) return;
    const csv = exportCsv(result.results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpcrcalc_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleExportPng = useCallback(() => {
    const el = document.querySelector('.chart-panel .recharts-wrapper') as HTMLElement | null;
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

  const toggleRef = (gene: string) => {
    setRefGenes(prev =>
      prev.includes(gene) ? prev.filter(g => g !== gene) : [...prev, gene],
    );
  };

  const handleLoadSample = useCallback((csv: string, refs: string[], control: string) => {
    setRawText(csv);
    setRefGenes(refs);
    setControlGroup(control);
  }, []);

  return (
    <div className="app" data-theme={dark ? 'dark' : 'light'}>
      <Toolbar
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        genes={genes}
        refGenes={refGenes}
        onToggleRef={toggleRef}
        samples={samples}
        controlGroup={controlGroup}
        onSetControl={setControlGroup}
        onExportCsv={handleExportCsv}
        onExportPng={handleExportPng}
        onLoadSample={handleLoadSample}
      />
      <DataEntry value={rawText} onChange={setRawText} />
      {result && (
        <div className="results">
          <FoldChangeChart results={result.results} />
          <ResultsTable results={result.results} groups={result.groups} />
        </div>
      )}
    </div>
  );
}
