import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api/client';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import {
  BlockEditorPage,
  BlocksPage,
  ChapterPlanPage,
  ExportPage,
  GoNoGoPage,
  IdeaPage,
  PhasePage,
  PreviewPage,
  ProjectOverview,
  ProjectShell,
  QualityPage,
  VisualDesignPage,
} from './pages/ProjectWorkspace';
import { Settings } from './pages/Settings';
import type { Project } from './types/domain';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setProjects(await api.projects());
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error cargando proyectos');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      {error && <div className="toast">{error}</div>}
      <Routes>
        <Route path="/" element={<Dashboard projects={projects} refresh={refresh} />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/projects/:id" element={<ProjectShell projects={projects} refresh={refresh} />}>
          <Route index element={<ProjectOverview />} />
          <Route path="idea" element={<IdeaPage />} />
          <Route path="research" element={<PhasePage phaseKey="research" />} />
          <Route path="languages" element={<PhasePage phaseKey="languages" />} />
          <Route path="go-nogo" element={<GoNoGoPage />} />
          <Route path="formula" element={<PhasePage phaseKey="formula" />} />
          <Route path="editorial-bible" element={<PhasePage phaseKey="editorial-bible" />} />
          <Route path="visual-bible" element={<PhasePage phaseKey="visual-bible" />} />
          <Route path="chapter-plan" element={<ChapterPlanPage />} />
          <Route path="blocks" element={<BlocksPage />} />
          <Route path="blocks/:blockId" element={<BlockEditorPage />} />
          <Route path="audit" element={<PhasePage phaseKey="audit" />} />
          <Route path="recovery" element={<PhasePage phaseKey="recovery" />} />
          <Route path="visual-design" element={<VisualDesignPage />} />
          <Route path="quality" element={<QualityPage />} />
          <Route path="preview" element={<PreviewPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="metadata" element={<PhasePage phaseKey="metadata" />} />
          <Route path="publishing" element={<PhasePage phaseKey="publishing" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
