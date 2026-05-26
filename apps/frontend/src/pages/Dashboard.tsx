import { Link } from 'react-router-dom';
import type { Project } from '../types/domain';

type Props = {
  projects: Project[];
};

export function Dashboard({ projects }: Props) {
  return (
    <main className="page standalone">
      <header className="topbar">
        <div>
          <p className="eyebrow">Fábrica editorial privada</p>
          <h1>Cervantes</h1>
        </div>
        <Link className="button primary" to="/projects/new">
          Nuevo proyecto
        </Link>
      </header>

      <section className="metricGrid">
        <div className="metric">
          <span>{projects.length}</span>
          <p>Proyectos</p>
        </div>
        <div className="metric">
          <span>{projects.filter((project) => project.goNoGoResult === 'GO').length}</span>
          <p>GO aprobados</p>
        </div>
        <div className="metric">
          <span>{projects.reduce((total, project) => total + (project.formatBuilds?.length || 0), 0)}</span>
          <p>Exportaciones</p>
        </div>
      </section>

      <section className="list">
        {projects.map((project) => (
          <Link className="projectRow" key={project.id} to={`/projects/${project.id}`}>
            <div>
              <strong>{project.name}</strong>
              <small>{project.idea?.rawIdea || 'Idea pendiente'}</small>
            </div>
            <span>{project.currentPhase}</span>
          </Link>
        ))}
        {projects.length === 0 && <p className="muted">Crea el primer proyecto para iniciar el pipeline editorial.</p>}
      </section>
    </main>
  );
}
