import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  analyze,
  parseCt,
  groupReplicates,
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

const STORAGE_KEY = 'qpcrcalc-state';

function loadSavedState(): { rawText: string; refGenes: string[]; controlGroup: string } | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch { return null; }
}

function loadTheme(): boolean {
  try {
    return localStorage.getItem('qpcrcalc-theme') === 'dark';
  } catch {
    return false;
  }
}

export function App() {
  const savedState = loadSavedState();
  const [rawText, setRawText] = useState(savedState?.rawText ?? DEMO_CSV);
  const [refGenes, setRefGenes] = useState<string[]>(savedState?.refGenes ?? ['GAPDH']);
  const [controlGroup, setControlGroup] = useState(savedState?.controlGroup ?? 'Control');
  const [dark, setDark] = useState(loadTheme);

  const toggleDark = useCallback(() => {
    setDark(d => {
      const next = !d;
      try { localStorage.setItem('qpcrcalc-theme', next ? 'dark' : 'light'); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Debounced persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rawText, refGenes, controlGroup })); } catch { /* noop */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [rawText, refGenes, controlGroup]);

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
        onToggleDark={toggleDark}
        genes={genes}
        refGenes={refGenes}
        onToggleRef={toggleRef}
        samples={samples}
        controlGroup={controlGroup}
        onSetControl={setControlGroup}
        onLoadSample={handleLoadSample}
        onUploadFile={setRawText}
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
