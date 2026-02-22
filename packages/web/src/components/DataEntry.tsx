import { useCallback } from 'react';

interface DataEntryProps {
  value: string;
  onChange: (v: string) => void;
}

export function DataEntry({ value, onChange }: DataEntryProps) {
  const handleExportInputCsv = useCallback(() => {
    const blob = new Blob([value], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpcrcalc_input.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className="data-entry">
      <div className="panel-header">
        <span className="hint">Paste CSV/TSV with columns: Sample, Gene, Ct</span>
        <button className="inline-btn" data-testid="input-csv-btn" onClick={handleExportInputCsv}>📥 CSV</button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste Ct data: Sample, Gene, Ct (CSV or tab-separated)"
        spellCheck={false}
      />
    </div>
  );
}
