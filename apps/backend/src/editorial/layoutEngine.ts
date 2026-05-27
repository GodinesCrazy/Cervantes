import type { EditorialTheme } from './themeEngine';

export type LayoutPageType =
  | 'cover'
  | 'title'
  | 'toc'
  | 'chapter-opener'
  | 'reading-page'
  | 'reading-spread'
  | 'figure-page'
  | 'case-study'
  | 'key-takeaways'
  | 'comparison-table'
  | 'practice-lab'
  | 'chapter-summary'
  | 'worksheet'
  | 'appendix'
  | 'credits';

export type LayoutPage = {
  id: string;
  type: LayoutPageType;
  originalType?: LayoutPageType;
  title: string;
  subtitle?: string;
  content: string[];
  assetRole?: string;
  chapterNumber?: number;
  status?: 'PENDING' | 'NEEDS_REVISION' | 'APPROVED';
  variant?: number;
  qualityNote?: string;
  rhythmRole?: string;
  wordCount?: number;
  density?: 'sparse' | 'balanced' | 'dense';
  sectionLabel?: string;
  rhythmStatus?: 'APPROVED' | 'NEEDS_REVISION';
};

export type LayoutDocument = {
  projectId: number;
  title: string;
  subtitle: string;
  theme: EditorialTheme;
  pages: LayoutPage[];
  assets: Record<string, string>;
  markdown: string;
};

type ProjectForLayout = {
  id: number;
  name: string;
  manuscriptBlocks?: Array<{ blockTitle: string; content?: string | null; order: number }>;
  chapterPlans?: Array<{ chapterNumber: number; title: string; summary?: string | null; order: number }>;
  marketResearch?: { recommendedTitle?: string | null; audience?: string | null } | null;
  metadataPackage?: { commercialTitle?: string | null; subtitle?: string | null } | null;
};

