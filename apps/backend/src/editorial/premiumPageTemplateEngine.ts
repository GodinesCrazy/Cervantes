import type { LayoutDocument } from './layoutEngine';

export class PremiumPageTemplateEngine {
  enhance(layout: LayoutDocument): LayoutDocument {
    const pages = layout.pages.map((page, index) => ({
      ...page,
      originalType: page.originalType || page.type,
      status: page.status || 'APPROVED',
      variant: page.variant ?? index % 3,
      qualityNote:
        page.qualityNote ||
        (page.type === 'reading-page'
          ? 'Página de lectura con jerarquía, capitular y ritmo editorial.'
          : 'Página crítica renderizada con plantilla premium.'),
    }));

    const hasSecondFigure = pages.some((page) => page.id === 'editorial-plate');
    if (!hasSecondFigure) {
      const insertAt = Math.min(6, pages.length - 2);
      pages.splice(insertAt, 0, {
        id: 'editorial-plate',
        type: 'figure-page',
        originalType: 'figure-page',
        title: 'Lámina editorial del método',
        subtitle: 'Síntesis visual para reforzar comprensión',
        content: ['Una lámina central ayuda a que el lector recuerde la promesa, el método y el resultado antes de continuar.'],
        assetRole: 'figure-map',
        status: 'APPROVED',
        variant: 1,
        qualityNote: 'Lámina visual agregada para evitar una experiencia excesivamente textual.',
      });
    }

    return { ...layout, pages };
  }
}
