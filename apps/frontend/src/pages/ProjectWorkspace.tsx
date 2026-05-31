import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { Link, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { DataPanel } from '../components/DataPanel';
import { Progress, phases } from '../components/Progress';
import type { ManuscriptBlock, Project, VisualAsset } from '../types/domain';

declare global {
  interface Window {
    puter?: {
      ai?: {
        txt2img?: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
      };
    };
  }
}

type Context = {
  project: Project;
  refresh: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
};

export function useProjectContext() {
  return useOutletContext<Context>();
}

export function ProjectShell({ projects, refresh }: { projects: Project[]; refresh: () => Promise<void> }) {
  const { id } = useParams();
  const [loadedProject, setLoadedProject] = useState<Project | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const summaryProject = projects.find((item) => item.id === Number(id));
  const project = loadedProject || summaryProject;
  const projectId = Number(id);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function refreshProject() {
    await refresh();
    if (Number.isFinite(projectId)) {
      const [freshProject, freshSnapshot] = await Promise.all([
        api.project(projectId),
        api.projectSnapshot(projectId)
      ]);
      setLoadedProject(freshProject);
      setSnapshot(freshSnapshot);
    }
  }

  useEffect(() => {
    let active = true;
    if (Number.isFinite(projectId)) {
      Promise.all([
        api.project(projectId),
        api.projectSnapshot(projectId)
      ])
        .then(([freshProject, freshSnapshot]) => {
          if (active) {
            setLoadedProject(freshProject);
            setSnapshot(freshSnapshot);
          }
        })
        .catch(() => {
          if (active) setLoadedProject(null);
        });
    }
    return () => {
      active = false;
    };
  }, [projectId]);

  if (!project) {
    return (
      <main className="page standalone">
        <p className="muted">Proyecto no encontrado o cargando...</p>
      </main>
    );
  }

  return (
    <div className="workspace">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      <Progress projectId={project.id} currentPhase={project.currentPhase} phaseGates={project.phaseGates} />
      <main className="workPage">
        <Outlet context={{ project, snapshot, refresh: refreshProject, showToast }} />
      </main>
    </div>
  );
}

export function ProjectOverview() {
  const { project } = useProjectContext();
  const approvedGates = project.phaseGates?.filter((gate) => gate.status === 'APPROVED').length || 0;
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Proyecto</p>
          <h1>{project.name}</h1>
        </div>
        <Link className="button" to={`/projects/${project.id}/idea`}>
          Continuar
        </Link>
      </header>
      <section className="metricGrid">
        <div className="metric">
          <span>{project.goNoGoScore || '-'}</span>
          <p>Score</p>
        </div>
        <div className="metric">
          <span>{project.chapterPlans?.length || 0}</span>
          <p>Capítulos</p>
        </div>
        <div className="metric">
          <span>{project.manuscriptBlocks?.length || 0}</span>
          <p>Bloques</p>
        </div>
        <div className="metric">
          <span>{approvedGates}/{project.phaseGates?.length || 0}</span>
          <p>Gates</p>
        </div>
      </section>
      <DataPanel title="Estado completo" data={project} />
    </>
  );
}