const forbiddenRaw = [/^\s*!\[/, /^\s*---\s*$/];

function cleanLine(line: string) {
  return line
    .replace(/^#{1,4}\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^\|?[-:\s|]+\|?$/, '')
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/^·\s*|\s*·$/g, '')
    .trim();
}

function splitParagraphs(content?: string | null) {
  return String(content || '')
    .split(/\n+/)
    .map((line) => cleanLine(line))
    .filter((line) => line && !forbiddenRaw.some((pattern) => pattern.test(line)));
}

export function countWords(value: string | string[]) {
  return (Array.isArray(value) ? value.join(' ') : value).split(/\s+/).filter(Boolean).length;
}

function chunkText(paragraphs: string[], maxWords = 430) {
  const chunks: string[][] = [];
  let current: string[] = [];
  let words = 0;
  for (const paragraph of paragraphs) {
    const count = paragraph.split(/\s+/).filter(Boolean).length;
    if (current.length && words + count > maxWords) {
      chunks.push(current);
      current = [];
      words = 0;
    }
    current.push(paragraph);
    words += count;
  }
  if (current.length) chunks.push(current);
  if (chunks.length > 1 && countWords(chunks[chunks.length - 1]) < 120) {
    const tail = chunks.pop();
    if (tail) chunks[chunks.length - 1].push(...tail);
  }
  return chunks;
}

function densityFor(words: number): LayoutPage['density'] {
  if (words < 160) return 'sparse';
  if (words > 560) return 'dense';
  return 'balanced';
}

function pageWithRhythm(page: LayoutPage, role: string): LayoutPage {
  const wordCount = countWords(page.content);
  return {
    ...page,
    rhythmRole: role,
    wordCount,
    density: densityFor(wordCount),
    rhythmStatus: wordCount > 620 || (wordCount < 120 && !['cover', 'title', 'toc', 'chapter-opener', 'figure-page', 'worksheet', 'appendix', 'credits'].includes(page.type))
      ? 'NEEDS_REVISION'
      : 'APPROVED',
  };
}

export class EditorialLayoutEngine {
  build(project: ProjectForLayout, theme: EditorialTheme, markdown: string): LayoutDocument {
    const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
    const subtitle = project.metadataPackage?.subtitle || 'Guia premium practica y visual';
    const chapters = [...(project.chapterPlans || [])].sort((a, b) => a.order - b.order || a.chapterNumber - b.chapterNumber);
    const blocks = [...(project.manuscriptBlocks || [])].sort((a, b) => a.order - b.order);
    const pages: LayoutPage[] = [
      { id: 'cover', type: 'cover', title, subtitle, content: [], assetRole: 'cover' },
      { id: 'title', type: 'title', title, subtitle, content: ['Edición premium local', 'Cervantes Editorial System'], assetRole: 'separator' },
      {
        id: 'toc',
        type: 'toc',
        title: 'Índice visual',
        subtitle: 'Mapa de lectura',
        content: chapters.map((chapter) => `${chapter.chapterNumber}. ${chapter.title}`),
        assetRole: 'icons',
      },
      {
        id: 'method-map',
        type: 'figure-page',
        title: 'Mapa editorial del método',
        subtitle: 'De la idea a la aplicación',
        content: ['Observa el problema, prioriza lo importante, aplica una acción concreta y registra el resultado.'],
        assetRole: 'figure-map',
      },
    ];

    blocks.forEach((block, index) => {
      const chapter = chapters[index];
      const chapterNumber = chapter?.chapterNumber || index + 1;
      const titleForBlock = chapter?.title || block.blockTitle || `Capitulo ${chapterNumber}`;
      pages.push({
        id: `chapter-${chapterNumber}-opener`,
        type: 'chapter-opener',
        title: titleForBlock,
        subtitle: chapter?.summary || 'Apertura editorial',
        content: [],
        assetRole: 'chapter-opener',
        chapterNumber,
      });
      chunkText(splitParagraphs(block.content), 430).forEach((content, pageIndex) => {
        const sectionLabels = ['Principios clave', 'Aplicación práctica', 'Ejemplo guiado', 'Errores comunes', 'Cierre del capítulo'];
        const typeCycle: LayoutPageType[] = ['reading-page', 'reading-spread', 'key-takeaways', 'reading-page'];
        const type = typeCycle[pageIndex % typeCycle.length];
        pages.push({
          id: `chapter-${chapterNumber}-page-${pageIndex + 1}`,
          type,
          title: pageIndex === 0 ? titleForBlock : sectionLabels[(pageIndex - 1) % sectionLabels.length],
          content,
          assetRole: pageIndex === 0 ? 'separator' : undefined,
          chapterNumber,
          sectionLabel: sectionLabels[pageIndex % sectionLabels.length],
          variant: pageIndex % 4,
          qualityNote: type === 'reading-spread'
            ? 'Página de lectura amplia para compactar contenido sin perder jerarquía.'
            : 'Página de lectura con densidad editorial equilibrada.',
        });
      });
      pages.push({
        id: `chapter-${chapterNumber}-case`,
        type: 'case-study',
        title: 'Caso aplicado',
        subtitle: titleForBlock,
        content: [
          `Situación: una persona principiante necesita aplicar ${titleForBlock.toLowerCase()} sin perder claridad ni seguridad.`,
          'Decisión editorial: convertir la teoría en una acción observable, breve y revisable.',
          'Resultado esperado: el lector termina la sección con un criterio práctico y no solo con información acumulada.',
        ],
        assetRole: 'icons',
        chapterNumber,
        sectionLabel: 'Ejemplo guiado',
      });
      pages.push({
        id: `chapter-${chapterNumber}-table`,
        type: 'comparison-table',
        title: 'Tabla de decisión',
        subtitle: titleForBlock,
        content: ['Señal observable', 'Interpretación prudente', 'Acción recomendada', 'Cuándo revisar'],
        assetRole: 'figure-map',
        chapterNumber,
        sectionLabel: 'Tabla práctica',
      });
      pages.push({
        id: `chapter-${chapterNumber}-summary`,
        type: 'chapter-summary',
        title: 'Cierre accionable',
        subtitle: titleForBlock,
        content: ['Idea clave del capítulo', 'Acción concreta para hoy', 'Error común a evitar', 'Pregunta de seguimiento'],
        assetRole: 'separator',
        chapterNumber,
        sectionLabel: 'Resumen',
      });
      if (index === 1) {
        pages.push({
          id: `chapter-${chapterNumber}-worksheet`,
          type: 'practice-lab',
          title: 'Hoja de trabajo',
          subtitle: 'Checklist aplicable',
          content: ['Acción clave', 'Señal observable', 'Decisión segura', 'Revisión semanal'],
          assetRole: 'worksheet',
          chapterNumber,
          sectionLabel: 'Práctica',
        });
      }
    });

    pages.push(
      {
        id: 'global-worksheet',
        type: 'worksheet',
        title: 'Worksheet imprimible',
        subtitle: 'Aplicación práctica',
        content: ['Acción clave', 'Señal observable', 'Decisión segura', 'Revisión semanal'],
        assetRole: 'worksheet',
        sectionLabel: 'Práctica',
      },
      {
        id: 'appendix-checklist',
        type: 'appendix',
        title: 'Checklist editorial',
        content: ['Estructura completa', 'Jerarquía visual clara', 'Assets aprobados', 'Metadata preparada', 'Declaración IA incluida'],
        assetRole: 'worksheet',
      },
      {
        id: 'credits',
        type: 'credits',
        title: 'Créditos visuales',
        content: ['Assets SVG generados localmente por Cervantes como elementos editables y reemplazables.'],
        assetRole: 'mockup',
      },
    );
    const rhythmPages = pages.map((page) => pageWithRhythm(page, page.sectionLabel || page.type));

    return {
      projectId: project.id,
      title,
      subtitle,
      theme,
      pages: rhythmPages,
      assets: {},
      markdown,
    };
  }
}
