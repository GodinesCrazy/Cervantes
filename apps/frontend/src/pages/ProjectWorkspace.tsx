import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { DataPanel } from '../components/DataPanel';
import { Progress, phases } from '../components/Progress';
import type { ManuscriptBlock, Project, VisualAsset } from '../types/domain';

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
      setLoadedProject(await api.project(projectId));
    }
  }

  useEffect(() => {
    let active = true;
    if (Number.isFinite(projectId)) {
      api.project(projectId)
        .then((freshProject) => {
          if (active) setLoadedProject(freshProject);
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
        <Outlet context={{ project, refresh: refreshProject, showToast }} />
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

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.saveIdea(project.id, { rawIdea, topic: project.name });
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
        <label>
          Idea base
          <textarea rows={7} value={rawIdea} onChange={(event) => setRawIdea(event.target.value)} />
        </label>
        <button className="button primary" disabled={busy}>
          {busy && <span className="spinner" />}
          Generar preguntas
        </button>
      </form>
      <section className="panel">
        <h2>Preguntas inteligentes</h2>
        {(project.clarifications || []).length === 0 && (
          <p className="muted">Haz clic en Generar preguntas para crear el cuestionario editorial inicial.</p>
        )}
        {(project.clarifications || []).map((question) => (
          <label key={question.id}>
            {question.question}
            <input
              defaultValue={question.answer || ''}
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

  return (
    <>
      <Header title={config.title} project={project} />
      {phaseKey === 'research' && (
        <p className="muted">Esta fase propone el nombre comercial después de evaluar audiencia, promesa y posicionamiento.</p>
      )}
      <button className="button primary" onClick={run} disabled={busy}>
        {busy && <span className="spinner" />}
        {busy ? 'Procesando...' : config.cta}
      </button>
      <div className="actions">
        {phaseKey === 'research' && (
          <button className="button" onClick={verifyResearch} disabled={busy}>
            Marcar research verificado
          </button>
        )}
        <button className="button" onClick={approve} disabled={busy}>
          Aprobar gate
        </button>
      </div>

      {project[config.panel] && (project.phaseGates || []).find((g) => g.phase === phaseKey)?.status !== 'APPROVED' && (
        <div className="nextStepBanner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div>
            Generación exitosa. Revisa los resultados y haz clic en <strong>"Aprobar gate"</strong> arriba para avanzar.
          </div>
        </div>
      )}

      <DataPanel title="Resultado" data={project[config.panel]} />
    </>
  );
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
        <label>
          Score de oportunidad
          <input type="number" min={0} max={100} value={score} onChange={(event) => setScore(Number(event.target.value))} />
        </label>
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
          <button className="button" onClick={() => navigate(`/projects/${project.id}/blocks`)}>
            Continuar a Bloques
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

  async function run() {
    setBusy(true);
    try {
      await api.runPhase(project.id, 'blocks');
      await refresh();
      showToast('Bloques generados', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al generar', 'error');
    } finally {
      setBusy(false);
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
          <button className="button" onClick={() => navigate(`/projects/${project.id}/audit`)}>
            Continuar a Auditoría
          </button>
        )}
      </div>
      <section className="list">
        {(project.manuscriptBlocks || []).length === 0 && (
          <p className="muted">Aún no hay bloques creados. Haz clic en "Crear bloques desde índice" para generar el esqueleto de tu libro.</p>
        )}
        {(project.manuscriptBlocks || []).map((block) => (
          <button className="projectRow clickable" key={block.id} onClick={() => navigate(`/projects/${project.id}/blocks/${block.id}`)}>
            <div>
              <strong>{block.blockTitle}</strong>
              <small>{block.wordCount || 0} palabras</small>
            </div>
            <span>{block.status}</span>
          </button>
        ))}
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

  return (
    <>
      <Header title="Diseño visual" project={project} eyebrow="Diseño visual" />
      <DataPanel title="Biblia visual y prompts" data={project.visualBible} />
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
          {allAssetsApproved && (
            <button className="button primary" onClick={() => navigate(`/projects/${project.id}/quality`)} type="button">
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
        <div className="list">
          {(project.visualAssets || []).length === 0 && (
            <p className="muted">Aún no hay assets. Genera la biblia visual y los bloques para crear prompts, placeholders y aprobaciones.</p>
          )}
          {(project.visualAssets || []).map((asset) => (
            <article className="assetCard" key={asset.id}>
              <button className="assetPreviewButton" onClick={() => setExpandedAsset(asset)} type="button">
                <VisualAssetPreview projectId={project.id} asset={asset} cacheKey={project.updatedAt} />
                <span>Ampliar</span>
              </button>
              <div className="assetMeta">
                <div>
                  <strong>{asset.name}</strong>
                  <small>{visualAssetSummary(asset)}</small>
                </div>
                <p>{cleanPrompt(asset.prompt)}</p>
                <span className={`assetState ${approvedIds.has(asset.id) ? 'approved' : 'pending'}`}>
                  {approvedIds.has(asset.id) ? 'Aprobado para exportación' : 'Pendiente de aprobación visual'}
                </span>
              </div>
              <div className="assetActions">
                <button className="button" onClick={() => regenerateAsset(asset.id)} disabled={regeneratingId === asset.id || busyId === asset.id}>
                  {regeneratingId === asset.id && <span className="spinner" />}
                  Otra opción
                </button>
                <button className="button" onClick={() => approveAsset(asset.id)} disabled={busyId === asset.id || approvedIds.has(asset.id) || regeneratingId === asset.id}>
                  {busyId === asset.id && <span className="spinner" />}
                  {approvedIds.has(asset.id) ? 'Aprobado' : 'Aprobar'}
                </button>
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
  if (asset.assetType === 'cover') {
    return (
      <div className={`assetPreview image ${large ? 'large' : ''}`}>
        <object data={previewSrc} type="image/svg+xml" aria-label="Portada frontal final actual">
          <img src={previewSrc} alt="Portada frontal final actual" />
        </object>
      </div>
    );
  }
  if (asset.assetType === 'figure') {
    return (
      <div className={`assetPreview image ${large ? 'large' : ''}`}>
        <object data={previewSrc} type="image/svg+xml" aria-label="Mapa conceptual final actual">
          <FigureFallback />
        </object>
      </div>
    );
  }
  if (asset.assetType === 'mockup' || asset.assetType === 'worksheet') {
    return (
      <div className={`assetPreview image ${large ? 'large' : ''}`}>
        <object data={previewSrc} type="image/svg+xml" aria-label={`${asset.name} final actual`}>
          {asset.assetType === 'mockup' ? <MockupFallback /> : <WorksheetFallback />}
        </object>
      </div>
    );
  }
  return (
    <div className={`assetPreview image ${large ? 'large' : ''}`}>
      <WorksheetFallback />
    </div>
  );
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
  const [zoom, setZoom] = useState(100);

  async function regenerateLayout() {
    setBusy(true);
    try {
      const result = await api.renderLayout(project.id);
      setLayoutReport((result.report as Record<string, unknown>) || result);
      showToast('Maquetación editorial regenerada', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al regenerar layout', 'error');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    api.layoutReport(project.id).then(setLayoutReport).catch(() => setLayoutReport(null));
  }, [project.id]);

  return (
    <>
      <Header title="Vista previa del ebook" project={project} />
      <div className="previewToolbar">
        <div className="tabs">
          <button className={mode === 'pdf' ? 'active' : ''} onClick={() => setMode('pdf')}>PDF Preview</button>
          <button className={mode === 'epub' ? 'active' : ''} onClick={() => setMode('epub')}>EPUB/Reflow Preview</button>
          <button className={mode === 'package' ? 'active' : ''} onClick={() => setMode('package')}>Publishing Package</button>
        </div>
        <a className="button primary" href={`/api/projects/${project.id}/preview.pdf`}>
          Descargar preview PDF
        </a>
        <button className="button" onClick={regenerateLayout} disabled={busy}>
          {busy && <span className="spinner" />}
          Regenerar maquetación
        </button>
      </div>
      <section className="previewStatus">
        <div>
          <span>Calidad visual</span>
          <strong>{String(layoutReport?.status || 'Pendiente')}</strong>
        </div>
        <div>
          <span>Páginas</span>
          <strong>{String(layoutReport?.pageCount || '-')}</strong>
        </div>
        <div>
          <span>Assets</span>
          <strong>{String(layoutReport?.assetCount || '-')}</strong>
        </div>
        <label>
          Zoom
          <input type="range" min={70} max={130} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
      </section>
      {mode !== 'package' ? (
        <section className={mode === 'epub' ? 'previewShell reflow' : 'previewShell'} style={{ ['--preview-zoom' as string]: `${zoom}%` }}>
          <iframe title={`Vista previa de ${project.name}`} src={`/api/projects/${project.id}/preview`} />
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
  return (project.phaseGates || []).find((gate) => gate.phase === phase)?.status || 'PENDING';
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