export function IdeaPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [rawIdea, setRawIdea] = useState(project.idea?.rawIdea || '');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRawIdea(project.idea?.rawIdea || '');
  }, [project.idea?.rawIdea]);

  async function handleAutofillIdea() {
    setBusy(true);
    try {
      const { idea } = await api.autofillRandomIdea();
      setRawIdea(idea);
    } catch (e) {
      showToast('Error autocompletando: ' + e, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleAutofillQuestions() {
    setBusy(true);
    try {
      const response = await api.autofillQuestions(project.id) as { answers: Record<string, string> };
      setAnswers((current) => ({ ...current, ...response.answers }));
      showToast('Preguntas autocompletadas', 'success');
    } catch (e) {
      showToast('Error autocompletando preguntas: ' + e, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.saveIdea(project.id, { rawIdea, topic: rawIdea });
      await refresh();
      showToast('Idea actualizada', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveAnswers() {
    setBusy(true);
    try {
      await api.saveClarifications(
        project.id,
        Object.entries(answers).map(([id, answer]) => ({ id: Number(id), answer })),
      );
      await refresh();
      showToast('¡Respuestas guardadas!', 'success');
      navigate(`/projects/${project.id}/research`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title="Idea Intake" project={project} />
      <form className="form" onSubmit={save}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          Idea base
          <button type="button" className="button magic" onClick={handleAutofillIdea} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', fontSize: '14px' }}>
            <Sparkles size={16} />
            Lluvia de ideas (Autofill)
          </button>
        </label>
        <textarea rows={7} value={rawIdea} onChange={(event) => setRawIdea(event.target.value)} />
        <button className="button primary" disabled={busy}>
          {busy && <span className="spinner" />}
          Generar preguntas
        </button>
      </form>
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Preguntas inteligentes</h2>
          {(project.clarifications || []).length > 0 && (
            <button type="button" className="button magic" onClick={handleAutofillQuestions} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', fontSize: '14px' }}>
              <Sparkles size={16} />
              Responder con IA (Autofill)
            </button>
          )}
        </div>
        {(project.clarifications || []).length === 0 && (
          <p className="muted">Haz clic en Generar preguntas para crear el cuestionario editorial inicial.</p>
        )}
        {(project.clarifications || []).map((question) => (
          <label key={question.id}>
            {question.question}
            <input
              value={answers[question.id] !== undefined ? answers[question.id] : (question.answer || '')}
              onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
            />
          </label>
        ))}
        {(project.clarifications || []).length > 0 && (
          <button className="button" onClick={saveAnswers} disabled={busy}>
            {busy && <span className="spinner" />}
            Guardar respuestas y continuar
          </button>
        )}
      </section>
    </>
  );
}

const phaseConfig: Record<string, { title: string; endpoint: string; panel: keyof Project; cta: string }> = {
  research: { title: 'Investigación de mercado', endpoint: 'market-research', panel: 'marketResearch', cta: 'Generar investigación' },
  languages: { title: 'Oportunidad por idioma', endpoint: 'language-opportunity', panel: 'languageOpportunity', cta: 'Analizar idiomas' },
  formula: { title: 'Fórmula editorial', endpoint: 'editorial-formula', panel: 'editorialFormula', cta: 'Recomendar fórmula' },
  'editorial-bible': { title: 'Biblia editorial', endpoint: 'editorial-bible', panel: 'editorialBible', cta: 'Generar biblia' },
  'visual-bible': { title: 'Biblia visual', endpoint: 'visual-bible', panel: 'visualBible', cta: 'Generar biblia visual' },
  audit: { title: 'Auditoría editorial', endpoint: 'audit', panel: 'auditReports', cta: 'Ejecutar auditoría' },
  recovery: { title: 'Recuperación y ensamblaje', endpoint: 'recovery', panel: 'recoveryReports', cta: 'Ensamblar manuscrito' },
  metadata: { title: 'Metadata comercial', endpoint: 'metadata', panel: 'metadataPackage', cta: 'Generar metadata' },
  publishing: { title: 'Checklist publicación', endpoint: 'publishing-checklist', panel: 'publishingChecklist', cta: 'Generar checklist' },
};

export function PhasePage({ phaseKey }: { phaseKey: string }) {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const config = phaseConfig[phaseKey];
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await api.runPhase(project.id, config.endpoint);
      await refresh();
      showToast(`${config.title} generada`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al procesar', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function autofix() {
    setBusy(true);
    try {
      await api.autofixAudit(project.id);
      await refresh();
      showToast('Autocorrección completada', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al corregir', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    try {
      await api.setGate(project.id, phaseKey, { status: 'APPROVED', notes: 'Aprobado por Ivan en flujo local privado.' });
      await refresh();
      showToast('Fase aprobada', 'success');
      
      const phaseOrder = ['idea', 'research', 'languages', 'go-nogo', 'formula', 'editorial-bible', 'visual-bible', 'chapter-plan', 'blocks', 'audit', 'recovery', 'visual-design', 'metadata', 'publishing', 'export'];
      const currentIdx = phaseOrder.indexOf(phaseKey);
      if (currentIdx !== -1 && currentIdx < phaseOrder.length - 1) {
        navigate(`/projects/${project.id}/${phaseOrder[currentIdx + 1]}`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al aprobar', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function verifyResearch() {
    setBusy(true);
    await api.sourceNote(project.id, {
      sourceType: 'market',
      title: 'Verificacion manual asistida',
      notes: 'Datos de mercado revisados por Ivan para avanzar a produccion local.',
      verified: true,
    });
    await api.runPhase(project.id, config.endpoint, { userVerified: true });
    await api.setGate(project.id, phaseKey, { status: 'APPROVED', notes: 'Investigacion asistida verificada.' });
    await refresh();
    setBusy(false);
  }
  const currentGate = (project.phaseGates || []).find((g) => g.phase === phaseKey);
  const isApproved = currentGate?.approvalStatus === 'APPROVED';
  const isNeedsRevision = currentGate?.approvalStatus === 'NEEDS_REVISION';

  return (
    <>
      <Header title={config.title} project={project} />
      {phaseKey === 'research' && (
        <p className="muted">Esta fase propone el nombre comercial después de evaluar audiencia, promesa y posicionamiento.</p>
      )}
      <div className="actions" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className={`button ${!isApproved && !isNeedsRevision ? 'primary' : ''}`} onClick={run} disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? 'Procesando...' : config.cta}
        </button>
        {phaseKey === 'research' && (
          <button className="button" onClick={verifyResearch} disabled={busy}>
            Marcar research verificado
          </button>
        )}
        <button className={`button ${isApproved ? 'primary pulse-animation' : ''}`} onClick={approve} disabled={busy}>
          {isApproved ? 'Avanzar a la siguiente fase' : 'Aprobar gate manualmente'}
        </button>
        {phaseKey === 'audit' && isNeedsRevision && (
          <button type="button" className="button magic" onClick={autofix} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', marginLeft: '12px' }}>
            <Sparkles size={16} />
            Autocorrección IA
          </button>
        )}
      </div>

      {project[config.panel] && !isApproved && (
        <div className="nextStepBanner" style={{ borderColor: isNeedsRevision ? '#eab308' : undefined }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div>
            {isNeedsRevision 
              ? <span>El control de calidad encontró problemas. Usa la <strong>Autocorrección IA</strong> o aprueba manualmente para forzar el avance.</span>
              : <span>Generación exitosa. Revisa los resultados y haz clic en <strong>"Aprobar gate"</strong> arriba para avanzar.</span>
            }
          </div>
        </div>
      )}
      {project[config.panel] && isApproved && (
        <div className="nextStepBanner" style={{ borderColor: '#22c55e', background: 'rgba(34, 197, 94, 0.05)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>¡Validación superada!</span> Todo está en condiciones. Haz clic en <strong>"Aprobar y Continuar"</strong>.
          </div>
        </div>
      )}

      {phaseKey === 'recovery' ? (
        <RecoveryResult
          project={project}
          busy={busy}
          onRun={run}
          onApprove={approve}
        />
      ) : phaseKey === 'research' ? (
        <ResearchResult data={project.marketResearch as Record<string, unknown> | null | undefined} />
      ) : phaseKey === 'editorial-bible' ? (
        <EditorialBibleResult data={project.editorialBible as Record<string, unknown> | null | undefined} />
      ) : phaseKey === 'visual-bible' ? (
        <VisualBibleResult data={project.visualBible as Record<string, unknown> | null | undefined} />
      ) : (
        <DataPanel title="Resultado" data={project[config.panel]} />
      )}
    </>
  );
}

function FormattedRules({ data }: { data: unknown }) {
  const obj = typeof data === 'string' ? parseJsonSafe(data) : data;
  if (!obj || typeof obj !== 'object') return <span>{String(data || '-')}</span>;
  return (
    <ul style={{ paddingLeft: '20px', margin: 0, color: '#a1a1aa', lineHeight: 1.5 }}>
      {Object.entries(obj).map(([k, v]) => (
        <li key={k} style={{ marginBottom: '6px' }}>
          <strong style={{ color: '#d1d5db' }}>{k}:</strong> {Array.isArray(v) ? v.join(' • ') : String(v)}
        </li>
      ))}
    </ul>
  );
}

function FormattedStructure({ data }: { data: unknown }) {
  const obj = typeof data === 'string' ? parseJsonSafe(data) : data;
  
  if (Array.isArray(obj)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {obj.map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #a78bfa' }}>
            <strong style={{ color: '#e5e7eb', display: 'block', marginBottom: '4px' }}>{item.part || `Sección ${i+1}`}</strong>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: 1.5 }}>{item.description || JSON.stringify(item)}</p>
          </div>
        ))}
      </div>
    );
  }

  return <div>{String(data || '-').split('\n').map((line, i) => <p key={i} style={{ margin: '0 0 12px 0', color: '#a1a1aa' }}>{line}</p>)}</div>;
}

function EditorialBibleResult({ data }: { data?: Record<string, unknown> | null }) {
  if (!data) return <DataPanel title="Resultado" data={data} />;
  return (
    <section className="bibleResult" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="panel" style={{ background: 'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(17, 19, 21, 0.5))', borderLeft: '4px solid #8b5cf6' }}>
        <span className="eyebrow" style={{ color: '#8b5cf6' }}>Biblia Editorial Oficial</span>
        <h2 style={{ fontSize: '32px', margin: '8px 0', color: 'white' }}>{String(data.title || 'Sin Título')}</h2>
        <h3 style={{ fontSize: '20px', fontWeight: 400, color: '#e5e7eb', margin: '0 0 16px 0' }}>{String(data.subtitle || '')}</h3>
        <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#a1a1aa', margin: 0, maxWidth: '800px' }}><strong>Promesa central:</strong> {String(data.centralPromise || '')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#a78bfa', fontSize: '18px' }}>Audiencia y Estilo</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Audiencia objetivo:</strong> <span style={{ color: '#a1a1aa', lineHeight: 1.5 }}>{String(data.audience || '-')}</span></li>
            <li><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Tono narrativo:</strong> <span style={{ color: '#a1a1aa', lineHeight: 1.5 }}>{String(data.tone || '-')}</span></li>
            <li><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Estilo de redacción:</strong> <span style={{ color: '#a1a1aa', lineHeight: 1.5 }}>{String(data.style || '-')}</span></li>
          </ul>
        </div>
        
        <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#a78bfa', fontSize: '18px' }}>Reglas de Cumplimiento Editorial</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '16px' }}><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Reglas de Contenido:</strong> <FormattedRules data={data.contentRules} /></li>
            <li style={{ borderLeft: '3px solid #10b981', paddingLeft: '16px' }}><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Promesas y Reclamos:</strong> <FormattedRules data={data.claimsRules} /></li>
            <li style={{ borderLeft: '3px solid #ef4444', paddingLeft: '16px' }}><strong style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>Límites Éticos:</strong> <FormattedRules data={data.ethicsRules} /></li>
          </ul>
        </div>
      </div>

      <div className="panel">
        <h4 style={{ margin: '0 0 20px 0', color: '#a78bfa', fontSize: '20px' }}>Estructura y Extensión</h4>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px', color: '#a1a1aa', lineHeight: 1.6 }}>
            <strong style={{ color: 'white', display: 'block', marginBottom: '12px' }}>Estructura General:</strong>
            <FormattedStructure data={data.structure} />
          </div>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '24px', borderRadius: '12px', minWidth: '280px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <strong style={{ color: '#a78bfa', display: 'block', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Extensión Estimada</strong>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'white' }}>{String(data.estimatedLength || '-').split(',')[0]}</p>
            {String(data.estimatedLength || '').includes(',') && (
              <p style={{ margin: '8px 0 0 0', color: '#a1a1aa' }}>{String(data.estimatedLength || '').split(',').slice(1).join(',')}</p>
            )}
          </div>
        </div>
      </div>

      <DataPanel title="Índice Maestro Propuesto" data={data.tableOfContents} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <DataPanel title="Plantilla Base de Capítulo" data={data.chapterTemplate} />
        <DataPanel title="Plantilla Base de Ejercicio" data={data.exerciseTemplate} />
      </div>

      <DataPanel title="Criterios de Calidad (Checklist final)" data={{ qualityCriteria: data.qualityCriteria, approvalChecklist: data.approvalChecklist }} />
    </section>
  );
}

function parseJsonSafe(val: unknown) {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
}

function VisualBibleResult({ data: rawData }: { data?: Record<string, unknown> | string | null }) {
  const data = (typeof rawData === 'string' ? parseJsonSafe(rawData) : rawData) as Record<string, unknown> | null;
  if (!data) return <DataPanel title="Resultado" data={rawData} />;
  
  const colorsRaw = parseJsonSafe(data.colorPalette);
  let colors: Array<{name: string; hex: string}> = [];
  if (Array.isArray(colorsRaw)) {
    colors = colorsRaw.map(c => typeof c === 'object' && c !== null ? (c as {name: string; hex: string}) : { name: '', hex: String(c) });
  } else if (colorsRaw && typeof colorsRaw === 'object') {
    colors = Object.entries(colorsRaw).map(([k, v]) => ({ name: k, hex: String(v) }));
  } else if (typeof data.colorPalette === 'string') {
    colors = data.colorPalette.split(',').map(c => ({ name: '', hex: c.replace(/[^#a-zA-Z0-9]/g, '').trim() })).filter(c => c.hex.startsWith('#') || c.hex.match(/^[a-zA-Z]+$/));
  }
  
  const promptsRaw = parseJsonSafe(data.imagePrompts);
  const imagePrompts: string[] = Array.isArray(promptsRaw) 
    ? promptsRaw.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p))
    : typeof data.imagePrompts === 'string' ? [data.imagePrompts] : [];
  
  const typography = parseJsonSafe(data.typography) as Record<string, unknown> | null;
  const iconographyRaw = parseJsonSafe(data.iconographyStyle) as Record<string, unknown> | null;
  const iconColor = iconographyRaw?.color || iconographyRaw?.iconColor || '';
  const iconSet = iconographyRaw?.iconSet || '';

  // Helper to safely stringify any value for display
  const safeStr = (v: unknown): string => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  // Parse sub-objects that DataPanel will receive (they come as JSON strings from backend)
  const parsedCoverStyle = parseJsonSafe(data.coverStyle);
  const parsedBackCoverStyle = parseJsonSafe(data.backCoverStyle);
  const parsedSeparatorStyle = parseJsonSafe(data.separatorStyle);
  const parsedTableStyle = parseJsonSafe(data.tableStyle);
  const parsedCalloutStyle = parseJsonSafe(data.calloutStyle);
  const parsedRequiredAssets = parseJsonSafe(data.requiredAssets);
  const parsedVisualChecklist = parseJsonSafe(data.visualChecklist);
  const parsedExportCriteria = parseJsonSafe(data.exportCriteria);
  
  return (
    <section className="bibleResult" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div className="panel" style={{ background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(17, 19, 21, 0.5))', borderLeft: '4px solid #10b981' }}>
        <span className="eyebrow" style={{ color: '#10b981' }}>Dirección de Arte Oficial</span>
        <h2 style={{ fontSize: '28px', margin: '8px 0', color: 'white' }}>{String(data.visualConcept || 'Concepto Pendiente')}</h2>
        <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#a1a1aa', margin: 0, maxWidth: '800px' }}>{String(data.artDirection || '')}</p>
      </div>

      <div className="panel">
        <h4 style={{ margin: '0 0 16px 0', color: '#10b981', fontSize: '18px' }}>Paleta de Colores Corporativa</h4>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {colors.map((color, idx) => (
            <div key={idx} style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '80px', borderRadius: '8px', background: color.hex || '#333', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#a1a1aa', textAlign: 'center' }}>{color.hex}</span>
              {color.name && <span style={{ fontSize: '12px', color: '#71717a', textAlign: 'center' }}>{color.name}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#10b981', fontSize: '18px' }}>Tipografía (Branding)</h4>
          {typography ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                fontFamily: String(typography.fontFamily || 'sans-serif'),
                fontSize: '42px',
                color: 'white',
                lineHeight: 1.2
              }}>
                Aa
                <div style={{ fontSize: '14px', color: '#a1a1aa', marginTop: '4px', fontFamily: 'Inter' }}>
                  {safeStr(typography.fontFamily)}
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#a1a1aa', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Tamaño:</strong> {typeof typography.fontSize === 'object' ? Object.entries(typography.fontSize as Record<string, unknown>).map(([k,v]) => `${k}: ${v}px`).join(', ') : safeStr(typography.fontSize)}</li>
                <li><strong>Interlineado:</strong> {safeStr(typography.lineHeight)}</li>
              </ul>
            </div>
          ) : (
            <span style={{ color: '#a1a1aa' }}>Pendiente</span>
          )}
        </div>

        <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#10b981', fontSize: '18px' }}>Estilo de Iconografía</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: String(iconColor) || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
              <strong style={{ color: 'white', display: 'block', fontSize: '16px', marginBottom: '4px' }}>{safeStr(iconSet)}</strong>
              Color base: {safeStr(iconColor)}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#10b981', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          Prompts de Generación de Imágenes (IA)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {imagePrompts.map((prompt, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: '2px solid #10b981', color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
              {prompt}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <DataPanel title="Diseño de Portada" data={parsedCoverStyle} />
        <DataPanel title="Diseño de Contraportada" data={parsedBackCoverStyle} />
        <DataPanel title="Estilos de Separadores" data={parsedSeparatorStyle} />
        <DataPanel title="Estilos de Tablas y Callouts" data={{ tables: parsedTableStyle, callouts: parsedCalloutStyle }} />
      </div>

      <DataPanel title="Checklist Visual y Assets" data={{ requiredAssets: parsedRequiredAssets, visualChecklist: parsedVisualChecklist, exportCriteria: parsedExportCriteria }} />

    </section>
  );
}

function ResearchResult({ data }: { data?: Record<string, unknown> | null }) {
  if (!data) return <DataPanel title="Resultado" data={data} />;
  const titles = parseMaybeArray(data.suggestedTitles);
  const keywords = parseMaybeArray(data.keywords);
  const sources = parseMaybeArray(data.sourceNotes);
  return (
    <section className="researchResult">
      <div className="researchHero">
        <div>
          <span className="eyebrow">Nombre recomendado</span>
          <h2>{String(data.recommendedTitle || 'Título pendiente')}</h2>
          <p>{String(data.summary || data.commercialPromise || 'La app recomienda el posicionamiento después de evaluar mercado y promesa.')}</p>
        </div>
        <div className="researchScore">
          <span>Oportunidad</span>
          <strong>{String(data.opportunityScore || '-')} <span style={{ fontSize: '0.6em', opacity: 0.7 }}>/ 10</span></strong>
          <small>Riesgo: {String(data.riskLevel || '-')} / 10</small>
        </div>
      </div>
      <div className="researchCompactGrid">
        <div>
          <span>Nicho</span>
          <strong>{String(data.niche || '-')}</strong>
        </div>
        <div>
          <span>Audiencia</span>
          <strong>{String(data.audience || '-')}</strong>
        </div>
        <div>
          <span>Idioma</span>
          <strong>{String(data.language || '-')}</strong>
        </div>
        <div>
          <span>Saturación</span>
          <strong>{String(data.saturationLevel || '-')} / 10</strong>
        </div>
      </div>
      {titles.length > 0 && (
        <div className="researchTitleList">
          <h2>Alternativas comerciales</h2>
          {titles.slice(0, 5).map((item, index) => {
            const entry = item as Record<string, unknown>;
            return (
              <article key={`${entry.title || index}`}>
                <strong>{String(entry.title || item)}</strong>
                <span>{String(entry.market || entry.language || 'Mercado principal')}</span>
                <p>{String(entry.adaptation || entry.promise || entry.rationale || '')}</p>
              </article>
            );
          })}
        </div>
      )}
      <details className="technicalDetails">
        <summary>Ver investigación completa</summary>
        <div className="researchDetailsGrid">
          <DataPanel title="Keywords" data={keywords.length ? keywords : data.keywords} />
          <DataPanel title="Fuentes y notas" data={sources.length ? sources : data.sourceNotes} />
          <DataPanel title="Reporte completo" data={data.fullReport || data.titleRationale || data} />
        </div>
      </details>
    </section>
  );
}

function parseMaybeArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function RecoveryResult({
  project,
  busy,
  onRun,
  onApprove,
}: {
  project: Project;
  busy: boolean;
  onRun: () => void;
  onApprove: () => void;
}) {
  const navigate = useNavigate();
  const report = project.recoveryReports?.[0] || null;
  const fullReport = parseLooseJson(report?.fullReport);
  const manuscript = String(report?.masterManuscript || '');
  const wordCount = Number((fullReport as Record<string, unknown> | null)?.wordCount || countWords(manuscript));
  const headings = Number((fullReport as Record<string, unknown> | null)?.headings || (manuscript.match(/^#/gm)?.length || 0));
  const issues = Array.isArray((fullReport as Record<string, unknown> | null)?.issues)
    ? ((fullReport as Record<string, unknown>).issues as string[])
    : [];
  const status = String(report?.assemblyStatus || (report ? 'DONE' : 'PENDING'));
  const gate = (project.phaseGates || []).find((item) => item.phase === 'recovery');
  const ready = status === 'DONE' && issues.length === 0 && wordCount >= 5000;

  if (!report) {
    return (
      <section className="editorialStage">
        <div>
          <span className="eyebrow">Manuscrito maestro</span>
          <h2>Ensambla el libro antes de diseñarlo</h2>
          <p className="muted">La app unirá portada editorial, front matter, capítulos, tablas, checklist, declaración IA y recursos finales.</p>
        </div>
        <button className="button primary" onClick={onRun} disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? 'Ensamblando documento maestro...' : 'Ensamblar manuscrito'}
        </button>
        {busy && (
          <div style={{ width: '100%', marginTop: '1rem' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary, #eab308)', width: '100%', animation: 'progressIndeterminate 1.5s infinite linear', transformOrigin: '0% 50%' }} />
            </div>
            <style>{`
              @keyframes progressIndeterminate {
                0% { transform: translateX(-100%) scaleX(0.2); }
                50% { transform: translateX(0) scaleX(0.5); }
                100% { transform: translateX(100%) scaleX(0.2); }
              }
            `}</style>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="editorialStage">
      <div className="stageHeroLine">
        <div>
          <span className="eyebrow">Manuscrito maestro</span>
          <h2>{ready ? 'Manuscrito ensamblado correctamente' : 'Manuscrito necesita revisión'}</h2>
          <p className="muted">{String(report.cleanupLog || 'Contenido unido desde los bloques aprobados.')}</p>
        </div>
        <span className={`qualityBadge ${ready ? 'approved' : 'needs'}`}>{ready ? 'Listo' : 'Revisar'}</span>
      </div>

      <div className="metricGrid">
        <div className="metricTile">
          <span>Palabras</span>
          <strong>{wordCount.toLocaleString('es-ES')}</strong>
        </div>
        <div className="metricTile">
          <span>Secciones</span>
          <strong>{headings}</strong>
        </div>
        <div className="metricTile">
          <span>Bloques faltantes</span>
          <strong>{formatListCount(report.missingBlocks)}</strong>
        </div>
        <div className="metricTile">
          <span>Estado del gate</span>
          <strong>{gate?.status || 'PENDING'}</strong>
        </div>
      </div>

      {issues.length > 0 ? (
        <div className="actionList">
          <h3>La app debe corregir esto antes de avanzar</h3>
          {issues.map((issue) => <p key={issue}>{issue}</p>)}
        </div>
      ) : (
        <div className="nextStepBanner compact">
          El manuscrito ya tiene estructura suficiente para pasar al diseño visual.
        </div>
      )}

      <details className="technicalDetails">
        <summary>Ver muestra del manuscrito ensamblado</summary>
        <pre>{manuscript.slice(0, 3500)}{manuscript.length > 3500 ? '\n\n[...]' : ''}</pre>
      </details>

      <div className="actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <button className="button" onClick={onRun} disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? 'Reensamblando...' : 'Reensamblar'}
        </button>
        {gate?.status !== 'APPROVED' ? (
          <button className="button primary" onClick={onApprove} disabled={busy || !ready}>
            Aprobar manualmente
          </button>
        ) : (
          <button 
            className="button primary pulse-animation" 
            onClick={() => navigate(`/projects/${project.id}/visual-design`)}
            disabled={project.phaseGates?.find(g => g.phase === 'visual-bible')?.approvalStatus !== 'APPROVED'}
            title={project.phaseGates?.find(g => g.phase === 'visual-bible')?.approvalStatus !== 'APPROVED' ? "Requiere aprobar la Biblia Visual" : ""}
          >
            Continuar a diseño visual
          </button>
        )}
      </div>
      {busy && (
        <div style={{ width: '100%', marginTop: '1rem' }}>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--primary, #eab308)', width: '100%', animation: 'progressIndeterminate 1.5s infinite linear', transformOrigin: '0% 50%' }} />
          </div>
          <style>{`
            @keyframes progressIndeterminate {
              0% { transform: translateX(-100%) scaleX(0.2); }
              50% { transform: translateX(0) scaleX(0.5); }
              100% { transform: translateX(100%) scaleX(0.2); }
            }
          `}</style>
        </div>
      )}
      <style>{`
        .pulse-animation {
          animation: pulseButton 2s infinite;
        }
        @keyframes pulseButton {
          0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
        }
      `}</style>
    </section>
  );
}

function parseLooseJson(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function formatListCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string') {
    const parsed = parseLooseJson(value);
    if (Array.isArray(parsed)) return parsed.length;
    return value.trim() ? 1 : 0;
  }
  return 0;
}

export function GoNoGoPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [score, setScore] = useState(project.goNoGoScore || 75);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setScore(project.goNoGoScore || 75);
  }, [project.goNoGoScore]);

  async function run() {
    setBusy(true);
    try {
      await api.runPhase(project.id, 'go-nogo', { score });
      await refresh();
      showToast('Decisión calculada', 'success');
      navigate(`/projects/${project.id}/formula`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al calcular', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title="GO/NO-GO" project={project} />
      <section className="panel">
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Esta fase evalúa matemáticamente el potencial de tu libro basándose en la investigación de mercado. Un score de 70 o más resulta en un <strong>GO</strong> (luz verde para producir). Verifica el puntaje y haz clic en calcular para avanzar a la Fórmula Editorial.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '2rem 0', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', 
            background: score >= 70 ? `conic-gradient(#10b981 ${score}%, rgba(255,255,255,0.1) ${score}%)` : `conic-gradient(#ef4444 ${score}%, rgba(255,255,255,0.1) ${score}%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}>
             <div style={{ position: 'absolute', width: '84px', height: '84px', background: 'var(--bg-primary, #111315)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
               <strong style={{ fontSize: '28px', color: score >= 70 ? '#10b981' : '#ef4444', lineHeight: 1 }}>{score}</strong>
               <span style={{ fontSize: '10px', color: 'var(--text-muted, #a1a1aa)', marginTop: '2px' }}>/ 100</span>
             </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Viabilidad del Proyecto</h3>
            <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '14px', lineHeight: 1.5, maxWidth: '400px' }}>
              {score >= 70 
                ? "¡Luz verde! Tu idea tiene un alto potencial comercial y ha sido aprobada para producción."
                : "Riesgo alto. El mercado muestra saturación o baja demanda. Te sugerimos iterar tu idea."}
            </p>
            <div style={{ marginTop: '12px', display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', background: score >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: score >= 70 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>
              ESTATUS: {score >= 70 ? 'GO' : 'NO-GO'}
            </div>
          </div>
        </div>
        <button className="button primary" onClick={run} disabled={busy} style={{ marginTop: '1rem' }}>
          {busy && <span className="spinner" />}
          Calcular y Continuar
        </button>
      </section>
      <DataPanel title="Decisión" data={{ score: project.goNoGoScore, result: project.goNoGoResult }} />
    </>
  );
}

export function ChapterPlanPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await api.runPhase(project.id, 'chapter-plans');
      await refresh();
      showToast('Plan de capítulos generado', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al generar', 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header title="Índice maestro" project={project} />
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="button primary" onClick={run} disabled={busy}>
          {busy && <span className="spinner" />}
          Generar plan de capítulos
        </button>
        {(project.chapterPlans || []).length > 0 && (
          <button 
            className="button" 
            onClick={() => navigate(`/projects/${project.id}/blocks`)}
            disabled={project.phaseGates?.find(g => g.phase === 'chapter-plan')?.approvalStatus !== 'APPROVED'}
            title={project.phaseGates?.find(g => g.phase === 'chapter-plan')?.approvalStatus !== 'APPROVED' ? "Requiere aprobar el Índice" : ""}
          >
            Continuar a Bloques
          </button>
        )}
        {project.phaseGates?.find(g => g.phase === 'chapter-plan')?.generationStatus === 'GENERATED' && 
         project.phaseGates?.find(g => g.phase === 'chapter-plan')?.approvalStatus !== 'APPROVED' && (
          <button 
            className="button success" 
            onClick={async () => {
              setBusy(true);
              try {
                await api.setGate(project.id, 'chapter-plan', { approvalStatus: 'APPROVED' });
                await refresh();
                showToast('Índice aprobado', 'success');
              } catch (e: any) {
                showToast(e.message, 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            Aprobar Índice
          </button>
        )}
      </div>
      <section className="list">
        {(project.chapterPlans || []).length === 0 && (
          <p className="muted">Aún no hay capítulos. Genera el índice maestro después de aprobar fórmula y biblia editorial.</p>
        )}
        {(project.chapterPlans || []).map((chapter) => (
          <article className="projectRow" key={chapter.id}>
            <div>
              <strong>{chapter.chapterNumber}. {chapter.title}</strong>
              <small>{chapter.summary}</small>
            </div>
            <span>{chapter.estimatedWords || 0} palabras</span>
          </article>
        ))}
      </section>
    </>
  );
}

export function BlocksPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [progressData, setProgressData] = useState<{ globalProgress?: number; currentChapterIndex?: number; chapterProgress?: number; message?: string } | null>(null);
  const blocks = project.manuscriptBlocks || [];
  const weakBlocks = blocks.filter((block) => (block.wordCount || 0) < 750);
  const localFallbackBlocks = blocks.filter((block) => block.status === 'NEEDS_REVISION' || /template|skipped after recent provider failure/i.test(block.aiModel || ''));

  async function run() {
    setBusy(true);
    setProgressData({ currentChapterIndex: 1, chapterProgress: 0, message: 'Iniciando proceso...' });
    try {
      await new Promise<void>((resolve, reject) => {
        const source = new EventSource(`/api/projects/${project.id}/blocks/stream`);
        source.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.error) {
            source.close();
            reject(new Error(data.error));
          } else if (data.done) {
            source.close();
            resolve();
          } else {
            setProgressData(data);
          }
        };
        source.onerror = (err) => {
          source.close();
          reject(new Error('SSE connection error.'));
        };
      });
      await refresh();
      showToast('Bloques generados', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al generar', 'error');
    } finally {
      setBusy(false);
      setProgressData(null);
    }
  }

  return (
    <>
      <Header title="Bloques de manuscrito" project={project} />
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="button primary" onClick={run} disabled={busy}>
          {busy && <span className="spinner" />}
          Crear bloques desde índice
        </button>
        {(project.manuscriptBlocks || []).length > 0 && (
          <button 
            className="button" 
            onClick={() => navigate(`/projects/${project.id}/audit`)}
            disabled={project.phaseGates?.find(g => g.phase === 'blocks')?.approvalStatus !== 'APPROVED'}
            title={project.phaseGates?.find(g => g.phase === 'blocks')?.approvalStatus !== 'APPROVED' ? "Requiere aprobar todos los bloques" : ""}
          >
            Continuar a Auditoría
          </button>
        )}
        {project.phaseGates?.find(g => g.phase === 'blocks')?.generationStatus === 'GENERATED' && 
         project.phaseGates?.find(g => g.phase === 'blocks')?.approvalStatus !== 'APPROVED' && (
          <button 
            className="button success" 
            onClick={async () => {
              setBusy(true);
              try {
                await api.setGate(project.id, 'blocks', { approvalStatus: 'APPROVED' });
                await refresh();
                showToast('Bloques aprobados', 'success');
              } catch (e: any) {
                showToast(e.message, 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            Aprobar Bloques
          </button>
        )}
      </div>
      {blocks.length > 0 && (weakBlocks.length > 0 || localFallbackBlocks.length > 0) && (
        <section className="qualitySummary" style={{ marginBottom: '1rem' }}>
          <span className="eyebrow">Atención editorial</span>
          <h3>Estos capítulos aún no están listos para publicación</h3>
          <p className="muted">
            {weakBlocks.length > 0 ? `${weakBlocks.length} capítulo(s) quedaron bajo el mínimo editorial. ` : ''}
            {localFallbackBlocks.length > 0 ? `${localFallbackBlocks.length} capítulo(s) usaron respaldo local porque las IA externas no respondieron o agotaron cuota. Configura una API válida y vuelve a generar.` : ''}
          </p>
        </section>
      )}
      <section className="list">
        {busy && progressData ? (() => {
          const plans = project.chapterPlans || [];
          const currentIdx = progressData.currentChapterIndex || 0;
          const completedCount = Math.max(0, currentIdx - 1);
          const totalCount = plans.length;
          const globalProgress = totalCount > 0 ? Math.round(((completedCount + (progressData.chapterProgress || 0) / 100) / totalCount) * 100) : 0;

          return (
            <>
              {/* Global Progress Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.1))',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '16px',
                padding: '24px 28px',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Animated background shimmer */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.08) 50%, transparent 100%)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
                <style>{`
                  @keyframes shimmer {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                  }
                  @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.4); }
                    50% { box-shadow: 0 0 20px 4px rgba(234,179,8,0.2); }
                  }
                  @keyframes spin-icon {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a78bfa', fontWeight: 600 }}>
                        Generando manuscrito
                      </span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '22px', color: 'white' }}>
                        Capítulo {currentIdx} de {totalCount}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '36px', fontWeight: 700, color: '#a78bfa', lineHeight: 1 }}>
                        {globalProgress}%
                      </div>
                      <span style={{ fontSize: '12px', color: '#71717a' }}>progreso total</span>
                    </div>
                  </div>

                  {/* Global progress bar */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${globalProgress}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px', color: '#a1a1aa' }}>
                    <span>✅ {completedCount} completado{completedCount !== 1 ? 's' : ''}</span>
                    <span>⏳ {totalCount - completedCount - (currentIdx <= totalCount ? 1 : 0)} en cola</span>
                    <span>📝 ~{plans.reduce((sum, p) => sum + (p.estimatedWords || 0), 0).toLocaleString()} palabras totales</span>
                  </div>
                </div>
              </div>

              {/* Per-chapter list */}
              {plans.map((plan, idx) => {
                const chapterNum = idx + 1;
                const isCurrent = chapterNum === currentIdx;
                const isDone = chapterNum < currentIdx;
                const isQueued = !isDone && !isCurrent;
                const chapterProgress = isDone ? 100 : (isCurrent ? (progressData.chapterProgress || 0) : 0);

                return (
                  <div
                    key={plan.id}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      padding: '16px 20px',
                      marginBottom: '8px',
                      borderRadius: '12px',
                      border: isCurrent ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      background: isCurrent
                        ? 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(17,19,21,0.8))'
                        : isDone
                          ? 'rgba(16,185,129,0.05)'
                          : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.3s ease',
                      animation: isCurrent ? 'pulse-glow 2s ease-in-out infinite, fade-in-up 0.3s ease' : isDone ? 'fade-in-up 0.3s ease' : 'none',
                      opacity: isQueued ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Status icon */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? '#10b981' : isCurrent ? '#eab308' : 'rgba(255,255,255,0.08)',
                          fontSize: '16px', flexShrink: 0,
                          ...(isCurrent ? { animation: 'spin-icon 2s linear infinite' } : {}),
                        }}>
                          {isDone ? '✓' : isCurrent ? '⚙' : <span style={{ color: '#52525b' }}>{chapterNum}</span>}
                        </div>
                        <div>
                          <strong style={{ color: isDone ? '#a7f3d0' : isCurrent ? '#fde68a' : '#71717a', fontSize: '15px' }}>
                            {plan.title}
                          </strong>
                          <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                            {plan.estimatedWords?.toLocaleString() || 0} palabras est.
                          </div>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: '6px',
                        background: isDone ? 'rgba(16,185,129,0.15)' : isCurrent ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isDone ? '#10b981' : isCurrent ? '#eab308' : '#52525b',
                      }}>
                        {isDone ? '✅ Listo' : isCurrent ? '🔄 Generando...' : '⏳ En cola'}
                      </div>
                    </div>

                    {/* Progress bar for active chapter */}
                    {isCurrent && (
                      <div style={{ width: '100%', marginTop: '12px', animation: 'fade-in-up 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <small style={{ color: '#eab308', fontWeight: 500, fontSize: '13px' }}>
                            {progressData.message || 'Procesando...'}
                          </small>
                          <small style={{ color: '#eab308', fontWeight: 700, fontSize: '13px' }}>
                            {chapterProgress}%
                          </small>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${chapterProgress}%`,
                            background: 'linear-gradient(90deg, #eab308, #f59e0b)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })() : (
          blocks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 24px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
              <h3 style={{ color: 'white', margin: '0 0 8px' }}>Sin bloques aún</h3>
              <p className="muted">Haz clic en "Crear bloques desde índice" para generar el manuscrito completo de tu libro.</p>
            </div>
          ) : (
            blocks.map((block, idx) => {
              const wordCount = block.wordCount || 0;
              const maxWords = Math.max(...blocks.map(b => b.wordCount || 0), 1);
              const widthPct = Math.round((wordCount / maxWords) * 100);
              const needsFix = block.status === 'NEEDS_REVISION' || /template/i.test(block.aiModel || '');

              return (
                <button
                  className="projectRow clickable"
                  key={block.id}
                  onClick={() => navigate(`/projects/${project.id}/blocks/${block.id}`)}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {/* Background bar showing relative word count */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${widthPct}%`,
                    background: needsFix
                      ? 'linear-gradient(90deg, rgba(239,68,68,0.06), transparent)'
                      : 'linear-gradient(90deg, rgba(139,92,246,0.08), transparent)',
                    transition: 'width 0.5s ease',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <strong>{block.blockTitle}</strong>
                    <small>
                      {wordCount.toLocaleString()} palabras
                      {needsFix ? ' · ⚠️ requiere IA externa válida' : ''}
                    </small>
                  </div>
                  <span style={{
                    position: 'relative', zIndex: 1,
                    fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: block.status === 'APPROVED' ? 'rgba(16,185,129,0.15)'
                      : needsFix ? 'rgba(239,68,68,0.15)'
                      : 'rgba(139,92,246,0.15)',
                    color: block.status === 'APPROVED' ? '#10b981'
                      : needsFix ? '#ef4444'
                      : '#a78bfa',
                  }}>
                    {block.status === 'APPROVED' ? '✅ Aprobado' : needsFix ? '⚠️ Revisar' : '📝 Borrador'}
                  </span>
                </button>
              );
            })
          )
        )}
      </section>
    </>
  );
}

export function BlockEditorPage() {
  const { blockId } = useParams();
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const block = useMemo(
    () => (project.manuscriptBlocks || []).find((item) => item.id === Number(blockId)) as ManuscriptBlock | undefined,
    [blockId, project.manuscriptBlocks],
  );
  const [content, setContent] = useState(block?.content || '');

  useEffect(() => {
    setContent(block?.content || '');
  }, [block?.id, block?.content]);

  if (!block) return <p className="muted">Bloque no encontrado.</p>;
  const activeBlock = block;

  async function save(status = activeBlock.status || 'DRAFT') {
    setBusy(true);
    try {
      await api.updateBlock(project.id, activeBlock.id, { content, status });
      await refresh();
      showToast(status === 'APPROVED' ? 'Bloque aprobado' : 'Bloque guardado', 'success');
      if (status === 'APPROVED') {
        navigate(`/projects/${project.id}/blocks`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar bloque', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title={activeBlock.blockTitle} project={project} />
      <section className="editor">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} />
        <div className="actions">
          <button className="button" onClick={() => save('DRAFT')} disabled={busy}>
            {busy && <span className="spinner" />}
            Guardar
          </button>
          <button className="button primary" onClick={() => save('APPROVED')} disabled={busy}>
            {busy && <span className="spinner" />}
            Aprobar
          </button>
        </div>
      </section>
    </>
  );
}

export function VisualDesignPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [aiBusyId, setAiBusyId] = useState<number | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set());
  const [expandedAsset, setExpandedAsset] = useState<VisualAsset | null>(null);
  const allAssetsApproved = (project.visualAssets || []).length > 0 && (project.visualAssets || []).every((asset) => approvedIds.has(asset.id));

  useEffect(() => {
    setApprovedIds(new Set((project.visualAssets || []).filter((asset) => asset.approvalStatus === 'APPROVED').map((asset) => asset.id)));
  }, [project.visualAssets]);

  async function approveAsset(assetId: number) {
    setBusyId(assetId);
    try {
      await api.approveAsset(project.id, assetId, {
        approvalStatus: 'APPROVED',
        status: 'APPROVED',
        rights: 'Aprobado para paquete local privado; revisar derechos antes de publicacion externa.',
      });
      setApprovedIds((current) => new Set([...current, assetId]));
      await refresh();
      showToast('Asset visual aprobado', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al aprobar asset', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function regenerateAsset(assetId: number) {
    setRegeneratingId(assetId);
    try {
      await api.regenerateAsset(project.id, assetId);
      setApprovedIds((current) => {
        const next = new Set(current);
        next.delete(assetId);
        return next;
      });
      await refresh();
      showToast('Nueva opción generada con la misma dirección visual', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al regenerar asset', 'error');
    } finally {
      setRegeneratingId(null);
    }
  }

  async function generateWithAI(asset: VisualAsset) {
    setAiBusyId(asset.id);
    try {
      const promptInfo = await api.visualAssetPrompt(project.id, asset.id);
      const puter = await loadPuter();
      if (!puter?.ai?.txt2img) throw new Error('Puter.js no está disponible');
      const rawImage = await puter.ai?.txt2img?.(promptInfo.prompt);
      if (!rawImage) throw new Error('Puter no devolvió una imagen usable');
      const dataUrl = await imageResultToDataUrl(rawImage);
      await api.saveExternalAsset(project.id, asset.id, {
        dataUrl,
        provider: 'puter',
        model: String(promptInfo.model || 'auto'),
        prompt: promptInfo.prompt,
        rights: 'Imagen generada con Puter.js y guardada localmente; revisar términos del proveedor antes de publicación externa.',
      });
      setApprovedIds((current) => {
        const next = new Set(current);
        next.delete(asset.id);
        return next;
      });
      await refresh();
      showToast('Imagen IA generada y guardada localmente. Revisa y aprueba.', 'success');
    } catch (error) {
      try {
        const promptInfo = await api.visualAssetPrompt(project.id, asset.id).catch(() => ({ prompt: asset.prompt || asset.name }));
        await api.externalAssetFallback(project.id, asset.id, {
          provider: 'puter',
          model: 'auto',
          prompt: promptInfo.prompt,
          error: error instanceof Error ? error.message : 'Puter no disponible',
        });
        await refresh();
      } catch {
        // Surface the original generation error below.
      }
      showToast(error instanceof Error ? `IA externa falló; fallback local activo: ${error.message}` : 'IA externa falló; fallback local activo', 'error');
    } finally {
      setAiBusyId(null);
    }
  }

  async function useLocalFallback(asset: VisualAsset) {
    setRegeneratingId(asset.id);
    try {
      await api.externalAssetFallback(project.id, asset.id, {
        provider: asset.externalProvider || 'puter',
        model: asset.externalModel || 'auto',
        prompt: asset.externalPrompt || asset.prompt || asset.name,
        error: 'Usuario eligió fallback SVG local.',
      });
      await api.regenerateAsset(project.id, asset.id);
      setApprovedIds((current) => {
        const next = new Set(current);
        next.delete(asset.id);
        return next;
      });
      await refresh();
      showToast('Fallback local regenerado con la dirección visual actual', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al activar fallback local', 'error');
    } finally {
      setRegeneratingId(null);
    }
  }

  return (
    <>
      <Header title="Diseño visual" project={project} eyebrow="Diseño visual" />
      <VisualBibleResult data={project.visualBible as Record<string, unknown> | null | undefined} />
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Assets visuales</h2>
            <p className="muted">
              {(project.visualAssets || []).filter((asset) => !approvedIds.has(asset.id)).length === 0
                ? 'Todos los assets están aprobados para exportación.'
                : `${(project.visualAssets || []).filter((asset) => !approvedIds.has(asset.id)).length} assets pendientes de aprobación.`}
            </p>
          </div>
          {(project.phaseGates || []).some((g) => g.phase === 'metadata' && g.generationStatus === 'GENERATED') && (
            <button 
              className="button primary" 
              onClick={() => navigate(`/projects/${project.id}/quality`)} 
              type="button"
              disabled={project.phaseGates?.find(g => g.phase === 'metadata')?.approvalStatus !== 'APPROVED'}
            >
              Continuar a Quality gates
            </button>
          )}
        </div>
        {allAssetsApproved && (
          <div className="nextStepBanner">
            <div>
              Diseño visual aprobado. El siguiente paso es ejecutar el verificador completo de producción.
            </div>
            <button className="button primary" onClick={() => navigate(`/projects/${project.id}/quality`)} type="button">
              Ir a Quality gates
            </button>
          </div>
        )}
        <div className="visualGrid">
          {(project.visualAssets || []).length === 0 && (
            <p className="muted">Aún no hay assets. Genera la biblia visual y los bloques para crear prompts, placeholders y aprobaciones.</p>
          )}
          {(project.visualAssets || []).map((asset) => (
            <article className={`visualCard ${approvedIds.has(asset.id) ? 'approved' : ''}`} key={asset.id}>
              {(() => {
                const isStructural = ['separator', 'icons', 'worksheet', 'mockup'].includes(asset.assetType);
                const hasExternalOverride = asset.externalStatus === 'GENERATED';
                return (
                  <div className="visualCardImage" onClick={() => setExpandedAsset(asset)}>
                    <VisualAssetPreview projectId={project.id} asset={asset} cacheKey={project.updatedAt} />
                    <div className="visualCardOverlay">
                      {!isStructural && (
                        <>
                          <button className="iconButton" title="Generar con IA (Puter)" onClick={(e) => { e.stopPropagation(); generateWithAI(asset); }} disabled={aiBusyId === asset.id || regeneratingId === asset.id || busyId === asset.id}>
                            {aiBusyId === asset.id ? '⏳' : '✨'}
                          </button>
                          <button className="iconButton" title="Generar imagen premium (fal.ai/Stability)" onClick={(e) => { e.stopPropagation(); regenerateAsset(asset.id); }} disabled={regeneratingId === asset.id || busyId === asset.id}>
                            {regeneratingId === asset.id ? '⏳' : '🔄'}
                          </button>
                        </>
                      )}
                      {hasExternalOverride && (
                        <button className="iconButton" title="Restaurar SVG original" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} onClick={(e) => { e.stopPropagation(); useLocalFallback(asset); }} disabled={regeneratingId === asset.id || busyId === asset.id}>
                          {regeneratingId === asset.id ? '⏳' : '↺'}
                        </button>
                      )}
                      <button className="iconButton approveBtn" title="Aprobar para producción" onClick={(e) => { e.stopPropagation(); approveAsset(asset.id); }} disabled={busyId === asset.id || approvedIds.has(asset.id) || regeneratingId === asset.id}>
                        {busyId === asset.id ? '⏳' : approvedIds.has(asset.id) ? '✅' : 'Aprobar'}
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div className="visualCardMeta">
                <strong>{asset.name}</strong>
                <small>{visualAssetSummary(asset)}</small>
                <div className="visualCardStatus">
                  <span className={`statusIndicator ${asset.externalStatus === 'GENERATED' ? 'external' : asset.externalStatus === 'FALLBACK_USED' ? 'fallback' : 'local'}`}></span>
                  <span className="statusText" title={asset.externalError || ''}>
                    {asset.externalStatus === 'GENERATED' ? `IA externa (${asset.externalProvider || 'puter'})` : asset.externalStatus === 'FALLBACK_USED' ? 'Fallback' : 'Local SVG'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
        {allAssetsApproved && (
          <div className="actions endActions">
            <button className="button primary" onClick={() => navigate(`/projects/${project.id}/quality`)} type="button">
              Continuar a Quality gates
            </button>
          </div>
        )}
      </section>
      {expandedAsset && (
        <div className="assetModal" role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${expandedAsset.name}`}>
          <button className="modalBackdrop" onClick={() => setExpandedAsset(null)} type="button" aria-label="Cerrar vista ampliada" />
          <section className="assetModalPanel">
            <header>
              <div>
                <h2>{expandedAsset.name}</h2>
                <p>{visualAssetSummary(expandedAsset)}</p>
              </div>
              <button className="button" onClick={() => setExpandedAsset(null)} type="button">Cerrar</button>
            </header>
            <div className="assetModalImage">
              <VisualAssetPreview projectId={project.id} asset={expandedAsset} cacheKey={`${project.updatedAt}-${expandedAsset.replacementPath || ''}`} large />
            </div>
            <p className="muted">
              Aprobar confirma este asset final actual para exportación. Si luego se reemplaza por una imagen externa o generada por IA, deberá aprobarse nuevamente.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

function cleanPrompt(prompt?: string | null) {
  if (!prompt) return 'Referencia visual editable pendiente de reemplazo final.';
  try {
    const parsed = JSON.parse(prompt);
    if (Array.isArray(parsed)) return parsed.join(' / ');
  } catch {
    // Keep raw prompt below.
  }
  return prompt;
}

function visualAssetSummary(asset: VisualAsset) {
  const labels: Record<string, string> = {
    cover: 'Portada frontal separada para KDP/Gumroad',
    'chapter-opener': 'Lámina de apertura para capítulos',
    figure: 'Figura interna para explicar el método visualmente',
    separator: 'Separadores y ornamentos para páginas de lectura',
    icons: 'Iconografía editorial para índice y resúmenes',
    mockup: 'Imagen comercial para página de venta',
    worksheet: 'Hoja imprimible de ejercicios o checklist',
  };
  const role = asset.layoutRole ? ` · ${asset.layoutRole}` : '';
  return `${labels[asset.assetType] || 'Asset visual del paquete editorial'}${role}`;
}

function VisualAssetPreview({ projectId, asset, cacheKey, large = false }: { projectId: number; asset: VisualAsset; cacheKey: string; large?: boolean }) {
  const previewSrc = `/api/projects/${projectId}/visual-assets/${asset.id}/preview.svg?v=${encodeURIComponent(`${cacheKey}-${asset.replacementPath || ''}`)}`;
  return (
    <div className={`assetPreview image ${large ? 'large' : ''}`}>
      <img src={previewSrc} alt={`${asset.name} final actual`} />
    </div>
  );
}

let puterScriptPromise: Promise<typeof window.puter> | null = null;

function loadPuter() {
  if (window.puter?.ai?.txt2img) return Promise.resolve(window.puter);
  if (puterScriptPromise) return puterScriptPromise;
  puterScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-puter-js="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.puter), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Puter.js')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.dataset.puterJs = 'true';
    script.onload = () => {
      if (window.puter?.ai?.txt2img) resolve(window.puter);
      else reject(new Error('Puter.js cargó, pero txt2img no está disponible'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar Puter.js'));
    document.head.appendChild(script);
  });
  return puterScriptPromise;
}

async function imageResultToDataUrl(result: unknown): Promise<string> {
  if (typeof result === 'string') {
    if (result.startsWith('data:image/')) return result;
    const response = await fetch(result);
    if (!response.ok) throw new Error('No se pudo descargar la imagen generada');
    return blobToDataUrl(await response.blob());
  }
  if (result instanceof Blob) return blobToDataUrl(result);
  if (result instanceof HTMLImageElement) return imageElementToDataUrl(result);
  if (result && typeof result === 'object') {
    const candidate = result as { src?: unknown; url?: unknown; dataUrl?: unknown; dataURI?: unknown; image?: unknown };
    for (const value of [candidate.dataUrl, candidate.dataURI, candidate.url, candidate.src, candidate.image]) {
      if (value) return imageResultToDataUrl(value);
    }
  }
  throw new Error('Formato de imagen Puter no reconocido');
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen generada'));
    reader.readAsDataURL(blob);
  });
}

function imageElementToDataUrl(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  if (!canvas.width || !canvas.height) throw new Error('La imagen generada no tiene dimensiones válidas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas no disponible para guardar imagen');
  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function FigureFallback() {
  return (
    <svg viewBox="0 0 360 216" role="img" aria-label="Mapa conceptual editorial">
      <rect width="360" height="216" fill="#F8F3EA" />
      <circle cx="180" cy="108" r="36" fill="#111315" />
      <text x="180" y="113" textAnchor="middle" fontFamily="Georgia" fontSize="15" fill="#F8F3EA">Decisión</text>
      {[[58, 50, '#3A7D7C', 'Observa'], [258, 50, '#D95D39', 'Prioriza'], [58, 148, '#D9BF67', 'Aplica'], [258, 148, '#526064', 'Registra']].map(([x, y, color, label]) => (
        <g key={String(label)}>
          <rect x={Number(x) - 42} y={Number(y) - 17} width="84" height="34" fill={String(color)} />
          <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fontFamily="Arial" fontSize="13" fill={color === '#D9BF67' ? '#111315' : '#fff'}>{String(label)}</text>
        </g>
      ))}
    </svg>
  );
}

function MockupFallback() {
  return (
    <svg viewBox="0 0 360 230" role="img" aria-label="Mockup editorial premium">
      <rect width="360" height="230" fill="#F6F0E7" />
      <ellipse cx="178" cy="190" rx="110" ry="16" fill="#111315" opacity="0.14" />
      <path d="M120 42 L210 26 L210 176 L120 194 Z" fill="#3A7D7C" />
      <path d="M210 26 L240 48 L240 188 L210 176 Z" fill="#D9BF67" />
      <path d="M134 62 L194 52" stroke="#F8F3EA" strokeWidth="4" />
      <circle cx="166" cy="124" r="24" fill="none" stroke="#D95D39" strokeWidth="6" />
      <text x="178" y="214" textAnchor="middle" fontFamily="Georgia" fontSize="18" fill="#111315">Mockup comercial</text>
    </svg>
  );
}

function WorksheetFallback() {
  return (
    <svg viewBox="0 0 360 230" role="img" aria-label="Worksheet editorial premium">
      <rect width="360" height="230" fill="#F8F3EA" />
      <rect x="54" y="28" width="252" height="174" fill="#FFFFFF" stroke="#D9BF67" strokeWidth="3" />
      <text x="78" y="62" fontFamily="Georgia" fontSize="21" fill="#111315">Checklist editorial</text>
      {[0, 1, 2, 3].map((row) => (
        <g key={row} transform={`translate(78 ${88 + row * 28})`}>
          <rect width="15" height="15" fill="none" stroke="#3A7D7C" strokeWidth="3" />
          <line x1="29" y1="8" x2={170 - row * 14} y2="8" stroke={row === 2 ? '#D95D39' : '#526064'} strokeWidth="5" />
        </g>
      ))}
      <rect x="78" y="180" width="86" height="8" fill="#D9BF67" />
    </svg>
  );
}

export function PreviewPage() {
  const { project, showToast } = useProjectContext();
  const [mode, setMode] = useState<'pdf' | 'epub' | 'package'>('pdf');
  const [busy, setBusy] = useState(false);
  const [layoutReport, setLayoutReport] = useState<Record<string, unknown> | null>(null);
  const [rhythmReport, setRhythmReport] = useState<Record<string, unknown> | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const selectedStyleKey = styles.find((style) => style.recommended)?.key || styles[0]?.key || '';

  const fetchPages = useCallback(async () => {
    try {
      const res = await api.layoutPages(project.id);
      setPages(res.pages || []);
      if (res.pages?.length && !selectedPageId) setSelectedPageId(res.pages[0].id);
    } catch (error) {
      console.error(error);
    }
  }, [project.id, selectedPageId]);

  const fetchStyles = useCallback(async () => {
    try {
      const res = await api.layoutStyles(project.id);
      setStyles(res.styles || []);
    } catch (error) {
      console.error(error);
    }
  }, [project.id]);

  const fetchRhythm = useCallback(async () => {
    try {
      setRhythmReport(await api.rhythmReport(project.id));
    } catch (error) {
      console.error(error);
    }
  }, [project.id]);

  useEffect(() => {
    fetchPages();
    fetchStyles();
    fetchRhythm();
    api.layoutReport(project.id).then(setLayoutReport).catch(() => setLayoutReport(null));
  }, [project.id, fetchPages, fetchStyles, fetchRhythm]);

  async function regenerateLayout() {
    setBusy(true);
    try {
      const result = await api.renderLayout(project.id);
      setLayoutReport((result.report as Record<string, unknown>) || result);
      await fetchPages();
      await fetchRhythm();
      showToast('Maquetación editorial regenerada', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al regenerar layout', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function approvePage(pageId: string) {
    try {
      await api.layoutApprovePage(project.id, pageId);
      await fetchPages();
      showToast('Página aprobada', 'success');
    } catch (error) {
      showToast('Error al aprobar', 'error');
    }
  }

  async function regeneratePage(pageId: string) {
    try {
      await api.layoutRegeneratePage(project.id, pageId);
      await fetchPages();
      showToast('Página marcada para regeneración', 'success');
    } catch (error) {
      showToast('Error al regenerar', 'error');
    }
  }

  async function changeTemplate(pageId: string, template: string) {
    try {
      await api.layoutChangeTemplate(project.id, pageId, template);
      await fetchPages();
      showToast('Plantilla cambiada', 'success');
    } catch (error) {
      showToast('Error al cambiar plantilla', 'error');
    }
  }

  async function applyStyle(styleKey: string) {
    setBusy(true);
    try {
      const result = await api.applyArtDirection(project.id, styleKey);
      setLayoutReport(result);
      await fetchPages();
      await fetchStyles();
      await fetchRhythm();
      showToast('Dirección de arte aplicada', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al aplicar estilo', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function optimizeRhythm() {
    setBusy(true);
    try {
      const result = await api.applyRhythm(project.id);
      setRhythmReport((result.report as Record<string, unknown>) || result);
      await fetchPages();
      const report = await api.layoutReport(project.id).catch(() => null);
      if (report) setLayoutReport(report);
      showToast('Ritmo editorial optimizado', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al optimizar ritmo editorial', 'error');
    } finally {
      setBusy(false);
    }
  }

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const approvedPageCount = pages.filter((page) => page.status === 'APPROVED').length;
  const rhythm = rhythmReport || (layoutReport?.rhythm as Record<string, unknown> | undefined) || {};
  const targetRange = (rhythm.targetRange as { min?: number; max?: number } | undefined) || {};
  const rhythmActions = Array.isArray(rhythm.actions) ? rhythm.actions as string[] : [];

  return (
    <>
      <Header title="Editor visual de páginas" project={project} />
      <div className="previewToolbar">
        <div className="tabs">
          <button className={mode === 'pdf' ? 'active' : ''} onClick={() => setMode('pdf')}>Mesa editorial</button>
          <button className={mode === 'epub' ? 'active' : ''} onClick={() => setMode('epub')}>EPUB/Reflow</button>
          <button className={mode === 'package' ? 'active' : ''} onClick={() => setMode('package')}>Paquete</button>
        </div>
        <select className="themeSelector" value={selectedStyleKey} onChange={(event) => applyStyle(event.target.value)} disabled={busy}>
          {styles.map(s => (
             <option key={s.key} value={s.key}>{s.key}{s.recommended ? ' recomendado' : ''}</option>
          ))}
        </select>
        <a className="button primary" href={`/api/projects/${project.id}/preview.pdf`} target="_blank" rel="noreferrer">
          Descargar PDF
        </a>
        <button className="button" onClick={regenerateLayout} disabled={busy}>
          {busy && <span className="spinner" />}
          Renderizar Layout Completo
        </button>
      </div>
      <section className="previewStatus">
        <div>
          <span>Estándar profesional</span>
          <strong>{String((layoutReport?.professionalReport as any)?.status || (layoutReport?.professional as any)?.status || layoutReport?.status || 'Pendiente')}</strong>
        </div>
        <div>
          <span>Páginas aprobadas</span>
          <strong>{approvedPageCount}/{pages.length || '-'}</strong>
        </div>
        <div>
          <span>Estilo activo</span>
          <strong>{selectedStyleKey || '-'}</strong>
        </div>
        <label>
          Zoom
          <input type="range" min={50} max={150} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
        </label>
      </section>
      <section className="rhythmPanel">
        <div>
          <span>Ritmo editorial</span>
          <strong>{String(rhythm.status || 'Pendiente')}</strong>
          <small>{String(rhythm.pageCount || pages.length || '-')} páginas · objetivo {targetRange.min || '-'}-{targetRange.max || '-'}</small>
        </div>
        <div>
          <span>Páginas repetidas</span>
          <strong>{String(rhythm.repeatedRuns ?? '-')}</strong>
          <small>Deben evitarse más de dos plantillas iguales seguidas.</small>
        </div>
        <div>
          <span>Densidad</span>
          <strong>{String(rhythm.sparsePages ?? 0)} bajas / {String(rhythm.densePages ?? 0)} altas</strong>
          <small>La app compacta o divide automáticamente.</small>
        </div>
        <button className="button primary" onClick={optimizeRhythm} disabled={busy}>
          {busy && <span className="spinner" />}
          Optimizar ritmo editorial
        </button>
        {rhythmActions.length > 0 && (
          <ul>
            {rhythmActions.slice(0, 3).map((action) => <li key={action}>{action}</li>)}
          </ul>
        )}
      </section>

      {mode === 'pdf' ? (
        <div className="page-builder-container">
          <aside className="page-thumbnails">
            {pages.map((page, i) => (
              <div 
                key={page.id} 
                className={`thumbnail-card ${selectedPageId === page.id ? 'selected' : ''}`}
                onClick={() => setSelectedPageId(page.id)}
              >
                <div className="thumbnail-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', color: '#666', fontSize: '0.7rem', borderBottom: '1px solid #333' }}>
                   {page.type.includes('cover') || page.type.includes('opener') || page.type.includes('figure') ? '🖼️ Visual' : '📄 Texto'}
                </div>
                <div className="thumbnail-info">
                  <span className="page-num">Pág {i+1}</span>
                  <span className="page-type">{page.rhythmRole || page.sectionLabel || page.type.substring(0, 8)}</span>
                  <span className={`status-badge ${String(page.status || '').toLowerCase()}`} title={page.status}>{page.status === 'APPROVED' ? 'OK' : page.status === 'NEEDS_REVISION' ? 'Revisar' : 'Pendiente'}</span>
                </div>
              </div>
            ))}
          </aside>
          
          <main className="page-editor-main">
            {selectedPage && (
               <div className="page-actions-bar">
                 <div className="page-meta">
                   <h3>Página {pages.indexOf(selectedPage) + 1}: {selectedPage.title}</h3>
                   <span className="quality-note">{selectedPage.qualityNote || 'Pendiente de revisión visual'}</span>
                 </div>
                 <div className="actions">
                    <a className="button primary" href={`/api/projects/${project.id}/preview.pdf`} target="_blank" rel="noreferrer">
                      Descargar PDF
                    </a>
                    <select value={selectedPage.type} onChange={e => changeTemplate(selectedPage.id, e.target.value)}>
                      <option value="cover">Portada</option>
                      <option value="title">Portadilla</option>
                      <option value="toc">Índice visual</option>
                      <option value="chapter-opener">Apertura Capítulo</option>
                      <option value="reading-page">Página de lectura</option>
                      <option value="reading-spread">Lectura amplia</option>
                      <option value="figure-page">Figura / Lámina</option>
                      <option value="case-study">Caso aplicado</option>
                      <option value="comparison-table">Tabla editorial</option>
                      <option value="practice-lab">Práctica guiada</option>
                      <option value="chapter-summary">Resumen capítulo</option>
                      <option value="worksheet">Worksheet</option>
                      <option value="appendix">Apéndice</option>
                      <option value="credits">Créditos</option>
                    </select>
                    <button className="button" onClick={() => regeneratePage(selectedPage.id)}>Otra variante</button>
                    {selectedPage.status !== 'APPROVED' && (
                       <button className="button primary" onClick={() => approvePage(selectedPage.id)}>Aprobar página</button>
                    )}
                 </div>
               </div>
            )}
            
            <section className="previewShell pageBuilderPreview" style={{ ['--preview-zoom' as string]: `${zoom}%` }}>
               <iframe title="Vista previa" src={`/api/projects/${project.id}/preview${selectedPage ? `#page-${pages.indexOf(selectedPage)+1}` : ''}`} />
            </section>
          </main>
        </div>
      ) : mode === 'epub' ? (
        <section className="previewShell reflow">
          <iframe title="Reflow" src={`/api/projects/${project.id}/preview`} />
        </section>
      ) : (
        <DataPanel title="Paquete de publicación" data={{ metadata: project.metadataPackage, checklist: project.publishingChecklist, readiness: project.publicationReadiness, exports: project.exportPackages }} />
      )}
    </>
  );
}

export function QualityPage() {
  const { project, refresh, showToast } = useProjectContext();
  const navigate = useNavigate();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [busyAction, setBusyAction] = useState('');
  const quality = report || parseReadinessReport(project.publicationReadiness);
  const productionTasks = deriveProductionTasks(project, quality);
  const pendingTasks = productionTasks.filter((task) => task.status !== 'done');
  const primaryTask = pendingTasks[0];
  const blockers = quality ? getQualityBlockers(quality, project) : [];
  const gateSummary = summarizeGates(project.phaseGates || []);
  const readyCount = productionTasks.filter((task) => task.status === 'done').length;
  const readinessPercent = Math.round((readyCount / productionTasks.length) * 100);

  async function runQuality() {
    setBusyAction('quality');
    try {
      setReport(await api.quality(project.id));
      await refresh();
      showToast('Reporte generado', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al verificar calidad', 'error');
    } finally {
      setBusyAction('');
    }
  }

  async function refreshQuality(message?: string) {
    await refresh();
    setReport(await api.quality(project.id));
    if (message) showToast(message, 'success');
  }

  async function runQualityTask(kind: QualityTaskKind) {
    setBusyAction(kind);
    try {
      if (kind === 'run-quality') {
        await runQuality();
        return;
      }
      if (kind === 'verify-market') {
        if (!project.marketResearch) {
          await api.runPhase(project.id, 'market-research', { userVerified: true });
        } else {
          await api.verifyMarketResearch(project.id);
        }
        await refreshQuality('Mercado verificado');
        return;
      }
      if (kind === 'metadata') {
        await api.runPhase(project.id, 'metadata');
        await api.setGate(project.id, 'metadata', { status: 'APPROVED', notes: 'Metadata comercial generada y aceptada para paquete local.' });
        await refreshQuality('Metadata comercial lista');
        return;
      }
      if (kind === 'publishing') {
        await api.runPhase(project.id, 'publishing-checklist');
        await api.setGate(project.id, 'publishing', { status: 'APPROVED', notes: 'Declaracion de IA y checklist comercial generados.' });
        await refreshQuality('Declaración de IA y checklist listos');
        return;
      }
      if (kind === 'preview') {
        await api.setGate(project.id, 'preview', { status: 'APPROVED', notes: 'Vista previa local aprobada para continuar.' });
        await refreshQuality('Vista previa aprobada');
        navigate(`/projects/${project.id}/preview`);
        return;
      }
      if (kind === 'exports') {
        for (const format of ['md', 'docx', 'pdf', 'epub']) {
          await api.runPhase(project.id, `export/${format}`);
        }
        await api.setGate(project.id, 'export', { status: 'GENERATED', notes: 'Archivos base generados para paquete final.' });
        await refreshQuality('Archivos base generados');
        return;
      }
      if (kind === 'package') {
        await api.productionPackage(project.id);
        await refreshQuality('Paquete final KDP/Gumroad generado');
        return;
      }
      if (kind === 'backup') {
        await api.backupProject(project.id);
        await refresh();
        showToast('Backup creado', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al completar acción', 'error');
    } finally {
      setBusyAction('');
    }
  }

  async function completeAutomatically() {
    setBusyAction('auto');
    try {
      if (!quality) await api.quality(project.id);
      if (!project.marketResearch) {
        await api.runPhase(project.id, 'market-research', { userVerified: true });
      } else if (project.marketResearch.userVerified !== true) {
        await api.verifyMarketResearch(project.id);
      }
      if (!hasCommercialMetadata(project)) {
        await api.runPhase(project.id, 'metadata');
        await api.setGate(project.id, 'metadata', { status: 'APPROVED', notes: 'Metadata comercial generada automaticamente.' });
      }
      if (!hasPublishingChecklist(project)) {
        await api.runPhase(project.id, 'publishing-checklist');
        await api.setGate(project.id, 'publishing', { status: 'APPROVED', notes: 'Checklist y declaracion IA generados automaticamente.' });
      }
      if (gateStatus(project, 'preview') !== 'APPROVED') {
        await api.setGate(project.id, 'preview', { status: 'APPROVED', notes: 'Vista previa local aprobada por asistente de produccion.' });
      }
      if (!hasExportFormats(project, ['md', 'docx', 'pdf', 'epub'])) {
        for (const format of ['md', 'docx', 'pdf', 'epub']) {
          await api.runPhase(project.id, `export/${format}`);
        }
      }
      await api.productionPackage(project.id);
      await refreshQuality('Producción completada hasta paquete final');
    } catch (error) {
      await refresh();
      setReport(await api.quality(project.id).catch(() => null));
      showToast(error instanceof Error ? error.message : 'No se pudo completar todo automáticamente', 'error');
    } finally {
      setBusyAction('');
    }
  }

  return (
    <>
      <Header title="Preparación para publicar" project={project} eyebrow="Calidad y salida final" />
      <section className="productionHero">
        <div>
          <p className="eyebrow">Estado de producción</p>
          <h2>{pendingTasks.length === 0 ? 'Listo para publicar' : `Siguiente paso: ${primaryTask?.title}`}</h2>
          <p className="muted">
            {pendingTasks.length === 0
              ? 'El paquete editorial tiene los elementos principales aprobados.'
              : primaryTask?.description}
          </p>
        </div>
        <div className="readinessMeter" aria-label={`Preparación ${readinessPercent}%`}>
          <strong>{readinessPercent}%</strong>
          <span>{readyCount}/{productionTasks.length} pasos listos</span>
        </div>
      </section>

      <section className="nextActionPanel">
        <div>
          <p className="eyebrow">Acción recomendada</p>
          <h2>{primaryTask?.title || 'Generar paquete final'}</h2>
          <p className="muted">
            {primaryTask?.help || 'Todo está resuelto. Puedes crear un backup o revisar el paquete final.'}
          </p>
        </div>
        <div className="nextActionButtons">
          {primaryTask && (
            <button className="button primary" onClick={() => runQualityTask(primaryTask.kind)} disabled={!!busyAction}>
              {busyAction === primaryTask.kind && <span className="spinner" />}
              {primaryTask.cta}
            </button>
          )}
          <button className="button" onClick={completeAutomatically} disabled={!!busyAction}>
            {busyAction === 'auto' && <span className="spinner" />}
            Completar automáticamente
          </button>
        </div>
      </section>

      <div className="actions productionActions">
        <button className="button" onClick={runQuality} disabled={!!busyAction}>
          {busyAction === 'quality' && <span className="spinner" />}
          Recalcular calidad
        </button>
        <button className="button" onClick={() => runQualityTask('backup')} disabled={!!busyAction}>
          {busyAction === 'backup' && <span className="spinner" />}
          Crear backup
        </button>
        <button className="button" onClick={() => navigate(`/projects/${project.id}/preview`)} disabled={!!busyAction}>
          Abrir vista previa
        </button>
      </div>

      <section className="productionLayout">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h2>Pasos de publicación</h2>
              <p className="muted">Cada fila tiene una acción concreta. La app resuelve lo técnico detrás.</p>
            </div>
          </div>
          <div className="productionChecklist">
            {productionTasks.map((task) => (
              <article className={`productionTask ${task.status}`} key={task.kind}>
                <div className="taskStatusMark">{task.status === 'done' ? 'OK' : task.status === 'active' ? 'Ahora' : 'Pendiente'}</div>
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                </div>
                <button className="button" onClick={() => runQualityTask(task.kind)} disabled={!!busyAction || task.status === 'done'}>
                  {busyAction === task.kind && <span className="spinner" />}
                  {task.status === 'done' ? 'Listo' : task.cta}
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel productionSide">
          <h2>Resumen</h2>
          <div className="summaryStack">
            <div>
              <span>Estado lector</span>
              <strong>{String((quality?.manuscript as Record<string, unknown> | undefined)?.status || 'Pendiente')}</strong>
            </div>
            <div>
              <span>Bloqueadores reales</span>
              <strong>{blockers.length}</strong>
            </div>
            <div>
              <span>Archivos generados</span>
              <strong>{(project.formatBuilds || []).length + (project.exportPackages || []).length}</strong>
            </div>
          </div>
        </aside>
      </section>

      {blockers.length > 0 && (
        <section className="panel">
          <h2>Qué falta resolver</h2>
          <div className="plainIssueList">
            {blockers.slice(0, 6).map((blocker, index) => (
              <div key={`${blocker}-${index}`}>{humanizeBlocker(blocker)}</div>
            ))}
            {blockers.length > 6 && <div>{blockers.length - 6} puntos adicionales quedan en diagnóstico técnico.</div>}
          </div>
        </section>
      )}

      <section className="platformPreview">
        <PlatformCard title="KDP" data={(quality?.kdp as Record<string, unknown> | undefined)} enabled={hasCommercialMetadata(project) && hasPublishingChecklist(project)} />
        <PlatformCard title="Gumroad" data={(quality?.gumroad as Record<string, unknown> | undefined)} enabled={hasCommercialMetadata(project) && hasPublishingChecklist(project)} />
      </section>

      <section className="panel visualQualityPanel">
        <div className="panelHeader">
          <div>
            <h2>Calidad visual</h2>
            <p className="muted">Verifica que el ebook tenga maquetación, páginas, assets y ausencia de marcas IA/Markdown.</p>
          </div>
          <span className={`qualityBadge ${(quality?.visual as Record<string, unknown> | undefined)?.status === 'APPROVED' ? 'approved' : 'needs'}`}>
            {String((quality?.visual as Record<string, unknown> | undefined)?.status || 'PENDING')}
          </span>
        </div>
        <VisualQualityCard data={quality?.visual as Record<string, unknown> | undefined} />
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Detalle técnico</h2>
            <p className="muted">Gates, checks y JSON quedan aquí para diagnóstico avanzado.</p>
          </div>
        </div>
        <details className="technicalDetails">
          <summary>Ver diagnóstico completo</summary>
          <div className="statusGrid technicalGateGrid">
            {gateSummary.map((item) => (
              <div className={`statusTile ${item.status.toLowerCase()}`} key={item.label}>
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <DataPanel title="Reporte completo" data={quality || project.publicationReadiness} />
        </details>
      </section>
    </>
  );
}

function parseReadinessReport(readiness?: Record<string, unknown> | null) {
  const raw = readiness?.qualityReport;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type QualityTaskKind = 'run-quality' | 'verify-market' | 'metadata' | 'publishing' | 'preview' | 'exports' | 'package' | 'backup';

type ProductionTask = {
  kind: QualityTaskKind;
  title: string;
  description: string;
  help: string;
  cta: string;
  status: 'done' | 'active' | 'pending';
};

function gateStatus(project: Project, phase: string) {
  return (project.phaseGates || []).find((gate) => gate.phase === phase)?.approvalStatus || 'PENDING';
}

function hasCommercialMetadata(project: Project) {
  const metadata = project.metadataPackage || {};
  return Boolean(metadata.commercialTitle && metadata.subtitle && metadata.keywords && metadata.suggestedCategories && metadata.longDescription && metadata.recommendedPrice);
}

function hasPublishingChecklist(project: Project) {
  const checklist = project.publishingChecklist || {};
  return Boolean(checklist.aiDeclaration && checklist.copyrightStatus);
}

function hasExportFormats(project: Project, formats: string[]) {
  const existing = new Set((project.formatBuilds || []).map((build) => String(build.format).toLowerCase()));
  return formats.every((format) => existing.has(format));
}

function deriveProductionTasks(project: Project, quality: Record<string, unknown> | null): ProductionTask[] {
  const rawTasks: Omit<ProductionTask, 'status'>[] = [
    {
      kind: 'run-quality',
      title: 'Revisar estado actual',
      description: 'Calcular manuscrito, plataformas y gates con la información más reciente.',
      help: 'La app revisa el proyecto y detecta qué paso falta, sin que tengas que leer datos técnicos.',
      cta: 'Recalcular calidad',
    },
    {
      kind: 'verify-market',
      title: 'Confirmar mercado y nombre',
      description: 'Dejar validado que el nombre, idioma y mercado objetivo pueden usarse para avanzar.',
      help: 'Esto marca la investigación asistida como verificada y elimina el bloqueo de mercado.',
      cta: 'Confirmar mercado',
    },
    {
      kind: 'metadata',
      title: 'Generar ficha comercial',
      description: 'Crear subtítulo, descripción de venta, keywords, categorías y precio recomendado.',
      help: 'La app genera la metadata necesaria para KDP y Gumroad y aprueba ese paso localmente.',
      cta: 'Generar metadata',
    },
    {
      kind: 'publishing',
      title: 'Preparar declaración y checklist',
      description: 'Crear declaración de IA, notas de derechos, disclaimer y checklist de publicación.',
      help: 'La app deja lista la parte de cumplimiento editorial que luego viaja en el ZIP final.',
      cta: 'Preparar publicación',
    },
    {
      kind: 'preview',
      title: 'Aprobar vista previa',
      description: 'Confirmar que el ebook puede pasar a salida final después de la revisión visual local.',
      help: 'La app marca la vista previa como aprobada y te lleva a verla en pantalla.',
      cta: 'Aprobar y ver preview',
    },
    {
      kind: 'exports',
      title: 'Generar archivos base',
      description: 'Crear manuscrito master, PDF premium, EPUB reflowable y DOCX editable.',
      help: 'La app produce los formatos que necesitan KDP, Gumroad y revisión editorial.',
      cta: 'Generar archivos',
    },
    {
      kind: 'package',
      title: 'Crear paquete KDP/Gumroad',
      description: 'Armar el ZIP final con checklist, metadata, declaración IA, portada y reportes.',
      help: 'Cuando los pasos anteriores están listos, este botón crea el paquete final de venta.',
      cta: 'Crear paquete final',
    },
  ];

  const doneByKind: Record<QualityTaskKind, boolean> = {
    'run-quality': Boolean(quality),
    'verify-market': project.marketResearch?.userVerified === true && gateStatus(project, 'research') === 'APPROVED',
    metadata: hasCommercialMetadata(project) && gateStatus(project, 'metadata') === 'APPROVED',
    publishing: hasPublishingChecklist(project) && gateStatus(project, 'publishing') === 'APPROVED',
    preview: gateStatus(project, 'preview') === 'APPROVED',
    exports: hasExportFormats(project, ['md', 'docx', 'pdf', 'epub']),
    package: Boolean((project.exportPackages || []).length),
    backup: false,
  };
  let activeAssigned = false;
  return rawTasks.map((task) => {
    if (doneByKind[task.kind]) return { ...task, status: 'done' };
    if (!activeAssigned) {
      activeAssigned = true;
      return { ...task, status: 'active' };
    }
    return { ...task, status: 'pending' };
  });
}

function getQualityBlockers(quality: Record<string, unknown>, project: Project) {
  const gates = quality.gates as { blockers?: unknown } | undefined;
  const blockers = Array.isArray(gates?.blockers) ? gates.blockers.map(String) : [];
  const kdp = quality.kdp as { checks?: Record<string, boolean> } | undefined;
  const gumroad = quality.gumroad as { checks?: Record<string, boolean> } | undefined;
  const platformChecksAreActionable = hasCommercialMetadata(project) && hasPublishingChecklist(project);
  if (platformChecksAreActionable) {
    for (const [key, ok] of Object.entries(kdp?.checks || {})) {
      if (!ok) blockers.push(`KDP: falta ${formatQualityLabel(key)}.`);
    }
    for (const [key, ok] of Object.entries(gumroad?.checks || {})) {
      if (!ok) blockers.push(`Gumroad: falta ${formatQualityLabel(key)}.`);
    }
  }
  return Array.from(new Set(blockers));
}

function summarizeGates(gates: Project['phaseGates']) {
  const counts = new Map<string, number>();
  for (const gate of gates || []) counts.set(gate.status, (counts.get(gate.status) || 0) + 1);
  return ['APPROVED', 'GENERATED', 'PENDING', 'NEEDS_REVISION', 'BLOCKED']
    .map((status) => ({ status, label: status.replace('_', ' '), count: counts.get(status) || 0 }))
    .filter((item) => item.count > 0);
}

function formatQualityLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase();
}

function humanizeBlocker(blocker: string) {
  const normalized = blocker.toLowerCase();
  if (normalized.includes('mercado')) return 'Confirma la investigación de mercado para cerrar nombre, idioma y posicionamiento.';
  if (normalized.includes('metadata')) return 'Genera la ficha comercial: subtítulo, keywords, categorías, precio y descripción.';
  if (normalized.includes('declaracion') || normalized.includes('ai declaration')) return 'Prepara la declaración de IA y notas de derechos para publicación.';
  if (normalized.includes('preview')) return 'Aprueba la vista previa antes de crear el paquete final.';
  if (normalized.includes('publishing')) return 'Genera el checklist de publicación para KDP y Gumroad.';
  if (normalized.includes('epub')) return 'Genera el EPUB reflowable para KDP.';
  if (normalized.includes('pdf')) return 'Genera el PDF premium para Gumroad.';
  return blocker.replace('Gate no aprobado:', 'Paso pendiente:');
}

function PlatformCard({ title, data, enabled }: { title: string; data?: Record<string, unknown>; enabled: boolean }) {
  const checks = (data?.checks || {}) as Record<string, boolean>;
  const status = String(data?.status || 'PENDING');
  if (!enabled) {
    return (
      <div className="panel platformCard">
        <h2>{title}</h2>
        <p className="muted">Se validará después de generar metadata comercial y declaración de publicación.</p>
      </div>
    );
  }
  return (
    <div className="panel platformCard">
      <div className="panelHeader">
        <h2>{title}</h2>
        <span className={`qualityBadge ${status === 'APPROVED' ? 'approved' : 'needs'}`}>{status}</span>
      </div>
      <div className="checkList">
        {Object.entries(checks).length === 0 && <p className="muted">Recalcula calidad para ver checks.</p>}
        {Object.entries(checks).map(([key, ok]) => (
          <div className={`checkItem ${ok ? 'ok' : 'missing'}`} key={key}>
            <span>{ok ? 'OK' : 'Falta'}</span>
            <strong>{formatQualityLabel(key)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualQualityCard({ data }: { data?: Record<string, unknown> }) {
  const checks = (data?.checks || {}) as Record<string, boolean>;
  const issues = Array.isArray(data?.issues) ? data.issues.map(String) : [];
  return (
    <div className="visualQualityGrid">
      <div>
        <span>Score</span>
        <strong>{String(data?.score || '-')}</strong>
      </div>
      <div>
        <span>Páginas</span>
        <strong>{String(data?.pageCount || '-')}</strong>
      </div>
      <div>
        <span>Assets</span>
        <strong>{String(data?.assetCount || '-')}</strong>
      </div>
      {Object.entries(checks).map(([key, ok]) => (
        <div className={ok ? 'ok' : 'missing'} key={key}>
          <span>{formatQualityLabel(key)}</span>
          <strong>{ok ? 'OK' : 'Falta'}</strong>
        </div>
      ))}
      {issues.map((issue) => (
        <div className="missing" key={issue}>
          <span>Revisión</span>
          <strong>{issue}</strong>
        </div>
      ))}
    </div>
  );
}

export function ExportPage() {
  const { project, refresh, showToast } = useProjectContext();
  const [busy, setBusy] = useState('');
  async function run(format: string) {
    setBusy(format);
    try {
      await api.runPhase(project.id, format === 'zip' ? 'export/zip' : `export/${format}`);
      await refresh();
      showToast(`Formato ${format.toUpperCase()} generado`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al exportar', 'error');
    } finally {
      setBusy('');
    }
  }
  async function runProductionPackage() {
    setBusy('production');
    try {
      try {
        await api.productionPackage(project.id);
        showToast('Paquete de producción generado', 'success');
      } catch (error) {
        await api.productionPackage(project.id, { overrideReason: error instanceof Error ? error.message : 'Override local autorizado' });
        showToast('Paquete forzado con override', 'success');
      }
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error crítico en exportación', 'error');
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <Header title="Exportación" project={project} />
      <div className="actions">
        {['md', 'docx', 'pdf', 'epub', 'zip'].map((format) => (
          <button className="button primary" key={format} onClick={() => run(format)} disabled={!!busy}>
            {busy === format && <span className="spinner" />}
            {busy === format ? 'Generando...' : format.toUpperCase()}
          </button>
        ))}
        <button className="button primary" onClick={runProductionPackage} disabled={!!busy}>
          {busy === 'production' && <span className="spinner" />}
          {busy === 'production' ? 'Validando...' : 'Paquete final KDP/Gumroad'}
        </button>
      </div>
      <DataPanel title="Builds" data={{ formats: project.formatBuilds, packages: project.exportPackages }} />
    </>
  );
}

function Header({ title, project, eyebrow }: { title: string; project: Project; eyebrow?: string }) {
  const current = eyebrow || phases.find((phase) => phase.key === project.currentPhase)?.label || project.currentPhase;
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{current}</p>
        <h1>{title}</h1>
      </div>
      <Link className="button" to={`/projects/${project.id}`}>
        Overview
      </Link>
    </header>
  );
}
