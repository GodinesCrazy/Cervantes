import { prisma } from '../prisma';
import { EditorialPageComposer, type PersistedPageState } from './pageComposer';
import type { LayoutPageType } from './layoutEngine';

function parseStates(value?: string | null): PersistedPageState[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as PersistedPageState[]) : [];
  } catch {
    return [];
  }
}

export class SelectiveRegenerationService {
  private readonly composer = new EditorialPageComposer();

  async latestLayout(projectId: number) {
    return prisma.editorialLayout.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }

  async pages(projectId: number) {
    const latest = await this.latestLayout(projectId);
    return parseStates(latest?.pageTemplates);
  }

  async approvePage(projectId: number, pageId: string) {
    return this.updatePage(projectId, pageId, (page) => ({
      ...page,
      status: 'APPROVED',
      qualityNote: 'Pagina aprobada para el PDF final.',
    }));
  }

  async regeneratePage(projectId: number, pageId: string) {
    return this.updatePage(projectId, pageId, (page) => ({
      ...page,
      status: 'PENDING',
      variant: (page.variant || 0) + 1,
      qualityNote: 'Nueva variante generada manteniendo el estilo global.',
    }));
  }

  async changeTemplate(projectId: number, pageId: string, template: LayoutPageType) {
    return this.updatePage(projectId, pageId, (page) => ({
      ...page,
      type: template,
      status: 'NEEDS_REVISION',
      qualityNote: 'Plantilla cambiada; revisar visualmente antes de aprobar.',
    }));
  }

  async setStyle(projectId: number, themeKey: string) {
    const latest = await this.latestLayout(projectId);
    if (!latest) throw new Error('Editorial layout not rendered yet');
    return prisma.editorialLayout.update({
      where: { id: latest.id },
      data: {
        activeStyle: themeKey,
        themeKey,
        status: 'NEEDS_REVISION',
      },
    });
  }

  private async updatePage(projectId: number, pageId: string, updater: (page: PersistedPageState) => PersistedPageState) {
    const latest = await this.latestLayout(projectId);
    if (!latest) throw new Error('Editorial layout not rendered yet');
    const pages = parseStates(latest.pageTemplates);
    const nextPages = pages.map((page) => (page.id === pageId ? updater(page) : page));
    if (!nextPages.some((page) => page.id === pageId)) throw new Error('Layout page not found');
    const approvals = Object.fromEntries(nextPages.map((page) => [page.id, page.status]));
    const status = nextPages.some((page) => page.status !== 'APPROVED') ? 'NEEDS_REVISION' : 'APPROVED';
    return prisma.editorialLayout.update({
      where: { id: latest.id },
      data: {
        pageTemplates: JSON.stringify(nextPages),
        pageApprovals: JSON.stringify(approvals),
        status,
      },
    });
  }

  composeStatesFromPages(pages: Parameters<EditorialPageComposer['summarize']>[0]) {
    return this.composer.summarize(pages);
  }
}
