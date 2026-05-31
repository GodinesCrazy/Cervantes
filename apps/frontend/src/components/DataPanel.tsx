type Props = {
  title: string;
  data: unknown;
};

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function parseJsonLikeString(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function DataRenderer({ data, parentKey = '' }: { data: unknown, parentKey?: string }) {
  if (!data) return <p className="muted">Pendiente de generación.</p>;

  if (typeof data === 'string') {
    if (parentKey.toLowerCase().includes('status')) {
      if (data === 'APPROVED' || data === 'GO') {
        return <span className="dataValue status-approved">{data}</span>;
      } else if (data === 'NEEDS_REVISION' || data === 'NO-GO' || data === 'PENDING') {
        return <span className="dataValue status-needs-revision">{data}</span>;
      }
    }
    const parsed = parseJsonLikeString(data);
    if (parsed) return <DataRenderer data={parsed} parentKey={parentKey} />;
    if (/^#[0-9a-f]{3,8}$/i.test(data.trim())) {
      return (
        <span className="dataValue swatchValue">
          <span className="colorSwatch" style={{ background: data.trim() }} />
          {data}
        </span>
      );
    }
    return <span className="dataValue">{data}</span>;
  }

  if (typeof data === 'number') {
    const isScore = parentKey.toLowerCase().includes('score') || parentKey.toLowerCase().includes('oportunidad');
    
    if (isScore || (data > 0 && data <= 1 && data.toString().includes('.'))) {
      let displayValue = `${data}`;
      let normalizedScore = data;

      // Normalize score to 0-100 range for coloring
      if (data <= 1) {
        normalizedScore = data * 100;
        displayValue = `${Math.round(data * 100)}%`;
      } else if (data <= 10) {
        normalizedScore = data * 10;
        displayValue = `${data} / 10`;
      } else {
        displayValue = `${data} / 100`;
      }

      let colorClass = 'score-low';
      if (normalizedScore >= 80) colorClass = 'score-high';
      else if (normalizedScore >= 60) colorClass = 'score-medium';
      
      return (
         <span className={`dataValue ${colorClass}`} style={{ fontWeight: 600, color: colorClass === 'score-high' ? '#10b981' : colorClass === 'score-medium' ? '#f59e0b' : '#ef4444' }}>
           {displayValue}
         </span>
      );
    }
    return <span className="dataValue">{data}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="dataGrid">
        {data.map((item, index) => (
          <div key={index} className="dataField" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <DataRenderer data={item} parentKey={parentKey} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const hiddenFields = ['id', 'projectId', 'createdAt', 'updatedAt'];
    const entries = Object.entries(data).filter(([key, value]) => !hiddenFields.includes(key) && value !== null && value !== '');

    return (
      <div className="dataGrid">
        {entries.map(([key, value]) => (
          <div key={key} className="dataField">
            <span className="dataLabel">{formatKey(key)}</span>
            <DataRenderer data={value} parentKey={key} />
          </div>
        ))}
      </div>
    );
  }

  return <span className="dataValue">{String(data)}</span>;
}

export function DataPanel({ title, data }: Props) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {data ? <DataRenderer data={data} /> : <p className="muted">Pendiente de generación.</p>}
    </section>
  );
}
