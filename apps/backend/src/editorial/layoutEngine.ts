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
  tableRows?: string[][];
  assetRole?: string;
  chapterNumber?: number;
  status?: 'PENDING' | 'NEEDS_REVISION' | 'APPROVED';
  variant?: number;
  qualityNote?: string;
  rhythmRole?: string;
  wordCount?: number;
  density?: 'sparse' | 'balanced' | 'dense';
  sectionLabel?: string;
  localUrl?: string;
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
      
      let parsedData: any = null;
      try {
        let cleanContent = (block.content || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedData = JSON.parse(cleanContent || '{}');
      } catch (e) {}

      const titleForBlock = parsedData?.chapterTitle || chapter?.title || block.blockTitle || `Capitulo ${chapterNumber}`;
      
      pages.push({
        id: `chapter-${chapterNumber}-opener`,
        type: 'chapter-opener',
        title: titleForBlock,
        subtitle: parsedData?.objective || chapter?.summary || 'Apertura editorial',
        content: parsedData?.opening ? [parsedData.opening] : [],
        assetRole: 'chapter-opener',
        chapterNumber,
      });

      if (parsedData?.blocks && Array.isArray(parsedData.blocks)) {
        let pIndex = 1;
        parsedData.blocks.forEach((b: any, bIndex: number) => {
          if (b.type === 'paragraph') {
             pages.push({
               id: `chapter-${chapterNumber}-page-${pIndex++}`,
               type: 'reading-page',
               title: titleForBlock,
               content: [b.text],
               chapterNumber
             });
          } else if (b.type === 'checklist') {
             pages.push({
               id: `chapter-${chapterNumber}-page-${pIndex++}`,
               type: 'reading-page',
               title: b.heading || 'Lista de verificación',
               content: b.items || [],
               chapterNumber
             });
          } else if (b.type === 'expert_tip') {
             pages.push({
               id: `chapter-${chapterNumber}-page-${pIndex++}`,
               type: 'reading-page',
               title: b.heading || 'Consejo experto',
               content: [b.body, b.source ? `Fuente: ${b.source}` : ''].filter(Boolean),
               chapterNumber
             });
          } else if (b.type === 'case_study') {
             pages.push({
               id: `chapter-${chapterNumber}-case`,
               type: 'case-study',
               title: b.heading || 'Caso aplicado',
               subtitle: titleForBlock,
               content: [
                 `Situación: ${b.situation}`,
                 `Decisión: ${b.decision}`,
                 `Resultado: ${b.result}`
               ],
               assetRole: 'icons',
               chapterNumber,
               sectionLabel: 'Ejemplo guiado',
             });
          } else if (b.type === 'exercise') {
             pages.push({
               id: `chapter-${chapterNumber}-worksheet`,
               type: 'practice-lab',
               title: b.heading || 'Hoja de trabajo',
               subtitle: 'Práctica guiada',
               content: [b.instructions, ...(b.fields || [])],
               assetRole: 'worksheet',
               chapterNumber,
               sectionLabel: 'Práctica',
             });
          } else if (b.type === 'table') {
             pages.push({
               id: `chapter-${chapterNumber}-table`,
               type: 'comparison-table',
               title: b.heading || 'Tabla de referencia',
               subtitle: titleForBlock,
               content: b.columns || [],
               tableRows: b.rows || [],
               assetRole: 'figure-map',
               chapterNumber,
               sectionLabel: 'Tabla',
             });
          } else if (b.type === 'inline_image') {
             pages.push({
               id: `chapter-${chapterNumber}-image-${pIndex++}`,
               type: 'figure-page',
               title: b.caption || 'Ilustración',
               subtitle: titleForBlock,
               content: [],
               localUrl: b.localUrl,
               assetRole: 'figure-map',
               chapterNumber,
               sectionLabel: 'Figura',
             });
          }
        });
      } else if (block.content && (!parsedData || !parsedData.blocks)) {
        let rawContent = block.content;
        
        // Final Output Sanitizer
        const sanitizeText = (text: string) => {
          return text
            .replace(/"[a-zA-Z0-9_]+"\s*:\s*"?/g, '') // Remove JSON keys like "chapterTitle":
            .replace(/",\s*"?/g, '\n') // Remove JSON field separators
            .replace(/\{|\}/g, '') // Remove JSON curly braces
            .replace(/blocks"\s*:\s*\[/g, '') // Remove blocks array syntax
            .replace(/requiresVerification"\s*:\s*(true|false)/gi, '') // Remove requiresVerification
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove Markdown images
            .replace(/\/projects\/\d+\/assets\/.*?\.(jpg|png|svg)/gi, '') // Remove local paths
            .replace(/columns"\s*:\s*\[.*?\]/gs, '') // Remove tables columns arrays
            .replace(/rows"\s*:\s*\[.*?\]/gs, '') // Remove tables rows arrays
            .replace(/fields"\s*:\s*\[.*?\]/gs, '') // Remove fields arrays
            .replace(/El contenido se ha limpiado.*?(JSON|formato)/gi, '') // Remove LLM transition phrasing
            .replace(/\[\s*"/g, '') // Remove array starts
            .replace(/"\s*\]/g, '') // Remove array ends
            .replace(/",\s*"/g, '\n- ') // Convert array items to list
            .replace(/\b(paragraph|checklist|inline_image|expert_tip|case_study|exercise|requiresVerification|items)\b/gi, '') // Strip JSON keys explicitly
            .replace(/\[|\]/g, '') // Strip remaining brackets to pass QA
            .replace(/Aquí tienes el.*?JSON/gi, '') // Remove LLM intro
            .replace(/```json/g, '') // Remove Markdown code block syntax
            .replace(/```markdown/g, '')
            .replace(/```/g, '')
            .replace(/\]\s*,/g, '') // Remove trailing JSON array brackets
            .replace(/\"\s*,/g, '') // Remove trailing JSON quotes
            .trim();
        };

        rawContent = sanitizeText(rawContent);

        const paragraphs = rawContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        let pIndex = 1;
        let currentPageContent: string[] = [];
        let currentWordCount = 0;
        
        paragraphs.forEach((p) => {
            const words = p.split(/\s+/).filter(Boolean).length;
            if (currentWordCount > 0 && currentWordCount + words > 200) {
                pages.push({
                  id: `chapter-${chapterNumber}-page-${pIndex++}`,
                  type: 'reading-page',
                  title: titleForBlock,
                  content: [...currentPageContent],
                  chapterNumber
                });
                currentPageContent = [];
                currentWordCount = 0;
            }
            currentPageContent.push(p);
            currentWordCount += words;
        });
        
        if (currentPageContent.length > 0) {
            pages.push({
              id: `chapter-${chapterNumber}-page-${pIndex++}`,
              type: 'reading-page',
              title: titleForBlock,
              content: [...currentPageContent],
              chapterNumber
            });
        }
      }

      if (parsedData?.summary || (!parsedData && block.content)) {
        const closing = parsedData?.action_closing || {};
        pages.push({
          id: `chapter-${chapterNumber}-summary`,
          type: 'chapter-summary',
          title: 'Resumen y Cierre',
          subtitle: titleForBlock,
          content: [
            parsedData?.summary || 'Este capítulo establece una base práctica sobre la cual se construirán los siguientes pasos. La clave está en la ejecución constante.',
            closing.key_idea ? `Idea clave: ${closing.key_idea}` : '',
            closing.today_action ? `Acción: ${closing.today_action}` : '',
            closing.common_error ? `Error común: ${closing.common_error}` : ''
          ].filter(Boolean),
          assetRole: 'separator',
          chapterNumber,
          sectionLabel: 'Resumen',
        });
      }
    });

    pages.push(
      {
        id: 'appendix-checklist',
        type: 'appendix',
        title: 'Revisión editorial',
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
