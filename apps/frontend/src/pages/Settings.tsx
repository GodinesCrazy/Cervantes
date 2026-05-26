import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Settings() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);

  async function refresh() {
    setStatus(await api.settingsStatus());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main className="page standalone narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>IA y entorno</h1>
        </div>
      </header>
      <section className="panel">
        <p className="muted">Configura las claves en el archivo .env. Sin claves, Cervantes funciona en modo plantilla.</p>
        <pre className="data">
          OPENAI_API_KEY=&#10;GEMINI_API_KEY=&#10;GROQ_API_KEY=&#10;AI_PROVIDER=auto&#10;OPENAI_MODEL=gpt-4o&#10;GEMINI_MODEL=gemini-2.5-flash&#10;GROQ_MODEL=llama-3.3-70b-versatile
        </pre>
        <button className="button" onClick={async () => { await api.backupWorkspace(); await refresh(); }}>
          Crear backup workspace
        </button>
      </section>
      <section className="panel">
        <h2>Status local</h2>
        <pre className="data">{JSON.stringify(status, null, 2)}</pre>
      </section>
    </main>
  );
}
