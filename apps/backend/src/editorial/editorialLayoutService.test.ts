import { describe, expect, it } from 'vitest';
import { EditorialHtmlRenderer } from './htmlRenderer';
import { EditorialLayoutEngine } from './layoutEngine';
import { EditorialThemeEngine } from './themeEngine';
import { VisualQualityInspector } from './visualQualityInspector';

const theme = EditorialThemeEngine.defaultTheme();

describe('editorial visual layout engine', () => {
  it('builds required premium page templates', () => {
    const layout = new EditorialLayoutEngine().build(
      {
        id: 1,
        name: 'Guia premium',
        metadataPackage: { commercialTitle: 'Guia premium', subtitle: 'Metodo visual' },
        chapterPlans: [
          { chapterNumber: 1, title: 'Inicio', summary: 'Primer paso', order: 1 },
          { chapterNumber: 2, title: 'Aplicacion', summary: 'Segundo paso', order: 2 },
        ],
        manuscriptBlocks: [
          { blockTitle: 'Inicio', order: 1, content: '# Inicio\n\nTexto editorial con profundidad suficiente para una pagina premium.' },
          { blockTitle: 'Aplicacion', order: 2, content: '# Aplicacion\n\nTexto editorial con checklist y acciones concretas.' },
        ],
      },
      theme,
      '# Guia premium',
    );
    expect(layout.pages.map((page) => page.type)).toEqual(expect.arrayContaining(['cover', 'title', 'toc', 'chapter-opener', 'reading-page', 'figure-page', 'worksheet', 'appendix', 'credits']));
  });

  it('renders premium html without visible markdown markers', () => {
    const layout = new EditorialLayoutEngine().build(
      {
        id: 1,
        name: 'Guia premium',
        manuscriptBlocks: [{ blockTitle: 'Inicio', order: 1, content: '# Inicio\n\n**Texto** editorial sin marcas visibles.' }],
        chapterPlans: [{ chapterNumber: 1, title: 'Inicio', summary: 'Primer paso', order: 1 }],
      },
      theme,
      '# Guia premium',
    );
    layout.assets = { cover: 'cover.svg', 'figure-map': 'figure-map.svg', worksheet: 'worksheet.svg', mockup: 'mockup.svg', icons: 'icons.svg', separator: 'separator.svg', 'chapter-opener': 'chapter-opener.svg' };
    const html = new EditorialHtmlRenderer().render(layout);
    expect(html).toContain('book-page');
    expect(html).not.toContain('**');
    expect(html).not.toContain('![');
  });

  it('detects poor visual output', async () => {
    const report = await new VisualQualityInspector().inspect(
      { projectId: 1, title: 'x', subtitle: 'x', theme, pages: [], assets: {}, markdown: '' },
      '<html><body>**raw**</body></html>',
    );
    expect(report.status).toBe('NEEDS_REVISION');
    expect(report.checks.noRawMarkdown).toBe(false);
  });
});
