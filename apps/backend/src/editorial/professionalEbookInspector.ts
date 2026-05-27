import fs from 'node:fs/promises';
import type { LayoutDocument } from './layoutEngine';

export type ProfessionalEbookReport = {
  status: 'APPROVED' | 'NEEDS_REVISION';
  score: number;
  checks: Record<string, boolean>;
  issues: string[];
  actions: string[];
};

async function sizeOf(filePath?: string) {
  if (!filePath) return 0;
  try {
    return (await fs.stat(filePath)).size;
  } catch {
    return 0;
  }
}

export class ProfessionalEbookInspector {
  async inspect(layout: LayoutDocument, html: string): Promise<ProfessionalEbookReport> {
    const coverSize = await sizeOf(layout.assets.cover);
    const figureSize = await sizeOf(layout.assets['figure-map']);
    const worksheetSize = await sizeOf(layout.assets.worksheet);
    const readingPages = layout.pages.filter((page) => ['reading-page', 'reading-spread'].includes(page.type));
    const textHeavyPages = readingPages.filter((page) => page.content.join(' ').split(/\s+/).length > 620);
    const emptyPages = layout.pages.filter((page) => !['cover', 'chapter-opener'].includes(page.type) && page.content.join('').trim().length < 18);
    const pageTypes = new Set(layout.pages.map((page) => page.type));
    const markdownLeak = /\*\*|!\[|lorem ipsum|pendiente de redacci[oó]n|como modelo de ia/i.test(html);
    const hasTexture = html.includes('professional-layout') || html.includes('data-professional="true"');
    const approvedCriticalPages = layout.pages
      .filter((page) => ['cover', 'title', 'toc', 'chapter-opener', 'figure-page', 'worksheet', 'appendix', 'credits'].includes(page.type))
      .every((page) => page.status === 'APPROVED');
    const checks = {
      artDirectionApplied: Boolean(layout.theme.key && layout.theme.key !== 'basic'),
      professionalPageVariety: ['cover', 'title', 'toc', 'chapter-opener', 'reading-page', 'figure-page', 'worksheet', 'appendix', 'credits'].every((type) => pageTypes.has(type as never)),
      coverNotBasic: coverSize > 4500,
      editorialAssetsRich: figureSize > 3500 && worksheetSize > 2500,
      noTextHeavyPages: textHeavyPages.length === 0,
      noEmptyPages: emptyPages.length === 0,
      noMarkdownOrAiLeak: !markdownLeak,
      approvedCriticalPages,
      premiumHtmlShell: hasTexture,
      editorialRhythmApplied: ['case-study', 'comparison-table', 'chapter-summary'].every((type) => pageTypes.has(type as never)),
      noMechanicalContinuationTitles: !layout.pages.some((page) => /\/\s*continuaci[oó]n|continuacion/i.test(page.title)),
    };
    const issues: string[] = [];
    if (!checks.artDirectionApplied) issues.push('Falta dirección de arte aplicada.');
    if (!checks.professionalPageVariety) issues.push('Faltan plantillas editoriales premium.');
    if (!checks.coverNotBasic) issues.push('La portada se ve demasiado básica.');
    if (!checks.editorialAssetsRich) issues.push('Los assets visuales aún parecen diagramas simples.');
    if (!checks.noTextHeavyPages) issues.push('Hay páginas con demasiado texto corrido.');
    if (!checks.noEmptyPages) issues.push('Hay páginas demasiado vacías.');
    if (!checks.noMarkdownOrAiLeak) issues.push('Hay Markdown, placeholders o tono IA visible.');
    if (!checks.approvedCriticalPages) issues.push('Hay páginas críticas sin aprobación.');
    if (!checks.premiumHtmlShell) issues.push('El HTML no declara shell profesional premium.');
    if (!checks.editorialRhythmApplied) issues.push('Falta ritmo editorial: casos, tablas o cierres accionables.');
    if (!checks.noMechanicalContinuationTitles) issues.push('Hay títulos mecánicos de continuación.');
    const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
    return {
      status: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
      score,
      checks,
      issues,
      actions: issues.length
        ? [
            'Regenerar maquetación con dirección de arte profesional.',
            'Reescribir capítulos o páginas con exceso de texto.',
            'Aprobar páginas críticas antes de exportar paquete final.',
          ]
        : ['Ebook aprobado con estándar editorial profesional local.'],
    };
  }
}
