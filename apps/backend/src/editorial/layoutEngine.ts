import type { EditorialTheme } from './themeEngine';

export type LayoutPageType =
  | 'cover'
  | 'title'
  | 'toc'
  | 'chapter-opener'
  | 'reading-page'
  | 'figure-page'
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

function chunkText(paragraphs: string[], maxWords = 210) {
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
  return chunks;
}

export class EditorialLayoutEngine {
  build(project: ProjectForLayout, theme: EditorialTheme, markdown: string): LayoutDocument {
    const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
    const subtitle = project.metadataPackage?.subtitle || 'Guia premium practica y visual';
    const chapters = [...(project.chapterPlans || [])].sort((a, b) => a.order - b.order || a.chapterNumber - b.chapterNumber);
    const blocks = [...(project.manuscriptBlocks || [])].sort((a, b) => a.order - b.order);
    const pages: LayoutPage[] = [
      { id: 'cover', type: 'cover', title, subtitle, content: [], assetRole: 'cover' },
      { id: 'title', type: 'title', title, subtitle, content: ['Edicion premium local', 'Cervantes Editorial System'], assetRole: 'separator' },
      {
        id: 'toc',
        type: 'toc',
        title: 'Indice visual',
        subtitle: 'Mapa de lectura',
        content: chapters.map((chapter) => `${chapter.chapterNumber}. ${chapter.title}`),
        assetRole: 'icons',
      },
      {
        id: 'method-map',
        type: 'figure-page',
        title: 'Mapa editorial del metodo',
        subtitle: 'De la idea a la aplicacion',
        content: ['Observa el problema, prioriza lo importante, aplica una accion concreta y registra el resultado.'],
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
      chunkText(splitParagraphs(block.content)).forEach((content, pageIndex) => {
        pages.push({
          id: `chapter-${chapterNumber}-page-${pageIndex + 1}`,
          type: 'reading-page',
          title: pageIndex === 0 ? titleForBlock : `${titleForBlock} / continuacion`,
          content,
          assetRole: pageIndex === 0 ? 'separator' : undefined,
          chapterNumber,
        });
      });
      if (index === 1) {
        pages.push({
          id: `chapter-${chapterNumber}-worksheet`,
          type: 'worksheet',
          title: 'Hoja de trabajo',
          subtitle: 'Checklist aplicable',
          content: ['Accion clave', 'Senal observable', 'Decision segura', 'Revision semanal'],
          assetRole: 'worksheet',
          chapterNumber,
        });
      }
    });

    pages.push(
      {
        id: 'appendix-checklist',
        type: 'appendix',
        title: 'Checklist editorial',
        content: ['Estructura completa', 'Jerarquia visual clara', 'Assets aprobados', 'Metadata preparada', 'Declaracion IA incluida'],
        assetRole: 'worksheet',
      },
      {
        id: 'credits',
        type: 'credits',
        title: 'Creditos visuales',
        content: ['Assets SVG generados localmente por Cervantes como elementos editables y reemplazables.'],
        assetRole: 'mockup',
      },
    );

    return {
      projectId: project.id,
      title,
      subtitle,
      theme,
      pages,
      assets: {},
      markdown,
    };
  }
}
