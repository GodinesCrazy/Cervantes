import type { LayoutPage, LayoutPageType } from './layoutEngine';

export const pageTemplateLabels: Record<LayoutPageType, string> = {
  cover: 'Portada',
  title: 'Portadilla',
  toc: 'Indice visual',
  'chapter-opener': 'Apertura de capitulo',
  'reading-page': 'Pagina de lectura',
  'figure-page': 'Lamina o figura',
  worksheet: 'Worksheet',
  appendix: 'Checklist / apendice',
  credits: 'Creditos',
};

export type PersistedPageState = {
  id: string;
  type: LayoutPageType;
  originalType?: LayoutPageType;
  title: string;
  subtitle?: string;
  assetRole?: string;
  chapterNumber?: number;
  status: 'PENDING' | 'NEEDS_REVISION' | 'APPROVED';
  variant: number;
  qualityNote?: string;
};

export class EditorialPageComposer {
  toState(page: LayoutPage): PersistedPageState {
    return {
      id: page.id,
      type: page.type,
      originalType: page.originalType || page.type,
      title: page.title,
      subtitle: page.subtitle,
      assetRole: page.assetRole,
      chapterNumber: page.chapterNumber,
      status: page.status || 'PENDING',
      variant: page.variant || 0,
      qualityNote: page.qualityNote || 'Pendiente de aprobacion editorial visual.',
    };
  }

  merge(basePages: LayoutPage[], states: PersistedPageState[]) {
    const stateById = new Map(states.map((state) => [state.id, state]));
    return basePages.map((page) => {
      const state = stateById.get(page.id);
      if (!state) return { ...page, originalType: page.type, status: page.status || 'PENDING', variant: page.variant || 0 };
      return {
        ...page,
        type: state.type,
        originalType: state.originalType || page.type,
        status: page.status || state.status,
        variant: state.variant,
        qualityNote: page.qualityNote || state.qualityNote,
      };
    });
  }

  summarize(pages: LayoutPage[]) {
    return pages.map((page, index) => ({
      ...this.toState(page),
      number: index + 1,
      label: pageTemplateLabels[page.type],
      words: page.content.join(' ').split(/\s+/).filter(Boolean).length,
      critical: ['cover', 'title', 'toc', 'chapter-opener', 'figure-page', 'worksheet', 'appendix', 'credits'].includes(page.type),
    }));
  }
}
