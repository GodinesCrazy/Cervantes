import type { Project } from '../types/domain';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

export const api = {
  projects: () => request<Project[]>('/api/projects'),
  project: (id: string | number) => request<Project>(`/api/projects/${id}`),
  createProject: (data: { name: string; rawIdea: string; topic?: string; audience?: string; tone?: string }) =>
    request<Project>('/api/projects', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }),
  saveIdea: (id: number, data: Record<string, unknown>) =>
    request<Project>(`/api/projects/${id}/idea`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }),
  saveClarifications: (id: number, answers: { id: number; answer: string }[]) =>
    request<Project>(`/api/projects/${id}/clarifications`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ answers }),
    }),
  runPhase: (id: number, endpoint: string, data: Record<string, unknown> = {}) =>
    request<Project>(`/api/projects/${id}/${endpoint}`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  updateBlock: (projectId: number, blockId: number, data: Record<string, unknown>) =>
    request<Project>(`/api/projects/${projectId}/blocks/${blockId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  quality: (id: number) => request<Record<string, unknown>>(`/api/projects/${id}/quality`),
  renderLayout: (id: number) =>
    request<Record<string, unknown>>(`/api/projects/${id}/layout/render`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    }),
  layoutReport: (id: number) => request<Record<string, unknown>>(`/api/projects/${id}/layout/report`),
  layoutStyles: (id: number) => request<{ styles: any[] }>(`/api/projects/${id}/layout/styles`),
  layoutPages: (id: number) => request<{ pages: any[] }>(`/api/projects/${id}/layout/pages`),
  layoutRegeneratePage: (id: number, pageId: string) => 
    request<Record<string, unknown>>(`/api/projects/${id}/layout/pages/${pageId}/regenerate`, { method: 'POST', headers: jsonHeaders }),
  layoutApprovePage: (id: number, pageId: string) => 
    request<Record<string, unknown>>(`/api/projects/${id}/layout/pages/${pageId}/approve`, { method: 'POST', headers: jsonHeaders }),
  layoutChangeTemplate: (id: number, pageId: string, template: string) => 
    request<Record<string, unknown>>(`/api/projects/${id}/layout/pages/${pageId}/template`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ template }),
    }),
  artDirectionReport: (id: number) => request<Record<string, unknown>>(`/api/projects/${id}/art-direction/report`),
  applyArtDirection: (id: number, styleKey?: string) =>
    request<Record<string, unknown>>(`/api/projects/${id}/art-direction/apply`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ styleKey }),
    }),
  setGate: (id: number, phase: string, data: Record<string, unknown>) =>
    request<Project>(`/api/projects/${id}/gates/${phase}`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  sourceNote: (id: number, data: Record<string, unknown>) =>
    request<Project>(`/api/projects/${id}/source-notes`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  verifyMarketResearch: (id: number) =>
    request<Project>(`/api/projects/${id}/market-research/verify`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    }),
  approveAsset: (projectId: number, assetId: number, data: Record<string, unknown>) =>
    request<Project>(`/api/projects/${projectId}/visual-assets/${assetId}`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  regenerateAsset: (projectId: number, assetId: number) =>
    request<Project>(`/api/projects/${projectId}/visual-assets/${assetId}/regenerate`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    }),
  productionPackage: (id: number, data: Record<string, unknown> = {}) =>
    request<Project>(`/api/projects/${id}/production-package`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    }),
  backupProject: (id: number) => request<Project>(`/api/projects/${id}/backup`, { method: 'POST', headers: jsonHeaders }),
  settingsStatus: () => request<Record<string, unknown>>('/api/settings/status'),
  backupWorkspace: () => request<Record<string, unknown>>('/api/settings/backup', { method: 'POST', headers: jsonHeaders }),
};
