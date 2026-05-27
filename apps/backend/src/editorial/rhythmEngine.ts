import type { LayoutDocument, LayoutPage } from './layoutEngine';
import { countWords } from './layoutEngine';

export type EditorialRhythmReport = {
  status: 'APPROVED' | 'NEEDS_REVISION';
  score: number;
  pageCount: number;
  targetRange: { min: number; max: number };
  repeatedRuns: number;
  sparsePages: number;
  densePages: number;
  mechanicalTitles: number;
  missingChapterClosures: number[];
  actions: string[];
  checks: Record<string, boolean>;
};

const criticalSparseAllowed = new Set(['cover', 'title', 'toc', 'chapter-opener', 'figure-page', 'worksheet', 'practice-lab', 'appendix', 'credits']);
const mechanicalTitle = /\/\s*continuaci[oó]n|continuacion|continuación/i;

function targetRangeFor(words: number) {
  if (words >= 20000 && words <= 30000) return { min: 70, max: 95 };
  const min = Math.max(36, Math.round(words / 390));
  const max = Math.max(min + 10, Math.round(words / 280));
  return { min, max };
}

function densityFor(words: number): LayoutPage['density'] {
  if (words < 120) return 'sparse';
  if (words > 620) return 'dense';
  return 'balanced';
}

function normalizeCopy(value: string) {
  return value
    .replace(/\bIndice\b/g, 'Índice')
    .replace(/\bCapitulo\b/g, 'Capítulo')
    .replace(/\bAplicacion\b/g, 'Aplicación')
    .replace(/\bCreditos\b/g, 'Créditos')
    .replace(/\bcontinuacion\b/gi, 'continuación')
    .replace(/\baccion\b/gi, 'acción')
    .replace(/\bSenal\b/g, 'Señal')
    .replace(/\bDecision\b/g, 'Decisión')
    .replace(/\bRevision\b/g, 'Revisión')
    .replace(/\bmetodo\b/gi, 'método');
}

function repeatedTemplateRuns(pages: LayoutPage[]) {
  let repeated = 0;
  let currentType = '';
  let run = 0;
  for (const page of pages) {
    if (page.type === currentType) {
      run += 1;
    } else {
      currentType = page.type;
      run = 1;
    }
    if (run > 2) repeated += 1;
  }
  return repeated;
}

export class EditorialRhythmEngine {
  apply(layout: LayoutDocument): { layout: LayoutDocument; report: EditorialRhythmReport } {
    const normalizedPages = layout.pages.map((page, index) => {
      const wordCount = countWords(page.content);
      const rhythmRole = page.rhythmRole || page.sectionLabel || page.type;
      return {
        ...page,
        title: normalizeCopy(mechanicalTitle.test(page.title) ? `Lectura editorial ${index + 1}` : page.title),
        subtitle: page.subtitle ? normalizeCopy(page.subtitle) : page.subtitle,
        content: page.content.map(normalizeCopy),
        wordCount,
        density: densityFor(wordCount),
        rhythmRole,
        rhythmStatus: densityFor(wordCount) === 'balanced' || criticalSparseAllowed.has(page.type) ? 'APPROVED' : 'NEEDS_REVISION',
        qualityNote: page.qualityNote || 'Página ajustada por el editor de ritmo editorial.',
      } satisfies LayoutPage;
    });

    const totalWords = normalizedPages.reduce((sum, page) => sum + (page.wordCount || 0), 0);
    const targetRange = targetRangeFor(totalWords);
    const sparsePages = normalizedPages.filter((page) => page.density === 'sparse' && !criticalSparseAllowed.has(page.type)).length;
    const densePages = normalizedPages.filter((page) => page.density === 'dense').length;
    const repeatedRuns = repeatedTemplateRuns(normalizedPages);
    const mechanicalTitles = normalizedPages.filter((page) => mechanicalTitle.test(page.title)).length;
    const chapters = Array.from(new Set(normalizedPages.map((page) => page.chapterNumber).filter((chapter): chapter is number => typeof chapter === 'number')));
    const missingChapterClosures = chapters.filter((chapter) => !normalizedPages.some((page) => page.chapterNumber === chapter && ['chapter-summary', 'case-study', 'comparison-table', 'practice-lab'].includes(page.type)));
    const checks = {
      pageCountReasonable: normalizedPages.length >= targetRange.min && normalizedPages.length <= targetRange.max,
      noLongRepeats: repeatedRuns === 0,
      noSparseReadingPages: sparsePages === 0,
      noDensePages: densePages === 0,
      noMechanicalTitles: mechanicalTitles === 0,
      chapterClosuresPresent: missingChapterClosures.length === 0,
      premiumPageRolesPresent: ['case-study', 'comparison-table', 'chapter-summary'].every((type) => normalizedPages.some((page) => page.type === type)),
    };
    const actions: string[] = [];
    if (!checks.pageCountReasonable) actions.push('Compactar o expandir páginas de lectura hasta el rango editorial recomendado.');
    if (!checks.noLongRepeats) actions.push('Alternar plantillas para evitar más de dos páginas iguales seguidas.');
    if (!checks.noSparseReadingPages) actions.push('Fusionar páginas de lectura con poco contenido.');
    if (!checks.noDensePages) actions.push('Dividir páginas sobrecargadas o convertirlas en tabla/caso.');
    if (!checks.noMechanicalTitles) actions.push('Corregir títulos mecánicos de continuación.');
    if (!checks.chapterClosuresPresent) actions.push(`Agregar cierre accionable a capítulos: ${missingChapterClosures.join(', ')}.`);
    if (!checks.premiumPageRolesPresent) actions.push('Insertar casos, tablas y cierres por capítulo.');
    const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
    const report: EditorialRhythmReport = {
      status: score >= 80 ? 'APPROVED' : 'NEEDS_REVISION',
      score,
      pageCount: normalizedPages.length,
      targetRange,
      repeatedRuns,
      sparsePages,
      densePages,
      mechanicalTitles,
      missingChapterClosures,
      actions: actions.length ? actions : ['Ritmo editorial aprobado.'],
      checks,
    };
    return { layout: { ...layout, pages: normalizedPages }, report };
  }
}
