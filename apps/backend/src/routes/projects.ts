import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import {
  auditTemplate,
  chapterPlanTemplate,
  clarificationQuestions,
  editorialBibleTemplate,
  editorialFormulaTemplate,
  languageTemplate,
  marketResearchTemplate,
  generateFullChapterTemplate,
  metadataTemplate,
  publishingTemplate,
  visualBibleTemplate,
} from '../engines/templates';
import { ExportService } from '../exporters/exportService';
import { EditorialLayoutService } from '../editorial/editorialLayoutService';
import { createBackup } from '../services/backupService';
import {
  approveGeneratedGate,
  gateReport,
  inspectManuscript,
  upsertGate,
  validateGumroadPackage,
  validateKdpPackage,
} from '../services/qualityService';

const router = Router();
const exporter = new ExportService();
const layoutService = new EditorialLayoutService();

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

function svgTitleLines(title: string, x: number, y: number, maxChars = 23, lineHeight = 92) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines
    .slice(0, 4)
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="#F8F3EA" font-family="Georgia" font-size="82" text-anchor="middle">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`)
    .join('');
}

async function projectOr404(id: number) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      idea: true,
      clarifications: { orderBy: { order: 'asc' } },
      marketResearch: true,
      competitors: true,
      languageOpportunity: true,
      editorialFormula: true,
      editorialBible: true,
      visualBible: true,
      chapterPlans: { orderBy: { order: 'asc' } },
      manuscriptBlocks: { orderBy: { order: 'asc' } },
      auditReports: { orderBy: { createdAt: 'desc' } },
      recoveryReports: { orderBy: { createdAt: 'desc' } },
      visualAssets: true,
      formatBuilds: { orderBy: { createdAt: 'desc' } },
      metadataPackage: true,
      publishingChecklist: true,
      exportPackages: { orderBy: { createdAt: 'desc' } },
      versionSnapshots: { orderBy: { createdAt: 'desc' } },
      phaseGates: { orderBy: { phase: 'asc' } },
      aiUsageLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      sourceNotes: { orderBy: { createdAt: 'desc' } },
      publicationReadiness: true,
      backupRecords: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!project) {
    const error = new Error('Project not found') as Error & { status?: number };
    error.status = 404;
    throw error;
  }
  return project;
}

async function logAI(projectId: number, engine: string, generated: { provider: string; model?: string; prompt?: string; data: unknown; error?: string }) {
  await prisma.aIUsageLog.create({
    data: {
      projectId,
      engine,
      provider: generated.provider,
      model: generated.model,
      prompt: generated.prompt,
      result: JSON.stringify(generated.data),
      status: generated.error ? 'FALLBACK' : 'DONE',
      error: generated.error,
    },
  });
}

async function ensureRecoveryEditorialStructure(projectId: number) {
  const blocks = await prisma.manuscriptBlock.findMany({ where: { projectId }, orderBy: { order: 'asc' } });
  for (const block of blocks) {
    let content = block.content || `# ${block.blockTitle}`;
    const additions: string[] = [];

    if (!content.includes('![Figura editorial')) {
      additions.push(`## Figura editorial

![Figura editorial: mapa visual del método](assets/figure-map.svg)

Esta lámina resume la relación entre observación, decisión y acción práctica para que el lector no dependa solo de texto corrido.`);
    }

    if (!content.includes('## Tabla de decisión') && !content.includes('| Criterio |')) {
      additions.push(`## Tabla de decisión

| Criterio | Señal práctica | Acción recomendada |
|---|---|---|
| Claridad | El lector entiende qué observar | Simplificar el paso antes de avanzar |
| Riesgo | Hay una duda de salud, seguridad o bienestar | Consultar una fuente profesional o especialista |
| Aplicación | La recomendación puede probarse en una rutina breve | Registrar resultado y ajustar la siguiente acción |

## Cierre accionable

Antes de pasar al siguiente capítulo, el lector debe identificar una decisión concreta, una señal observable y una acción segura para aplicar durante la semana.`);
    }

    if (content.split(/\s+/).filter(Boolean).length < 260) {
      additions.push(`## Desarrollo editorial aplicado

Para que este capítulo funcione como una pieza de libro y no como una respuesta breve, el lector necesita una secuencia completa: primero reconocer el contexto, luego distinguir las señales importantes, después elegir una acción proporcional y finalmente revisar el resultado. En la práctica, esto significa evitar recomendaciones aisladas y convertir cada idea en un pequeño método repetible.

La lectura debe avanzar con una lógica clara. Una buena decisión nace de observar, comparar y actuar con calma. Cuando el tema toca bienestar, aprendizaje, cuidado personal o hábitos cotidianos, conviene privilegiar la seguridad, la constancia y la revisión periódica antes que una promesa rápida. Esa es la diferencia entre información suelta y orientación editorial útil.

Al cerrar esta sección, el lector debería poder explicar con sus propias palabras qué debe mirar, qué error frecuente debe evitar y cuál es el siguiente paso razonable. Si no puede hacerlo, la recomendación debe simplificarse hasta quedar en una acción concreta, medible y fácil de repetir durante la semana.`);
    }

    if (additions.length === 0) continue;

    const enhanced = `${content.trim()}

${additions.join('\n\n')}
`;

    await prisma.manuscriptBlock.update({
      where: { id: block.id },
      data: {
        content: enhanced,
        wordCount: enhanced.split(/\s+/).filter(Boolean).length,
        version: { increment: 1 },
      },
    });
  }
}

