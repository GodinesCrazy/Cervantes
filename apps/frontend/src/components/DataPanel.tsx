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

function DataRenderer({ data }: { data: unknown }) {
  if (!data) return <p className="muted">Pendiente de generación.</p>;

  if (typeof data === 'string') {
    const parsed = parseJsonLikeString(data);
    if (parsed) return <DataRenderer data={parsed} />;
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

  if (Array.isArray(data)) {
    return (
      <div className="dataGrid">
        {data.map((item, index) => (
          <div key={index} className="dataField" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <DataRenderer data={item} />
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
            <DataRenderer data={value} />
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
