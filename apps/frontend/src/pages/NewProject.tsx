import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api } from '../api/client';

export function NewProject() {
  const navigate = useNavigate();
  const [rawIdea, setRawIdea] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAutofill() {
    setBusy(true);
    try {
      const { idea } = await api.autofillRandomIdea();
      setRawIdea(idea);
    } catch (e) {
      alert('Error autocompletando: ' + e);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!rawIdea.trim()) return;
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
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          Idea base
          <button type="button" className="button magic" onClick={handleAutofill} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', fontSize: '14px' }}>
            <Sparkles size={16} />
            Lluvia de ideas (Autofill)
          </button>
        </label>
        <textarea
            rows={8}
            value={rawIdea}
            onChange={(event) => setRawIdea(event.target.value)}
            placeholder="Ejemplo: Un ebook premium sobre el cuidado integral de perros para dueños primerizos, con ejercicios, checklist y enfoque visual."
          />
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