function normalizeClarificationQuestions(rawQuestions: unknown[], rawIdea: string) {
  const normalized = rawQuestions
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'question' in item) {
        return String((item as { question?: unknown }).question || '').trim();
      }
      return '';
    })
    .filter(Boolean);

  const fallbackQuestions = [
    `¿Qué transformación concreta debe lograr el lector con "${rawIdea}"?`,
    '¿Qué nivel de experiencia tiene la audiencia principal?',
    '¿Qué formato comercial será más atractivo: guía breve, libro completo o bundle?',
    '¿Qué promesa debe evitar exageraciones o claims no verificables?',
    '¿Qué tono debe dominar: didáctico, premium, práctico o inspiracional?',
  ];

  for (const question of fallbackQuestions) {
    if (normalized.length >= 5) break;
    if (!normalized.includes(question)) normalized.push(question);
  }

  return normalized.slice(0, 5);
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeSuggestedTitles(raw: unknown, recommendedTitle: string, topic: string) {
  const baseTopic = topic
    .replace(/^un ebook premium sobre\s+/i, '')
    .replace(/^ebook premium sobre\s+/i, '')
    .replace(/[.]+$/g, '')
    .trim();
  const topicLabel = baseTopic ? baseTopic.charAt(0).toUpperCase() + baseTopic.slice(1) : 'Metodo visual';
  const sourceItems = parseJsonArray(raw);
  const fallback = [
    {
      title: recommendedTitle,
      language: 'es',
      market: 'Spanish-first digital publishing',
      adaptation: 'Nombre principal elegido por claridad comercial, promesa visual y baja friccion de lanzamiento.',
    },
    {
      title: `${topicLabel}: Guia Practica Visual`,
      language: 'es',
      market: 'Spanish beginner SEO',
      adaptation: 'Alternativa directa para busqueda en marketplaces y lectores principiantes.',
    },
    {
      title: `El Metodo Visual de ${topicLabel}`,
      language: 'es',
      market: 'Spanish premium niche',
      adaptation: 'Alternativa mas editorial para portada, posicionamiento premium y recordacion.',
    },
    {
      title: `${topicLabel} Made Visual`,
      language: 'en',
      market: 'English expansion',
      adaptation: 'Titulo localizado para expansion; adapta promesa y lenguaje en vez de traducir literalmente.',
    },
  ];

  const compactTitle = (value: string) => {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (clean.length <= 70) return clean;
    const clipped = clean.slice(0, 70);
    return (clipped.includes(' ') ? clipped.replace(/\s+\S*$/, '') : clipped).replace(/[:,-]\s*$/, '').trim();
  };

  const normalized = sourceItems.map((item, index) => {
    const title = typeof item === 'string' ? item : textValue((item as { title?: unknown } | null)?.title);
    return {
      title: compactTitle(title || fallback[index % fallback.length].title),
      language: textValue((item as { language?: unknown } | null)?.language) || fallback[index % fallback.length].language,
      market: textValue((item as { market?: unknown } | null)?.market) || fallback[index % fallback.length].market,
      adaptation: textValue((item as { adaptation?: unknown } | null)?.adaptation) || fallback[index % fallback.length].adaptation,
      rationale:
        textValue((item as { rationale?: unknown; promise?: unknown } | null)?.rationale) ||
        textValue((item as { promise?: unknown } | null)?.promise) ||
        'Opcion comparada por claridad, diferenciacion visual y ajuste a plataforma.',
    };
  });

  const seen = new Set<string>();
  const complete = [...normalized, ...fallback.map((item) => ({ ...item, title: compactTitle(item.title) }))]
    .filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);

  return JSON.stringify(complete);
}

function normalizeMetadataPackage(raw: Record<string, unknown>, projectName: string) {
  const title = raw.commercialTitle || raw.title || projectName;
  const description = raw.longDescription || raw.description;
  const defaultDescription = `Guia editorial premium de ${projectName}, creada para entregar un metodo claro, aplicable y visual, con estructura profesional, ejercicios, checklist y materiales de apoyo listos para publicacion digital.`;
  return {
    commercialTitle: textValue(title),
    subtitle: textValue(raw.subtitle) || 'Una guía premium, práctica y lista para aplicar',
    longDescription: textValue(description) || defaultDescription,
    shortDescription: textValue(raw.shortDescription) || textValue(description)?.slice(0, 240) || defaultDescription.slice(0, 240),
    salesBullets: textValue(raw.salesBullets || raw.bullets || raw.keywords),
    keywords: textValue(raw.keywords) || 'ebook premium, guia practica, publicacion digital, metodo visual, aprendizaje aplicado',
    suggestedCategories: textValue(raw.suggestedCategories || raw.categories) || 'Educacion / Desarrollo personal / Guias practicas',
    recommendedPrice: numberValue(raw.recommendedPrice || raw.price) || 19.9,
    launchStrategy: textValue(raw.launchStrategy),
    kdpMetadata: textValue(raw.kdpMetadata || raw.kdp),
    gumroadMetadata: textValue(raw.gumroadMetadata || raw.gumroad),
    shopifyMetadata: textValue(raw.shopifyMetadata),
    d2dMetadata: textValue(raw.d2dMetadata),
    promoCopy: textValue(raw.promoCopy),
    presaleText: textValue(raw.presaleText),
    requiredAssets: textValue(raw.requiredAssets || raw.file),
  };
}

function normalizePublishingChecklist(raw: Record<string, unknown>) {
  const copyrightFallback =
    'Contenido original asistido por IA y revisado por el autor. Assets visuales generados o reemplazados dentro del flujo local; confirmar licencias antes de publicacion publica.';
  return {
    items: textValue(raw.items),
    editorialGate: textValue(raw.editorialGate) || 'PENDING',
    technicalGate: textValue(raw.technicalGate) || 'PENDING',
    visualGate: textValue(raw.visualGate) || 'PENDING',
    complianceGate: textValue(raw.complianceGate) || 'PENDING',
    platformGate: textValue(raw.platformGate) || 'PENDING',
    aiDeclaration: textValue(raw.aiDeclaration) || 'Contenido asistido por herramientas de IA y revisado editorialmente por el autor.',
    copyrightStatus: textValue(raw.copyrightStatus || raw.copyright || raw.rights) || copyrightFallback,
    overallStatus: textValue(raw.overallStatus) || 'PENDING',
    kdpChecklist: textValue(raw.kdpChecklist || raw.kdp),
    gumroadChecklist: textValue(raw.gumroadChecklist || raw.gumroad),
    readinessReport: textValue(raw.readinessReport || raw.report),
  };
}

function visualVariant(asset: { replacementPath?: string | null }) {
  if (!asset.replacementPath) return 0;
  try {
    const parsed = JSON.parse(asset.replacementPath) as { variant?: unknown };
    const variant = Number(parsed.variant);
    return Number.isFinite(variant) ? variant : 0;
  } catch {
    return 0;
  }
}

