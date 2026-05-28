import { NavLink } from 'react-router-dom';
import type { PhaseGate } from '../types/domain';

export const phases = [
  { key: 'idea', label: 'Idea', path: 'idea' },
  { key: 'research', label: 'Investigación', path: 'research' },
  { key: 'languages', label: 'Idiomas', path: 'languages' },
  { key: 'go-nogo', label: 'GO/NO-GO', path: 'go-nogo' },
  { key: 'formula', label: 'Fórmula', path: 'formula' },
  { key: 'editorial-bible', label: 'Biblia editorial', path: 'editorial-bible' },
  { key: 'visual-bible', label: 'Biblia visual', path: 'visual-bible' },
  { key: 'chapter-plan', label: 'Índice', path: 'chapter-plan' },
  { key: 'blocks', label: 'Bloques', path: 'blocks' },
  { key: 'audit', label: 'Auditoría', path: 'audit' },
  { key: 'recovery', label: 'Recuperación', path: 'recovery' },
  { key: 'visual-design', label: 'Diseño visual', path: 'visual-design', gateKey: 'visual-assets' },
  { key: 'quality', label: 'Quality gates', path: 'quality' },
  { key: 'preview', label: 'Vista previa', path: 'preview' },
  { key: 'export', label: 'Exportación', path: 'export' },
  { key: 'metadata', label: 'Metadata', path: 'metadata' },
  { key: 'publishing', label: 'Publicación', path: 'publishing' },
];

type Props = {
  projectId: number;
  currentPhase: string;
  phaseGates?: PhaseGate[];
};

export function Progress({ projectId, currentPhase, phaseGates = [] }: Props) {
  const index = Math.max(0, phases.findIndex((phase) => phase.key === currentPhase));
  const gateByPhase = new Map(phaseGates.map((gate) => [gate.phase, gate.status]));
  const progressUnits = phases.reduce((total, phase) => {
    const status = gateByPhase.get(phase.gateKey || phase.key);
    if (status === 'APPROVED') return total + 1;
    if (status === 'GENERATED') return total + 0.45;
    return total;
  }, 0);
  const percent = Math.round((progressUnits / phases.length) * 100);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brandMark">C</span>
        <div>
          <strong>Cervantes</strong>
          <small>{percent}% pipeline</small>
        </div>
      </div>
      <div className="progressTrack">
        <span style={{ width: `${percent}%` }} />
      </div>
      <nav className="phaseNav">
        {phases.map((phase, phaseIndex) => {
          const gateStatus = gateByPhase.get(phase.gateKey || phase.key);
          const fallbackDone = !gateStatus && phaseIndex <= index;
          const statusLabel = gateStatus === 'APPROVED'
            ? 'Aprobada'
            : gateStatus === 'GENERATED'
              ? 'Generada'
              : gateStatus === 'NEEDS_REVISION'
                ? 'Revisar'
                : gateStatus === 'BLOCKED'
                  ? 'Bloqueada'
                  : 'Pendiente';
          return (
            <NavLink
              key={phase.key}
              to={`/projects/${projectId}/${phase.path}`}
              title={`${phase.label}: ${statusLabel}`}
              className={({ isActive }) =>
                [
                  isActive ? 'active' : '',
                  gateStatus === 'APPROVED' || fallbackDone ? 'done' : '',
                  gateStatus === 'GENERATED' ? 'generated' : '',
                  gateStatus === 'NEEDS_REVISION' || gateStatus === 'BLOCKED' ? 'blocked' : '',
                ].filter(Boolean).join(' ')
              }
            >
              <span className="phaseNumber">{phaseIndex + 1}</span>
              <span className="phaseText">
                {phase.label}
                <small>{statusLabel}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
