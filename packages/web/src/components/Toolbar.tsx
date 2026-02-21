interface ToolbarProps {
  dark: boolean;
  onToggleDark: () => void;
  genes: string[];
  refGenes: string[];
  onToggleRef: (gene: string) => void;
  samples: string[];
  controlGroup: string;
  onSetControl: (s: string) => void;
  onExportCsv: () => void;
  onExportPng: () => void;
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
  onExportCsv,
  onExportPng,
}: ToolbarProps) {
  return (
    <div className="toolbar" data-theme={dark ? 'dark' : 'light'}>
      <h1>qPCRCalc</h1>

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

      <button onClick={onExportCsv}>📥 CSV</button>
      <button onClick={onExportPng}>📸 PNG</button>
      <button onClick={onToggleDark}>{dark ? '☀️' : '🌙'}</button>
    </div>
  );
}