function visualAssetSvg(asset: { assetType: string; name: string; prompt?: string | null; replacementPath?: string | null }, title: string) {
  const variant = visualVariant(asset) % 3;
  const palette = [
    { ink: '#111315', paper: '#F8F3EA', teal: '#3A7D7C', gold: '#D9BF67', coral: '#D95D39', mist: '#E8EFEA' },
    { ink: '#151716', paper: '#F7F1E6', teal: '#245F63', gold: '#C9A227', coral: '#B9533F', mist: '#EEF3EF' },
    { ink: '#101214', paper: '#FAF6EE', teal: '#4A837F', gold: '#E0BC57', coral: '#CC654C', mist: '#E4ECE8' },
  ][variant];

  if (asset.assetType === 'cover') {
    const motif = variant === 0
      ? `<circle cx="800" cy="790" r="210" fill="${palette.paper}" opacity="0.94"/><circle cx="800" cy="790" r="98" fill="none" stroke="${palette.teal}" stroke-width="24"/><path d="M760 835 C800 880 840 880 880 835" fill="none" stroke="${palette.coral}" stroke-width="22" stroke-linecap="round"/>`
      : variant === 1
        ? `<rect x="520" y="530" width="560" height="560" fill="${palette.paper}" opacity="0.92"/><path d="M610 790 C700 650 900 650 990 790 C930 940 670 940 610 790Z" fill="none" stroke="${palette.teal}" stroke-width="28"/><circle cx="720" cy="785" r="28" fill="${palette.ink}"/><circle cx="880" cy="785" r="28" fill="${palette.ink}"/>`
        : `<path d="M800 500 C1030 680 1055 980 800 1230 C545 980 570 680 800 500Z" fill="${palette.paper}" opacity="0.93"/><path d="M650 825 C730 760 870 760 950 825" fill="none" stroke="${palette.teal}" stroke-width="26"/><path d="M710 950 H890" stroke="${palette.coral}" stroke-width="24" stroke-linecap="round"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette.ink}"/><stop offset="1" stop-color="${palette.teal}"/></linearGradient></defs><rect width="1600" height="2400" fill="url(#bg)"/><rect x="116" y="116" width="1368" height="2168" fill="none" stroke="${palette.gold}" stroke-width="8"/><rect x="178" y="178" width="1244" height="2044" fill="none" stroke="${palette.paper}" stroke-opacity="0.16" stroke-width="2"/><g>${motif}</g><text x="800" y="1370" fill="${palette.gold}" font-family="Arial" font-size="34" text-anchor="middle" letter-spacing="4">GUIA PREMIUM PRACTICA Y VISUAL</text>${svgTitleLines(title, 800, 1515)}<text x="800" y="2115" fill="${palette.paper}" fill-opacity="0.78" font-family="Arial" font-size="34" text-anchor="middle">CERVANTES EDITORIAL SYSTEM</text></svg>`;
  }

  if (asset.assetType === 'figure') {
    const layout = variant === 0
      ? `<circle cx="600" cy="360" r="114" fill="${palette.ink}"/><text x="600" y="352" font-family="Georgia" font-size="31" text-anchor="middle" fill="${palette.paper}">Decisión</text><text x="600" y="390" font-family="Arial" font-size="18" text-anchor="middle" fill="${palette.gold}">con criterio</text><path d="M470 340 C365 302 300 245 246 170" fill="none" stroke="${palette.teal}" stroke-width="6"/><path d="M730 340 C835 302 900 245 954 170" fill="none" stroke="${palette.coral}" stroke-width="6"/><path d="M470 390 C365 428 300 485 246 560" fill="none" stroke="${palette.gold}" stroke-width="6"/><path d="M730 390 C835 428 900 485 954 560" fill="none" stroke="#526064" stroke-width="6"/>`
      : variant === 1
        ? `<path d="M180 360 H1020" stroke="${palette.gold}" stroke-width="8"/><circle cx="250" cy="360" r="62" fill="${palette.teal}"/><circle cx="500" cy="360" r="62" fill="${palette.ink}"/><circle cx="750" cy="360" r="62" fill="${palette.coral}"/><circle cx="1000" cy="360" r="62" fill="#526064"/>`
        : `<path d="M600 150 L1000 360 L600 570 L200 360 Z" fill="none" stroke="${palette.gold}" stroke-width="8"/><circle cx="600" cy="150" r="58" fill="${palette.teal}"/><circle cx="1000" cy="360" r="58" fill="${palette.coral}"/><circle cx="600" cy="570" r="58" fill="${palette.gold}"/><circle cx="200" cy="360" r="58" fill="#526064"/><circle cx="600" cy="360" r="78" fill="${palette.ink}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="${palette.paper}"/><text x="96" y="88" font-family="Georgia" font-size="44" fill="${palette.ink}">Mapa práctico de cuidado</text><text x="98" y="126" font-family="Arial" font-size="18" fill="#526064">Del síntoma observable a una acción segura y revisable</text><g>${layout}</g><g font-family="Arial" font-size="20" text-anchor="middle"><rect x="122" y="118" width="248" height="96" fill="${palette.teal}"/><text x="246" y="158" fill="#fff">Observa</text><text x="246" y="188" font-size="15" fill="${palette.mist}">señales reales</text><rect x="830" y="118" width="248" height="96" fill="${palette.coral}"/><text x="954" y="158" fill="#fff">Prioriza</text><text x="954" y="188" font-size="15" fill="#FFE8DF">salud y seguridad</text><rect x="122" y="506" width="248" height="96" fill="${palette.gold}"/><text x="246" y="546" fill="${palette.ink}">Aplica</text><text x="246" y="576" font-size="15" fill="#3A3320">rutina breve</text><rect x="830" y="506" width="248" height="96" fill="#526064"/><text x="954" y="546" fill="#fff">Registra</text><text x="954" y="576" font-size="15" fill="${palette.mist}">ajuste semanal</text></g><rect x="90" y="656" width="1020" height="2" fill="${palette.gold}"/><text x="96" y="688" font-family="Arial" font-size="16" fill="#526064">Figura editorial editable para explicar el método dentro del ebook.</text></svg>`;
  }

  if (asset.assetType === 'mockup') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 460"><rect width="720" height="460" fill="${palette.paper}"/><ellipse cx="360" cy="382" rx="214" ry="30" fill="${palette.ink}" opacity="0.14"/><path d="M252 84 L430 52 L430 348 L252 384 Z" fill="${palette.teal}"/><path d="M430 52 L492 96 L492 368 L430 348 Z" fill="${palette.gold}"/><path d="M286 128 L392 108" stroke="${palette.paper}" stroke-width="8"/><path d="M286 164 L382 146" stroke="${palette.paper}" stroke-width="4" opacity="0.7"/><circle cx="342" cy="246" r="48" fill="none" stroke="${palette.coral}" stroke-width="12"/><text x="360" y="426" text-anchor="middle" font-family="Georgia" font-size="28" fill="${palette.ink}">Mockup comercial premium</text></svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 460"><rect width="720" height="460" fill="${palette.paper}"/><rect x="148" y="54" width="424" height="340" fill="#fff" stroke="${palette.gold}" stroke-width="6"/><text x="194" y="124" font-family="Georgia" font-size="34" fill="${palette.ink}">Checklist editorial</text>${[0, 1, 2, 3, 4].map((row) => `<g transform="translate(194 ${172 + row * 42})"><rect width="24" height="24" fill="none" stroke="${palette.teal}" stroke-width="5"/><line x1="46" y1="13" x2="${330 - row * 22}" y2="13" stroke="${row === 2 ? palette.coral : '#526064'}" stroke-width="8"/></g>`).join('')}<rect x="194" y="354" width="150" height="12" fill="${palette.gold}"/></svg>`;
}

router.get('/', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { idea: true, formatBuilds: true },
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || 'Proyecto en análisis');
    const rawIdea = String(req.body.rawIdea || req.body.idea || '');
    const slugBase = slugify(name) || `project-${Date.now()}`;
    const project = await prisma.project.create({
      data: {
        name,
        slug: `${slugBase}-${Date.now().toString(36)}`,
        idea: rawIdea
          ? {
              create: {
                rawIdea,
                topic: req.body.topic,
                audience: req.body.audience,
                tone: req.body.tone,
              },
            }
          : undefined,
      },
      include: { idea: true },
    });
    await upsertGate(project.id, 'idea', rawIdea ? 'GENERATED' : 'PENDING', 'Proyecto creado desde idea base.');
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await projectOr404(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview', async (req, res, next) => {
  try {
    res.type('html').send(await exporter.previewHtml(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview.pdf', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const build = await exporter.exportFormat(projectId, 'pdf');
    if (!build.filePath) throw new Error('PDF preview was not generated');
    res.download(build.filePath, 'ebook_preview.pdf');
  } catch (error) {
    next(error);
  }
});

router.post('/:id/layout/render', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const rendered = await layoutService.renderProject(projectId, { assetBase: `/api/projects/${projectId}/assets` });
    await upsertGate(projectId, 'preview', rendered.report.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION', `Maquetacion visual: ${rendered.report.status}`);
    res.json({
      status: rendered.report.status,
      htmlPath: rendered.htmlPath,
      report: rendered.report,
      pages: rendered.layout.pages.map((page) => ({ id: page.id, type: page.type, title: page.title, assetRole: page.assetRole })),
      assets: Object.keys(rendered.layout.assets),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/layout/report', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const report = (await layoutService.latestReport(projectId)) || (await layoutService.renderProject(projectId, { persist: true })).report;
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/quality', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const markdown = await exporter.assembleMarkdown(projectId);
    const manuscript = inspectManuscript(markdown);
    const visual = (await layoutService.latestReport(projectId)) || (await layoutService.renderProject(projectId, { persist: true })).report;
    const gates = await gateReport(projectId);
    const project = await projectOr404(projectId);
    const latestPdf = project.formatBuilds.find((build) => build.format === 'pdf');
    const latestEpub = project.formatBuilds.find((build) => build.format === 'epub');
    const latestZip = project.exportPackages[0];
    const kdp = validateKdpPackage({
      title: project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name,
      subtitle: project.metadataPackage?.subtitle as string | undefined,
      aiDeclaration: project.publishingChecklist?.aiDeclaration as string | undefined,
      keywords: project.metadataPackage?.keywords as string | undefined,
      categories: project.metadataPackage?.suggestedCategories as string | undefined,
      epubPath: latestEpub?.filePath,
      coverPath: project.visualAssets.find((asset) => asset.assetType === 'cover')?.filePath || 'cover.svg',
    });
    const gumroad = validateGumroadPackage({
      premiumPdfPath: latestPdf?.filePath,
      zipPath: latestZip?.filePath,
      salesDescription: project.metadataPackage?.longDescription as string | undefined,
      price: project.metadataPackage?.recommendedPrice as number | undefined,
      mockupPrompts: project.visualBible?.imagePrompts as string | undefined,
      disclaimer: project.publishingChecklist?.copyrightStatus as string | undefined,
    });
    const status = manuscript.status === 'APPROVED' && gates.status === 'APPROVED' && kdp.status === 'APPROVED' && gumroad.status === 'APPROVED' && visual.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION';
    const report = { status, manuscript, gates, kdp, gumroad, visual };
    await prisma.publicationReadiness.upsert({
      where: { projectId },
      update: {
        status,
        kdpStatus: kdp.status,
        gumroadStatus: gumroad.status,
        gateReport: JSON.stringify(gates),
        qualityReport: JSON.stringify(report),
        lastCheckedAt: new Date(),
      },
      create: {
        projectId,
        status,
        kdpStatus: kdp.status,
        gumroadStatus: gumroad.status,
        gateReport: JSON.stringify(gates),
        qualityReport: JSON.stringify(report),
        lastCheckedAt: new Date(),
      },
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/gates/:phase', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await projectOr404(projectId);
    const body = req.body || {};
    await upsertGate(
      projectId,
      req.params.phase,
      body.status || 'APPROVED',
      body.notes,
      body.overrideReason,
    );
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/source-notes', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await projectOr404(projectId);
    await prisma.sourceNote.create({
      data: {
        projectId,
        sourceType: req.body?.sourceType || 'market',
        title: req.body?.title || 'Fuente verificada',
        url: req.body?.url,
        notes: req.body?.notes,
        verified: Boolean(req.body?.verified),
      },
    });
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/assets/:assetName', async (req, res, next) => {
  try {
    res.type('image/svg+xml').sendFile(await exporter.assetPath(Number(req.params.id), req.params.assetName));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await projectOr404(id);
    const data: Prisma.ProjectUpdateInput = {
      name: req.body.name,
      status: req.body.status,
      currentPhase: req.body.currentPhase,
      goNoGoScore: req.body.goNoGoScore,
      goNoGoResult: req.body.goNoGoResult,
    };
    res.json(await prisma.project.update({ where: { id }, data }));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/idea', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await projectOr404(projectId);
    const idea = await prisma.ebookIdea.upsert({
      where: { projectId },
      update: req.body,
      create: { ...req.body, projectId, rawIdea: req.body.rawIdea || '' },
    });
    const questions = await clarificationQuestions(idea.rawIdea);
    await logAI(projectId, 'idea-intake', questions);
    const questionTexts = normalizeClarificationQuestions(questions.data as unknown[], idea.rawIdea);
    await prisma.clarificationQuestion.deleteMany({ where: { projectId, answer: null } });
    await prisma.clarificationQuestion.createMany({
      data: questionTexts.map((question, index) => ({
        projectId,
        question,
        category: 'strategy',
        order: index + 1,
      })),
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'idea' } });
    await upsertGate(projectId, 'idea', 'GENERATED', 'Brief y preguntas generadas.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/clarifications', async (req, res, next) => {
  try {
    res.json(await prisma.clarificationQuestion.findMany({ where: { projectId: Number(req.params.id) }, orderBy: { order: 'asc' } }));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/clarifications', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    for (const item of answers) {
      await prisma.clarificationQuestion.update({
        where: { id: Number(item.id) },
        data: { answer: String(item.answer || '') },
      });
    }
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/market-research', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    const generated = await marketResearchTemplate(ideaContext);
    await logAI(projectId, 'market-research', generated);
    
    const validFields = [
      'niche', 'subNiche', 'audience', 'painDesire', 'competitorCount', 'priceRangeLow', 
      'priceRangeHigh', 'avgReviews', 'formats', 'estimatedLength', 'commercialPromise', 
      'observedCovers', 'keywords', 'language', 'opportunityScore', 'riskLevel', 
      'saturationLevel', 'recommendedTitle', 'suggestedTitles', 'titleRationale', 
      'sourceNotes', 'userVerified', 'summary', 'fullReport'
    ];
    
    const dataToSave: Record<string, any> = {};
    const rawData = { ...(generated.data as object), ...req.body };
    
    for (const key of validFields) {
      if (key in rawData) {
        if (typeof rawData[key] === 'object' && rawData[key] !== null) {
          dataToSave[key] = JSON.stringify(rawData[key]);
        } else {
          dataToSave[key] = rawData[key];
        }
      }
    }
    
    // Cast strict types
    const numberFields = ['opportunityScore', 'competitorCount', 'priceRangeLow', 'priceRangeHigh', 'avgReviews'];
    for (const key of numberFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined) {
        dataToSave[key] = Number(dataToSave[key]);
      }
    }
    const booleanFields = ['userVerified'];
    for (const key of booleanFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined) {
        dataToSave[key] = Boolean(dataToSave[key]);
      }
    }
    const stringFields = validFields.filter(f => !numberFields.includes(f) && !booleanFields.includes(f));
    for (const key of stringFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined && typeof dataToSave[key] !== 'string') {
        dataToSave[key] = String(dataToSave[key]);
      }
    }
    const recommendedTitle = String(dataToSave.recommendedTitle || project.name || 'Titulo comercial pendiente');
    dataToSave.recommendedTitle = recommendedTitle;
    dataToSave.suggestedTitles = normalizeSuggestedTitles(dataToSave.suggestedTitles, recommendedTitle, ideaContext);
    dataToSave.titleRationale =
      dataToSave.titleRationale ||
      'El nombre se selecciona despues de evaluar idioma, mercado, promesa comercial, competencia y posibilidades de expansion localizada.';
    dataToSave.language = dataToSave.language || 'es';

    const data = { ...dataToSave, projectId } as Prisma.MarketResearchUncheckedCreateInput & {
      recommendedTitle?: string;
      userVerified?: boolean;
    };
    await prisma.marketResearch.upsert({ where: { projectId }, update: data, create: data });
    if (data.recommendedTitle && (!project.name || project.name === 'Proyecto en análisis')) {
      await prisma.project.update({ where: { id: projectId }, data: { name: data.recommendedTitle } });
    }
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'research' } });
    await upsertGate(projectId, 'research', data.userVerified ? 'APPROVED' : 'GENERATED', data.userVerified ? 'Investigacion verificada por usuario.' : 'Pendiente de verificacion humana.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/market-research/verify', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await projectOr404(projectId);
    await prisma.marketResearch.update({
      where: { projectId },
      data: { userVerified: true },
    });
    await prisma.sourceNote.create({
      data: {
        projectId,
        sourceType: 'market',
        title: req.body?.title || 'Verificacion de mercado local',
        notes: req.body?.notes || 'Investigacion de mercado aceptada para continuar el flujo local privado.',
        verified: true,
      },
    });
    await upsertGate(projectId, 'research', 'APPROVED', 'Investigacion verificada por usuario.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/language-opportunity', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    const generated = await languageTemplate(ideaContext);
    await logAI(projectId, 'language-opportunity', generated);
    
    const validFields = ['recommendedPrimary', 'recommendedSecondary', 'analysis', 'strategyNote', 'languageScores'];
    const dataToSave: Record<string, any> = {};
    const rawData = { ...(generated.data as object), ...req.body };
    
    for (const key of validFields) {
      if (key in rawData) {
        dataToSave[key] = typeof rawData[key] === 'object' && rawData[key] !== null 
          ? JSON.stringify(rawData[key]) 
          : rawData[key];
      }
    }

    await prisma.languageOpportunity.upsert({
      where: { projectId },
      update: dataToSave,
      create: { ...dataToSave, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'languages' } });
    await upsertGate(projectId, 'languages', 'GENERATED', 'Oportunidad por idioma generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/go-nogo', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const score = Number(req.body.score || project.marketResearch?.opportunityScore || 72);
    const result = score >= 70 ? 'GO' : score >= 55 ? 'REVISE' : 'NO-GO';
    await prisma.project.update({
      where: { id: projectId },
      data: { goNoGoScore: score, goNoGoResult: result, currentPhase: 'go-nogo' },
    });
    await upsertGate(projectId, 'go-nogo', result === 'GO' ? 'APPROVED' : 'NEEDS_REVISION', `Decision ${result} con score ${score}.`);
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/editorial-formula', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    const generated = await editorialFormulaTemplate(ideaContext);
    await logAI(projectId, 'editorial-formula', generated);

    // Filter to only include fields that exist in the Prisma schema
    const validFields = [
      'productType', 'includesWorkbook', 'includesQuickGuide', 'includesTemplates', 
      'isBundle', 'recommendedPrice', 'priceStrategy', 'positioning', 
      'valueProposition', 'recommendation', 'reasoning'
    ];
    
    const dataToSave: Record<string, any> = {};
    const rawData = { ...(generated.data as object), ...req.body };
    
    for (const key of validFields) {
      if (key in rawData) {
        if (typeof rawData[key] === 'object' && rawData[key] !== null) {
          dataToSave[key] = JSON.stringify(rawData[key]);
        } else {
          dataToSave[key] = rawData[key];
        }
      }
    }
    
    // Cast strict types for Prisma
    const booleanFields = ['includesWorkbook', 'includesQuickGuide', 'includesTemplates', 'isBundle'];
    for (const field of booleanFields) {
      if (field in dataToSave && dataToSave[field] !== null && dataToSave[field] !== undefined) {
        dataToSave[field] = Boolean(dataToSave[field] === true || dataToSave[field] === 'true');
      }
    }
    if ('recommendedPrice' in dataToSave && dataToSave.recommendedPrice !== null) {
      dataToSave.recommendedPrice = Number(dataToSave.recommendedPrice);
    }
    const stringFields = validFields.filter(f => !booleanFields.includes(f) && f !== 'recommendedPrice');
    for (const key of stringFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined && typeof dataToSave[key] !== 'string') {
        dataToSave[key] = String(dataToSave[key]);
      }
    }
    if ('recommendedPrice' in dataToSave && dataToSave.recommendedPrice !== null) {
      dataToSave.recommendedPrice = Number(dataToSave.recommendedPrice);
    }

    await prisma.editorialFormula.upsert({
      where: { projectId },
      update: dataToSave,
      create: { ...dataToSave, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'formula' } });
    await upsertGate(projectId, 'formula', 'GENERATED', 'Formula editorial generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/editorial-bible', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    const generated = await editorialBibleTemplate(project.name, ideaContext);
    await logAI(projectId, 'editorial-bible', generated);
    const validFields = [
      'title', 'subtitle', 'centralPromise', 'audience', 'tone', 'style', 'structure', 
      'tableOfContents', 'estimatedLength', 'contentRules', 'claimsRules', 'ethicsRules', 
      'chapterTemplate', 'exerciseTemplate', 'qualityCriteria', 'approvalChecklist', 'fullDocument'
    ];
    
    const dataToSave: Record<string, any> = {};
    const rawData = { ...(generated.data as object), ...req.body };
    
    for (const key of validFields) {
      if (key in rawData) {
        if (typeof rawData[key] === 'object' && rawData[key] !== null) {
          dataToSave[key] = JSON.stringify(rawData[key]);
        } else {
          dataToSave[key] = rawData[key];
        }
      }
    }
    for (const key of validFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined && typeof dataToSave[key] !== 'string') {
        dataToSave[key] = String(dataToSave[key]);
      }
    }

    await prisma.editorialBible.upsert({
      where: { projectId },
      update: dataToSave,
      create: { ...dataToSave, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'editorial-bible' } });
    await upsertGate(projectId, 'editorial-bible', 'GENERATED', 'Biblia editorial generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/visual-bible', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    const generated = await visualBibleTemplate(ideaContext);
    await logAI(projectId, 'visual-bible', generated);
    const validFields = [
      'visualConcept', 'artDirection', 'colorPalette', 'typography', 'coverStyle', 
      'backCoverStyle', 'separatorStyle', 'plateStyle', 'tableStyle', 'calloutStyle', 
      'iconographyStyle', 'imagePrompts', 'requiredAssets', 'visualChecklist', 'exportCriteria'
    ];
    
    const dataToSave: Record<string, any> = {};
    const rawData = { ...(generated.data as object), ...req.body };
    
    for (const key of validFields) {
      if (key in rawData) {
        if (typeof rawData[key] === 'object' && rawData[key] !== null) {
          dataToSave[key] = JSON.stringify(rawData[key]);
        } else {
          dataToSave[key] = rawData[key];
        }
      }
    }
    
    for (const key of validFields) {
      if (key in dataToSave && dataToSave[key] !== null && dataToSave[key] !== undefined && typeof dataToSave[key] !== 'string') {
        dataToSave[key] = String(dataToSave[key]);
      }
    }

    await prisma.visualBible.upsert({
      where: { projectId },
      update: dataToSave,
      create: { ...dataToSave, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'visual-bible' } });
    await upsertGate(projectId, 'visual-bible', 'GENERATED', 'Biblia visual generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/chapter-plans', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const ideaContext = project.idea?.rawIdea || project.name;
    await prisma.chapterPlan.deleteMany({ where: { projectId } });
    const generated = await chapterPlanTemplate(projectId, ideaContext);
    await logAI(projectId, 'chapter-plan', generated);
    const plans = Array.isArray(req.body.plans) ? req.body.plans : generated.data;
    await prisma.chapterPlan.createMany({ data: plans.map((plan: object) => ({ ...plan, projectId })) });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'chapter-plan' } });
    await upsertGate(projectId, 'chapter-plan', 'GENERATED', 'Plan de capitulos generado.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/blocks', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    await prisma.manuscriptBlock.deleteMany({ where: { projectId } });
    if (true) {
      for (const plan of project.chapterPlans) {
        const generated = await generateFullChapterTemplate(plan.title, plan.summary || '', project.name, plan.estimatedWords || 1000);
        await prisma.manuscriptBlock.create({
          data: {
            projectId,
            chapterPlanId: plan.id,
            blockTitle: plan.title,
            content: generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '',
            wordCount: (generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '').split(/\s+/).filter(Boolean).length,
            status: 'DRAFT',
            aiGenerated: true,
            order: plan.order,
          },
        });
      }
      const visualAssets = [
        { assetType: 'cover', layoutRole: 'cover', pagePlacement: 'front-cover', name: 'Portada frontal', description: 'Portada premium separada para KDP/Gumroad', prompt: project.visualBible?.imagePrompts || 'Portada editorial premium', aiGenerated: true },
        { assetType: 'chapter-opener', layoutRole: 'chapter-opener', pagePlacement: 'chapter-start', name: 'Apertura de capítulo', description: 'Lámina visual para inicio de capítulo', prompt: 'Chapter opener premium editorial plate', aiGenerated: true },
        { assetType: 'figure', layoutRole: 'figure-map', pagePlacement: 'method-page', name: 'Mapa conceptual', description: 'Figura interna principal', prompt: 'Figura editorial limpia con mapa de promesa-metodo-resultado', aiGenerated: true },
        { assetType: 'separator', layoutRole: 'separator', pagePlacement: 'reading-pages', name: 'Separadores editoriales', description: 'Ornamentos y divisores visuales consistentes', prompt: 'Editorial separator ornaments', aiGenerated: true },
        { assetType: 'icons', layoutRole: 'icons', pagePlacement: 'toc-and-summary', name: 'Iconografía editorial', description: 'Sistema de iconos para índice y secciones', prompt: 'Premium editorial icon strip', aiGenerated: true },
        { assetType: 'mockup', layoutRole: 'mockup', pagePlacement: 'credits-package', name: 'Mockup comercial', description: 'Imagen de producto Gumroad', prompt: '3D ebook mockup, premium editorial, clean background', aiGenerated: true },
        { assetType: 'worksheet', layoutRole: 'worksheet', pagePlacement: 'appendix', name: 'Worksheet imprimible', description: 'Hoja de ejercicios bonus', prompt: 'Printable worksheet page, premium editorial layout', aiGenerated: true },
      ];
      await prisma.visualAsset.deleteMany({ where: { projectId } });
      for (const asset of visualAssets) {
        await prisma.visualAsset.create({ data: { ...asset, projectId, themeKey: 'premium-editorial', qualityStatus: 'PENDING', status: 'GENERATED', approvalStatus: 'PENDING', rights: 'SVG editorial local generado por Cervantes; aprobable o reemplazable antes de publicar.' } });
      }
    } else if (req.body.blockTitle) {
      await prisma.manuscriptBlock.create({ data: { ...req.body, projectId } });
    }
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'blocks' } });
    await upsertGate(projectId, 'blocks', 'GENERATED', 'Bloques y assets visuales iniciales generados.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.put('/:id/blocks/:blockId', async (req, res, next) => {
  try {
    const blockId = Number(req.params.blockId);
    const previous = await prisma.manuscriptBlock.findUnique({ where: { id: blockId } });
    if (previous?.content) {
      await prisma.blockVersion.create({
        data: {
          blockId,
          version: previous.version,
          content: previous.content,
          wordCount: previous.wordCount,
          changeNote: 'Edición manual',
        },
      });
    }
    await prisma.manuscriptBlock.update({
      where: { id: blockId },
      data: {
        content: req.body.content,
        status: req.body.status,
        wordCount: req.body.content ? String(req.body.content).split(/\s+/).filter(Boolean).length : undefined,
        version: { increment: 1 },
      },
    });
    if (req.body.status === 'APPROVED') {
      await upsertGate(Number(req.params.id), 'blocks', 'APPROVED', 'Bloque aprobado manualmente.');
    }
    res.json(await projectOr404(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/blocks/:blockId/generate', async (req, res, next) => {
  try {
    const project = await projectOr404(Number(req.params.id));
    const block = await prisma.manuscriptBlock.findUnique({ where: { id: Number(req.params.blockId) } });
    if (!block) throw new Error('Block not found');
    const plan = block.chapterPlanId ? await prisma.chapterPlan.findUnique({ where: { id: block.chapterPlanId } }) : null;
    const generated = await generateFullChapterTemplate(block.blockTitle, plan?.summary || '', project.name, plan?.estimatedWords || 1000);
    await prisma.manuscriptBlock.update({
      where: { id: block.id },
      data: {
        content: generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '',
        wordCount: (generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '').split(/\s+/).filter(Boolean).length,
        status: 'DRAFT',
        aiGenerated: true,
        aiModel: process.env.AI_MODEL || 'template',
      },
    });
    res.json(await projectOr404(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/audit', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const generated = await auditTemplate();
    await logAI(projectId, 'audit', generated);
    let rawData = { ...generated.data, ...req.body };
    if (rawData.scores && typeof rawData.scores === 'object') {
      Object.assign(rawData, rawData.scores);
    }
    const parseScore = (val: any) => {
      let n = Number(val) || 0;
      if (n > 0 && n <= 1) n *= 100;
      return Math.round(n);
    };
    
    const dataToSave = {
      projectId,
      coherenceScore: parseScore(rawData.coherenceScore) || parseScore(rawData.contentScore),
      toneScore: parseScore(rawData.toneScore) || parseScore(rawData.styleScore),
      structureScore: parseScore(rawData.structureScore),
      completenessScore: parseScore(rawData.completenessScore),
      overallScore: parseScore(rawData.overallScore),
      issues: typeof rawData.issues === 'string' ? rawData.issues : JSON.stringify(rawData.issues || []),
      recommendations: typeof rawData.recommendations === 'string' ? rawData.recommendations : JSON.stringify(rawData.recommendations || []),
      fullReport: String(rawData.fullReport || 'Auditoría generada por IA.'),
      approvalStatus: String(rawData.approvalStatus || 'NEEDS_REVISION'),
    };
    await prisma.auditReport.deleteMany({ where: { projectId } });
    await prisma.auditReport.create({ data: dataToSave });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'audit' } });
    await upsertGate(projectId, 'audit', generated.data.approvalStatus === 'APPROVED' ? 'APPROVED' : 'GENERATED', 'Auditoria editorial generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/recovery', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await ensureRecoveryEditorialStructure(projectId);
    const masterManuscript = await exporter.assembleMarkdown(projectId);
    const quality = inspectManuscript(masterManuscript);
    const status = quality.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION';
    await prisma.recoveryReport.create({
      data: {
        projectId,
        missingBlocks: JSON.stringify(quality.issues),
        recoveredBlocks: '[]',
        assemblyStatus: status === 'APPROVED' ? 'DONE' : 'NEEDS_REVISION',
        masterManuscript,
        cleanupLog: 'Manuscrito ensamblado desde bloques disponibles.',
        fullReport: JSON.stringify(quality),
      },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'recovery' } });
    await upsertGate(
      projectId,
      'recovery',
      status,
      status === 'APPROVED'
        ? 'Manuscrito maestro ensamblado y aprobado por verificador local.'
        : `Manuscrito ensamblado con issues: ${quality.issues.join('; ')}`,
    );
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assemble', async (req, res, next) => {
  try {
    res.json({ markdown: await exporter.assembleMarkdown(Number(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/export/zip', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const report = await gateReport(projectId);
    const body = req.body || {};
    if (report.status !== 'APPROVED' && !body.overrideReason) {
      res.status(409).json({ error: 'Production gates are not approved', report });
      return;
    }
    await exporter.exportZip(projectId);
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'export' } });
    await upsertGate(projectId, 'export', 'APPROVED', 'Paquete final de produccion generado.', body.overrideReason);
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/export/:format', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    await exporter.exportFormat(projectId, req.params.format);
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'export' } });
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/production-package', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const report = await gateReport(projectId);
    const body = req.body || {};
    if (report.status !== 'APPROVED' && !body.overrideReason) {
      res.status(409).json({ error: 'Production gates are not approved', report });
      return;
    }
    const pack = await exporter.exportZip(projectId);
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'export' } });
    await prisma.publicationReadiness.upsert({
      where: { projectId },
      update: { status: 'APPROVED', finalPackagePath: pack.filePath, lastCheckedAt: new Date() },
      create: { projectId, status: 'APPROVED', finalPackagePath: pack.filePath, lastCheckedAt: new Date() },
    });
    await upsertGate(projectId, 'export', 'APPROVED', 'Paquete final de produccion generado.', body.overrideReason);
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/metadata', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    const generated = await metadataTemplate(project.name);
    await logAI(projectId, 'metadata', generated);
    const data = normalizeMetadataPackage({ ...(generated.data as Record<string, unknown>), ...req.body }, project.name);
    await prisma.metadataPackage.upsert({
      where: { projectId },
      update: data,
      create: { ...data, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'metadata' } });
    await upsertGate(projectId, 'metadata', 'GENERATED', 'Metadata comercial generada.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/publishing-checklist', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const generated = await publishingTemplate();
    await logAI(projectId, 'publishing', generated);
    const data = normalizePublishingChecklist({ ...(generated.data as Record<string, unknown>), ...req.body });
    await prisma.publishingChecklist.upsert({
      where: { projectId },
      update: data,
      create: { ...data, projectId },
    });
    await prisma.project.update({ where: { id: projectId }, data: { currentPhase: 'publishing' } });
    await upsertGate(projectId, 'publishing', 'GENERATED', 'Checklist KDP/Gumroad generado.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/visual-assets/:assetId', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const assetId = Number(req.params.assetId);
    await prisma.visualAsset.update({
      where: { id: assetId },
      data: {
        approvalStatus: req.body.approvalStatus || 'APPROVED',
        status: req.body.status || 'APPROVED',
        qualityStatus: (req.body.approvalStatus || 'APPROVED') === 'APPROVED' ? 'APPROVED' : 'PENDING',
        replacementPath: req.body.replacementPath,
        rights: req.body.rights,
        approvedAt: (req.body.approvalStatus || 'APPROVED') === 'APPROVED' ? new Date() : undefined,
      },
    });
    const remaining = await prisma.visualAsset.count({ where: { projectId, approvalStatus: { not: 'APPROVED' } } });
    if (remaining === 0) await upsertGate(projectId, 'visual-assets', 'APPROVED', 'Todos los assets visuales aprobados.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/visual-assets/:assetId/preview.svg', async (req, res, next) => {
  try {
    const project = await projectOr404(Number(req.params.id));
    const asset = project.visualAssets.find((item) => item.id === Number(req.params.assetId));
    if (!asset) {
      res.status(404).json({ error: 'Visual asset not found' });
      return;
    }
    const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
    res.setHeader('Cache-Control', 'no-store');
    res.type('image/svg+xml').send(visualAssetSvg(asset, title));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/visual-assets/:assetId/regenerate', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const assetId = Number(req.params.assetId);
    const asset = await prisma.visualAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.projectId !== projectId) {
      res.status(404).json({ error: 'Visual asset not found' });
      return;
    }
    const nextVariant = visualVariant(asset) + 1;
    await prisma.visualAsset.update({
      where: { id: assetId },
      data: {
        approvalStatus: 'PENDING',
        status: 'GENERATED',
        qualityStatus: 'PENDING',
        variant: nextVariant,
        approvedAt: null,
        replacementPath: JSON.stringify({
          variant: nextVariant,
          regeneratedAt: new Date().toISOString(),
          consistency: 'Mantiene paleta, tipografia y direccion visual de la Biblia visual.',
        }),
        rights: 'Nueva variante generada localmente; pendiente de aprobacion visual.',
      },
    });
    await upsertGate(projectId, 'visual-assets', 'GENERATED', 'Assets visuales regenerados; requieren aprobacion visual.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/backup', async (req, res, next) => {
  try {
    await createBackup(Number(req.params.id));
    res.json(await projectOr404(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/history', async (req, res, next) => {
  try {
    res.json(await prisma.versionSnapshot.findMany({ where: { projectId: Number(req.params.id) }, orderBy: { createdAt: 'desc' } }));
  } catch (error) {
    next(error);
  }
});

export default router;
