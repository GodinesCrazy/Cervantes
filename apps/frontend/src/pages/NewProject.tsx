import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function NewProject() {
  const navigate = useNavigate();
  const [rawIdea, setRawIdea] = useState('Un ebook premium sobre runas para principiantes con enfoque práctico y visual.');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const project = await api.createProject({ name: 'Proyecto en análisis', rawIdea, topic: rawIdea, audience: 'Por definir', tone: 'Premium práctico' });
    navigate(`/projects/${project.id}/idea`);
  }

  return (
    <main className="page standalone narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">Nuevo proyecto</p>
          <h1>Idea editorial</h1>
        </div>
      </header>
      <form className="form" onSubmit={submit}>
        <label>
          Idea base
          <textarea rows={8} value={rawIdea} onChange={(event) => setRawIdea(event.target.value)} />
        </label>
        <p className="muted">
          El nombre comercial se recomendará después de la investigación de mercado, con alternativas y justificación.
        </p>
        <button className="button primary" disabled={busy}>
          {busy ? 'Creando...' : 'Crear análisis'}
        </button>
      </form>
    </main>
  );
}
