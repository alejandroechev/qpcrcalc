import { useRef } from 'react';
import { sampleDatasets } from '../samples/index.ts';

interface ToolbarProps {
  dark: boolean;
  onToggleDark: () => void;
  genes: string[];
  refGenes: string[];
  onToggleRef: (gene: string) => void;
  samples: string[];
  controlGroup: string;
  onSetControl: (s: string) => void;
  onLoadSample: (csv: string, refGenes: string[], controlGroup: string) => void;
  onUploadFile: (text: string) => void;
}

export function Toolbar({
  dark,
  onToggleDark,
  genes,
  refGenes,
  onToggleRef,
  samples,
  controlGroup,
  onSetControl,
  onLoadSample,
  onUploadFile,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(t => onUploadFile(t));
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      {/* Row 1: title + Samples + Upload + spacer + Guide + Feedback + Theme */}
      <div className="toolbar-row">
        <h1>qPCRCalc</h1>
        <button data-testid="upload-btn" onClick={() => fileRef.current?.click()}>📂 Upload</button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} hidden />
        <select
          data-testid="samples-select"
          value=""
          onChange={e => {
            const ds = sampleDatasets[Number(e.target.value)];
            if (ds) onLoadSample(ds.csv, ds.refGenes, ds.controlGroup);
          }}
        >
          <option value="" disabled>Load sample…</option>
          {sampleDatasets.map((ds, i) => (
            <option key={ds.name} value={i}>{ds.name}</option>
          ))}
        </select>
        <div className="toolbar-spacer" />
        <button onClick={() => window.open('/intro.html', '_blank')}>📖 Guide</button>
        <button onClick={() => window.open('https://github.com/alejandroechev/qpcrcalc/issues/new', '_blank')} title="Feedback">💬 Feedback</button>
        <button onClick={onToggleDark}>{dark ? '☀️' : '🌙'}</button>
      </div>
      {/* Row 2: Ref gene checkboxes + Control group selector */}
      <div className="toolbar-row" data-testid="toolbar-row-2">
        <div className="ref-genes">
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ref:</span>
          {genes.map(g => (
            <label key={g}>
              <input
                type="checkbox"
                checked={refGenes.includes(g)}
                onChange={() => onToggleRef(g)}
              />
              {g}
            </label>
          ))}
        </div>
        <label>
          Control:
          <select value={controlGroup} onChange={e => onSetControl(e.target.value)}>
            {samples.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
