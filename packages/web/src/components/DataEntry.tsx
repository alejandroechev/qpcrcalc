interface DataEntryProps {
  value: string;
  onChange: (v: string) => void;
}

export function DataEntry({ value, onChange }: DataEntryProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(t => onChange(t));
  };

  return (
    <div className="data-entry">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste Ct data: Sample, Gene, Ct (CSV or tab-separated)"
        spellCheck={false}
      />
      <div className="hint">
        Paste CSV/TSV with columns: Sample, Gene, Ct — or{' '}
        <label style={{ color: 'var(--accent)', cursor: 'pointer' }}>
          upload a file
          <input type="file" accept=".csv,.tsv,.txt" onChange={handleFile} hidden />
        </label>
      </div>
    </div>
  );
}
