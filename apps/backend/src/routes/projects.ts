import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
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
import { SelectiveRegenerationService } from '../editorial/selectiveRegenerationService';
import { EditorialThemeEngine } from '../editorial/themeEngine';

const router = Router();
const exporter = new ExportService();
const layoutService = new EditorialLayoutService();
const selectiveRegen = new SelectiveRegenerationService();
const root = path.resolve(__dirname, '../../../..');
const exportDir = path.join(root, 'storage', 'exports');

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

function isWithinExports(filePath: string) {
  const resolved = path.resolve(filePath);
  const base = path.resolve(exportDir);
  return resolved === base || resolved.startsWith(`${base}${path.sep}`);
}

function parseReplacementPath(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { filePath?: unknown; source?: unknown; provider?: unknown; variant?: unknown };
    const filePath = typeof parsed.filePath === 'string' ? parsed.filePath : undefined;
    if (filePath && isWithinExports(filePath)) return { ...parsed, filePath };
    return parsed;
  } catch {
    return isWithinExports(value) ? { filePath: value } : null;
  }
}

function mimeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/svg+xml';
}

function extensionFromMime(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('svg+xml')) return 'svg';
  return 'png';
}

function decodeImageDataUrl(dataUrl: unknown) {
  if (typeof dataUrl !== 'string') throw new Error('dataUrl is required');
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error('Unsupported image data URL');
  return {
    mimeType: match[1].replace('image/jpg', 'image/jpeg'),
    buffer: Buffer.from(match[2].replace(/\s/g, ''), 'base64'),
  };
}

async function fileExists(filePath?: string | null) {
  if (!filePath) return false;
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 256;
  } catch {
    return false;
  }
}

async function latestExistingPdf(projectId: number) {
  const latestBuild = await prisma.formatBuild.findFirst({
    where: { projectId, format: 'pdf', status: 'DONE' },
    orderBy: { createdAt: 'desc' },
  });
  if (latestBuild?.filePath && await fileExists(latestBuild.filePath)) return latestBuild.filePath;

  try {
    const files = await fs.readdir(exportDir);
    const candidates = await Promise.all(
      files
        .filter((file) => file.startsWith(`${projectId}-`) && file.toLowerCase().endsWith('.pdf'))
        .map(async (file) => {
          const filePath = path.join(exportDir, file);
          const stat = await fs.stat(filePath);
          return stat.isFile() && stat.size > 256 ? { filePath, mtime: stat.mtimeMs } : null;
        }),
    );
    return candidates
      .filter((candidate): candidate is { filePath: string; mtime: number } => Boolean(candidate))
      .sort((a, b) => b.mtime - a.mtime)[0]?.filePath || null;
  } catch {
    return null;
  }
}

function buildExternalImagePrompt(project: Awaited<ReturnType<typeof projectOr404>>, asset: NonNullable<Awaited<ReturnType<typeof projectOr404>>['visualAssets']>[number]) {
  const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
  const style = asset.themeKey || project.visualBible?.visualConcept || 'premium editorial';
  const language = project.languageOpportunity?.recommendedPrimary || project.marketResearch?.language || 'es';
  const basePrompt = cleanPromptLike(asset.prompt || asset.description || asset.name);
  const rolePrompts: Record<string, string> = {
    cover: 'vertical premium front cover, commercial book cover, strong focal composition, no price text, no promotional badges, readable title area, editorial texture',
    'chapter-opener': 'wide chapter opening illustration, immersive editorial plate, cinematic but refined, no clutter, no tiny text',
    figure: 'premium conceptual editorial figure, useful visual explanation, elegant diagram blended with illustration, not PowerPoint, no tiny text',
    separator: 'ornamental editorial separator, refined linework, transparent-like clean composition, consistent book ornament',
    icons: 'consistent premium icon set, flat editorial symbols, coherent stroke weight, no text',
    mockup: 'premium 3D ebook mockup for product page, clean commercial lighting, elegant background, no fake marketplace logos',
    worksheet: 'premium printable worksheet page, editorial stationery style, clean fields, checklist elements, no illegible microtext',
  };
  return [
    `Create a professional ebook visual asset for "${title}".`,
    `Editorial role: ${asset.name} (${asset.layoutRole || asset.assetType}).`,
    `Required use inside the ebook: ${asset.pagePlacement || 'publishing package'}.`,
    `Style direction: ${style}.`,
    `Language context: ${language}.`,
    `Design brief: ${basePrompt}.`,
    `Asset-specific instruction: ${rolePrompts[asset.assetType] || rolePrompts[asset.layoutRole || ''] || 'premium editorial image with clear hierarchy'}.`,
    'The result must feel designed by a premium editorial art director, not AI generic art, not a slide deck, not a chatbot export.',
    'Use coherent palette, tactile texture, elegant hierarchy, and a consistent visual system.',
    'Avoid visible watermarks, platform logos, malformed text, distorted typography, low resolution, cheap stock-photo look, and random symbols.',
  ].join('\n');
}

function cleanPromptLike(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(' / ');
    if (parsed && typeof parsed === 'object') return Object.values(parsed).map(String).join(' / ');
  } catch {
    // Use raw value below.
  }
  return value;
}

function getLocalSvgFallback(asset: { assetType: string; name: string; prompt?: string | null; replacementPath?: string | null; layoutRole?: string | null }, title: string) {
  const variant = visualVariant(asset) % 3;
  const palette = [
    { ink: '#111315', paper: '#Fdfcf9', teal: '#1f4e5b', gold: '#c9a227', coral: '#d95d39', mist: '#e4ebed' },
    { ink: '#151716', paper: '#f4f0e8', teal: '#2a4d46', gold: '#bfa15f', coral: '#a34838', mist: '#e0e5e3' },
    { ink: '#101214', paper: '#f8f9fa', teal: '#3b5998', gold: '#f4c430', coral: '#e05a47', mist: '#d9e0e8' },
  ][variant];
  const role = asset.layoutRole || asset.assetType;
  const displayTitle = cleanPromptLike(asset.prompt || asset.name || title)
    .replace(/[{}[\]"]/g, '')
    .split(/[.;|/]/)[0]
    .trim()
    .slice(0, 96) || asset.name;
  const chapterLabel = title.length > 58 ? `${title.slice(0, 55)}...` : title;

  const commonDefs = `
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000" flood-opacity="0.35"/>
      </filter>
      <linearGradient id="premiumBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.ink}"/>
        <stop offset="100%" stop-color="${palette.teal}"/>
      </linearGradient>
      <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.gold}"/>
        <stop offset="100%" stop-color="#fff"/>
      </linearGradient>
      <radialGradient id="plateGlow" cx="50%" cy="38%" r="58%">
        <stop offset="0%" stop-color="${palette.gold}" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="${palette.teal}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${palette.ink}" stop-opacity="0"/>
      </radialGradient>
    </defs>
  `;

  if (asset.assetType === 'cover') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400">
      ${commonDefs}
      <rect width="1600" height="2400" fill="url(#premiumBg)"/>
      <rect width="1600" height="2400" fill="url(#noise)" style="mix-blend-mode: overlay;" />
      <rect x="86" y="86" width="1428" height="2228" fill="none" stroke="${palette.gold}" stroke-width="8" opacity="0.85"/>
      <rect x="132" y="132" width="1336" height="2136" fill="none" stroke="${palette.paper}" stroke-width="2" opacity="0.22"/>
      <g opacity="0.75">
        <path d="M160 210h210M1230 210h210M160 2190h210M1230 2190h210" stroke="${palette.gold}" stroke-width="4"/>
        <path d="M210 160v210M1390 160v210M210 2030v210M1390 2030v210" stroke="${palette.gold}" stroke-width="4"/>
        <circle cx="210" cy="210" r="34" fill="none" stroke="${palette.gold}" stroke-width="3"/>
        <circle cx="1390" cy="210" r="34" fill="none" stroke="${palette.gold}" stroke-width="3"/>
        <circle cx="210" cy="2190" r="34" fill="none" stroke="${palette.gold}" stroke-width="3"/>
        <circle cx="1390" cy="2190" r="34" fill="none" stroke="${palette.gold}" stroke-width="3"/>
      </g>
      <rect x="250" y="380" width="1100" height="760" fill="#000" opacity="0.18" filter="url(#shadow)"/>
      <rect x="288" y="418" width="1024" height="684" fill="${palette.ink}" opacity="0.62" stroke="${palette.gold}" stroke-width="3"/>
      <circle cx="800" cy="720" r="245" fill="url(#plateGlow)"/>
      <circle cx="800" cy="720" r="238" fill="none" stroke="${palette.gold}" stroke-width="3"/>
      <circle cx="800" cy="720" r="154" fill="none" stroke="${palette.paper}" stroke-width="2" opacity="0.28"/>
      <path d="M690 830 L800 560 L910 830 Z" fill="none" stroke="url(#goldGradient)" stroke-width="22" stroke-linejoin="round"/>
      <path d="M705 875 C760 928 842 928 895 875" fill="none" stroke="${palette.coral}" stroke-width="14" stroke-linecap="round"/>
      ${Array.from({ length: 18 }).map((_, i) => `<circle cx="${390 + ((i * 79) % 820)}" cy="${470 + ((i * 137) % 540)}" r="${i % 3 === 0 ? 4 : 2}" fill="${palette.gold}" opacity="${0.35 + (i % 4) * 0.12}"/>`).join('')}
      <text x="800" y="1275" fill="${palette.gold}" font-family="Georgia, serif" font-size="38" text-anchor="middle" letter-spacing="9">GUIA PREMIUM</text>
      <line x1="430" y1="1330" x2="1170" y2="1330" stroke="${palette.gold}" stroke-width="3"/>
      ${svgTitleLines(title, 800, 1488, 20, 82)}
      <text x="800" y="2050" fill="${palette.paper}" opacity="0.72" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" letter-spacing="4">CERVANTES EDITORIAL SYSTEM</text>
      <text x="800" y="2124" fill="${palette.gold}" opacity="0.75" font-family="Georgia, serif" font-size="24" text-anchor="middle">edicion visual local</text>
    </svg>`;
  }

  if (role === 'chapter-opener' || asset.assetType === 'chapter-opener') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      ${commonDefs}
      <rect width="1200" height="800" fill="url(#premiumBg)"/>
      <rect width="1200" height="800" fill="url(#noise)" style="mix-blend-mode: overlay;"/>
      <rect x="62" y="62" width="1076" height="676" fill="none" stroke="${palette.gold}" stroke-width="5"/>
      <rect x="104" y="104" width="992" height="592" fill="${palette.ink}" opacity="0.32" stroke="${palette.paper}" stroke-opacity="0.16"/>
      <g transform="translate(122 134)">
        <text x="0" y="34" fill="${palette.gold}" font-family="Georgia, serif" font-size="24" letter-spacing="5">APERTURA DE CAPITULO</text>
        <line x1="0" y1="62" x2="390" y2="62" stroke="${palette.gold}" stroke-width="3"/>
        <text x="0" y="178" fill="${palette.paper}" font-family="Georgia, serif" font-size="64" font-weight="700">${asset.name}</text>
        <text x="0" y="248" fill="${palette.mist}" font-family="Arial, sans-serif" font-size="28">${chapterLabel}</text>
        <rect x="0" y="328" width="470" height="150" fill="${palette.paper}" opacity="0.08" stroke="${palette.gold}" stroke-opacity="0.55"/>
        <text x="34" y="384" fill="${palette.gold}" font-family="Georgia, serif" font-size="28">Promesa de lectura</text>
        <text x="34" y="428" fill="${palette.paper}" font-family="Arial, sans-serif" font-size="22">Una entrada visual, clara y editorial al tema.</text>
      </g>
      <g transform="translate(770 168)">
        <circle cx="150" cy="190" r="154" fill="none" stroke="${palette.gold}" stroke-width="3"/>
        <circle cx="150" cy="190" r="98" fill="${palette.paper}" opacity="0.08"/>
        <path d="M92 256 C148 116 242 88 308 56 C272 142 246 246 92 256Z" fill="${palette.gold}" opacity="0.82"/>
        <path d="M-26 414 H326" stroke="${palette.gold}" stroke-width="3"/>
        <text x="150" y="470" fill="${palette.paper}" font-family="Georgia, serif" font-size="24" text-anchor="middle">ritmo - metodo - practica</text>
      </g>
    </svg>`;
  }

  if (asset.assetType === 'figure' || role.includes('figure')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      ${commonDefs}
      <rect width="1200" height="800" fill="${palette.paper}"/>
      <rect width="1200" height="800" fill="url(#noise)" style="mix-blend-mode: multiply;"/>
      <rect x="64" y="54" width="1072" height="692" fill="none" stroke="${palette.gold}" stroke-width="5"/>
      <text x="110" y="118" fill="${palette.ink}" font-family="Georgia, serif" font-size="46" font-weight="700">Mapa editorial del metodo</text>
      <text x="112" y="158" fill="#526064" font-family="Arial, sans-serif" font-size="20">${displayTitle}</text>
      <g transform="translate(600 408)">
        <circle cx="0" cy="0" r="118" fill="${palette.ink}" filter="url(#shadow)"/>
        <circle cx="0" cy="0" r="92" fill="none" stroke="${palette.gold}" stroke-width="4"/>
        <text x="0" y="-12" fill="${palette.paper}" font-family="Georgia, serif" font-size="32" text-anchor="middle">Metodo</text>
        <text x="0" y="28" fill="${palette.gold}" font-family="Arial, sans-serif" font-size="18" text-anchor="middle">decision aplicable</text>
        <path d="M-125 -42 C-230 -78 -304 -130 -384 -206" fill="none" stroke="${palette.teal}" stroke-width="7"/>
        <path d="M125 -42 C230 -78 304 -130 384 -206" fill="none" stroke="${palette.coral}" stroke-width="7"/>
        <path d="M-124 54 C-232 94 -304 142 -384 210" fill="none" stroke="${palette.gold}" stroke-width="7"/>
        <path d="M124 54 C232 94 304 142 384 210" fill="none" stroke="#526064" stroke-width="7"/>
      </g>
      ${[
        ['Observa', 'senales concretas', 116, 188, palette.teal, '#fff'],
        ['Interpreta', 'elige criterio', 828, 188, palette.coral, '#fff'],
        ['Aplica', 'paso simple', 116, 568, palette.gold, palette.ink],
        ['Registra', 'mejora semanal', 828, 568, '#526064', '#fff'],
      ].map(([head, sub, x, y, fill, text]) => `<g><rect x="${x}" y="${y}" width="256" height="118" fill="${fill}" filter="url(#shadow)"/><text x="${Number(x) + 128}" y="${Number(y) + 48}" fill="${text}" font-family="Georgia, serif" font-size="30" text-anchor="middle">${head}</text><text x="${Number(x) + 128}" y="${Number(y) + 82}" fill="${text}" opacity="0.78" font-family="Arial, sans-serif" font-size="17" text-anchor="middle">${sub}</text></g>`).join('')}
      <line x1="108" y1="704" x2="1092" y2="704" stroke="${palette.gold}" stroke-width="3"/>
      <text x="110" y="732" fill="#526064" font-family="Arial, sans-serif" font-size="17">Figura interna editable para explicar el sistema de la obra con coherencia visual.</text>
    </svg>`;
  }

  if (asset.assetType === 'separator' || role.includes('separator')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420">
      ${commonDefs}
      <rect width="1200" height="420" fill="${palette.paper}"/>
      <rect width="1200" height="420" fill="url(#noise)" style="mix-blend-mode: multiply;"/>
      <line x1="92" y1="210" x2="1108" y2="210" stroke="${palette.gold}" stroke-width="5"/>
      <line x1="190" y1="180" x2="1010" y2="180" stroke="${palette.ink}" stroke-width="1" opacity="0.35"/>
      <line x1="190" y1="240" x2="1010" y2="240" stroke="${palette.ink}" stroke-width="1" opacity="0.35"/>
      <g transform="translate(600 210)">
        <circle cx="0" cy="0" r="74" fill="${palette.ink}" filter="url(#shadow)"/>
        <circle cx="0" cy="0" r="48" fill="none" stroke="${palette.gold}" stroke-width="4"/>
        <path d="M-30 26 L0 -42 L30 26Z" fill="${palette.gold}"/>
        <path d="M-205 0 C-140 -80 -90 -80 -38 0 C-90 80 -140 80 -205 0Z" fill="none" stroke="${palette.teal}" stroke-width="4"/>
        <path d="M205 0 C140 -80 90 -80 38 0 C90 80 140 80 205 0Z" fill="none" stroke="${palette.coral}" stroke-width="4"/>
      </g>
      <text x="600" y="350" fill="${palette.ink}" font-family="Georgia, serif" font-size="26" text-anchor="middle">Separador editorial de lectura</text>
    </svg>`;
  }

  if (asset.assetType === 'icons' || role.includes('icon')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 620">
      ${commonDefs}
      <rect width="1200" height="620" fill="${palette.paper}"/>
      <rect width="1200" height="620" fill="url(#noise)" style="mix-blend-mode: multiply;"/>
      <text x="94" y="94" fill="${palette.ink}" font-family="Georgia, serif" font-size="42" font-weight="700">Iconografia editorial</text>
      <text x="96" y="132" fill="#526064" font-family="Arial, sans-serif" font-size="20">Sistema visual para resumenes, pasos y alertas dentro del ebook.</text>
      ${[
        ['Ruta', 'M', palette.teal],
        ['Clave', 'K', palette.gold],
        ['Practica', 'P', palette.coral],
        ['Cierre', 'C', '#526064'],
      ].map(([label, mark, fill], i) => {
        const x = 150 + i * 250;
        return `<g transform="translate(${x} 230)" filter="url(#shadow)">
          <rect x="-72" y="-72" width="144" height="144" fill="${fill}" rx="18"/>
          <circle cx="0" cy="0" r="46" fill="none" stroke="${palette.paper}" stroke-width="5" opacity="0.82"/>
          <text x="0" y="16" fill="${palette.paper}" font-family="Georgia, serif" font-size="46" text-anchor="middle">${mark}</text>
          <text x="0" y="122" fill="${palette.ink}" font-family="Georgia, serif" font-size="27" text-anchor="middle">${label}</text>
        </g>`;
      }).join('')}
      <rect x="86" y="508" width="1028" height="4" fill="${palette.gold}"/>
    </svg>`;
  }

  if (asset.assetType === 'worksheet' || role.includes('worksheet')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1300">
      ${commonDefs}
      <rect width="1000" height="1300" fill="${palette.paper}"/>
      <rect width="1000" height="1300" fill="url(#noise)" style="mix-blend-mode: multiply;"/>
      <rect x="88" y="78" width="824" height="1144" fill="#fffdf8" stroke="${palette.gold}" stroke-width="5" filter="url(#shadow)"/>
      <text x="150" y="170" fill="${palette.ink}" font-family="Georgia, serif" font-size="54" font-weight="700">Worksheet editorial</text>
      <text x="154" y="216" fill="#526064" font-family="Arial, sans-serif" font-size="22">${displayTitle}</text>
      <rect x="150" y="258" width="700" height="2" fill="${palette.gold}"/>
      ${[0, 1, 2, 3, 4].map((row) => `<g transform="translate(150 ${330 + row * 120})">
        <rect width="42" height="42" fill="none" stroke="${palette.teal}" stroke-width="6"/>
        <text x="66" y="30" fill="${palette.ink}" font-family="Georgia, serif" font-size="27">Accion ${row + 1}</text>
        <line x1="66" y1="58" x2="700" y2="58" stroke="#526064" stroke-width="2" opacity="0.5"/>
        <line x1="66" y1="92" x2="${620 - row * 24}" y2="92" stroke="${row === 2 ? palette.coral : palette.mist}" stroke-width="9"/>
      </g>`).join('')}
      <rect x="150" y="1018" width="700" height="112" fill="${palette.mist}" opacity="0.65"/>
      <text x="184" y="1070" fill="${palette.ink}" font-family="Georgia, serif" font-size="28">Nota de seguimiento</text>
      <line x1="184" y1="1104" x2="810" y2="1104" stroke="${palette.ink}" stroke-width="2" opacity="0.2"/>
      <text x="500" y="1180" fill="${palette.gold}" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" letter-spacing="3">CERVANTES WORKBOOK</text>
    </svg>`;
  }

  if (asset.assetType === 'mockup') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      ${commonDefs}
      <rect width="1200" height="800" fill="${palette.paper}"/>
      <rect width="1200" height="800" fill="url(#noise)" style="mix-blend-mode: multiply;" />
      <ellipse cx="600" cy="650" rx="350" ry="40" fill="#000" opacity="0.15" filter="url(#shadow)"/>
      <g filter="url(#shadow)" transform="translate(420, 150)">
        <path d="M0 60 L240 0 L240 450 L0 510 Z" fill="${palette.teal}"/>
        <path d="M240 0 L320 40 L320 490 L240 450 Z" fill="${palette.gold}"/>
        <path d="M0 60 L80 100 L320 40 L240 0 Z" fill="${palette.mist}" opacity="0.9"/>
        <line x1="20" y1="120" x2="220" y2="70" stroke="${palette.gold}" stroke-width="4"/>
        <circle cx="120" cy="250" r="40" fill="none" stroke="${palette.paper}" stroke-width="4"/>
      </g>
      <text x="600" y="730" fill="${palette.ink}" font-family="Georgia, serif" font-size="36" text-anchor="middle" letter-spacing="4">MOCKUP COMERCIAL 3D</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    ${commonDefs}
    <rect width="1200" height="800" fill="${palette.paper}"/>
    <rect width="1200" height="800" fill="url(#noise)" style="mix-blend-mode: multiply;" />
    <g transform="translate(150, 100)">
      <rect width="900" height="600" fill="#fff" filter="url(#shadow)" rx="12"/>
      <text x="80" y="100" fill="${palette.ink}" font-family="Georgia, serif" font-size="48" font-weight="bold">${asset.name}</text>
      <rect x="80" y="140" width="120" height="6" fill="${palette.gold}"/>
      <circle cx="800" cy="100" r="40" fill="${palette.teal}" opacity="0.1"/>
      ${[0,1,2].map(i => `<rect x="80" y="${250 + i*100}" width="740" height="2" fill="${palette.mist}"/><rect x="80" y="${220 + i*100}" width="300" height="14" fill="${palette.teal}" opacity="0.2"/>`).join('')}
    </g>
  </svg>`;
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
    const projectId = Number(req.params.id);
    const latest = await prisma.editorialLayout.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
    if (latest?.renderedHtmlPath) {
      const html = await fs.readFile(latest.renderedHtmlPath, 'utf8');
      res.type('html').send(html.replace(/(["'(])assets\//g, `$1/api/projects/${projectId}/assets/`));
    } else {
      res.type('html').send(await exporter.previewHtml(projectId));
    }
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview.pdf', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const existingPdf = await latestExistingPdf(projectId);
    if (existingPdf) {
      res.setHeader('Cache-Control', 'no-store');
      return res.download(existingPdf, 'ebook_preview.pdf');
    }
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
    const rendered = await layoutService.renderProject(projectId, { assetBase: `/api/projects/${projectId}/assets`, themeKey: req.body?.themeKey });
    await upsertGate(projectId, 'preview', rendered.report.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION', `Maquetacion visual: ${rendered.report.status}`);
    res.json({
      status: rendered.report.status,
      htmlPath: rendered.htmlPath,
      report: rendered.report,
      artDirection: rendered.artDirection,
      professionalReport: rendered.professionalReport,
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

// --- Page Builder Routes ---

router.get('/:id/layout/styles', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const recommendation = await layoutService.artDirectionReport(projectId).catch(() => null);
    const styles = EditorialThemeEngine.styles().map(s => ({
      key: s.key,
      variant: s.variant,
      colors: s.colors,
      density: s.density,
      ornament: s.ornament,
      recommended: recommendation?.styleKey === s.key,
    }));
    res.json({ styles, recommendation });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/layout/pages', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    let pages = await selectiveRegen.pages(projectId);
    if (pages.length === 0) {
      const rendered = await layoutService.renderProject(projectId, { assetBase: `/api/projects/${projectId}/assets` });
      pages = rendered.layout.pages.map((page, index) => ({
        id: page.id,
        type: page.type,
        originalType: page.originalType || page.type,
        title: page.title,
        subtitle: page.subtitle,
        assetRole: page.assetRole,
        chapterNumber: page.chapterNumber,
        status: page.status || 'APPROVED',
        variant: page.variant || index % 3,
        qualityNote: page.qualityNote || 'Página generada por la maqueta premium.',
        number: index + 1,
      }));
    }
    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/layout/pages/:pageId/regenerate', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const pageId = req.params.pageId;
    await selectiveRegen.regeneratePage(projectId, pageId);
    const pages = await selectiveRegen.pages(projectId);
    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/layout/pages/:pageId/approve', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const pageId = req.params.pageId;
    await selectiveRegen.approvePage(projectId, pageId);
    const pages = await selectiveRegen.pages(projectId);
    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/layout/pages/:pageId/template', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const pageId = req.params.pageId;
    const { template } = req.body;
    await selectiveRegen.changeTemplate(projectId, pageId, template);
    const pages = await selectiveRegen.pages(projectId);
    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/art-direction/apply', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const report = await layoutService.applyArtDirection(projectId, req.body?.styleKey);
    await upsertGate(projectId, 'preview', report.layoutStatus === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION', `Direccion de arte aplicada: ${report.styleKey}`);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/art-direction/report', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    res.json(await layoutService.artDirectionReport(projectId));
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
    const filePath = await exporter.assetPath(Number(req.params.id), req.params.assetName);
    res.type(mimeFromPath(filePath)).sendFile(filePath);
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

router.get('/:id/blocks/stream', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const project = await projectOr404(projectId);
    
    // Configurar cabeceras para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Aprobar el Índice porque ya pasamos a bloques
    await upsertGate(projectId, 'chapter-plan', 'APPROVED', 'Aprobado al comenzar la generación de bloques');

    await prisma.manuscriptBlock.deleteMany({ where: { projectId } });

    const totalChapters = project.chapterPlans.length;
    let currentChapterIndex = 0;
    
    for (const plan of project.chapterPlans) {
      currentChapterIndex++;
      sendEvent({ currentChapterIndex, chapterProgress: 0, globalProgress: Math.round(((currentChapterIndex - 1) / totalChapters) * 100), message: `Generando capítulo ${currentChapterIndex} de ${totalChapters}: ${plan.title}...` });
      
      const generated = await generateFullChapterTemplate(plan.title, plan.summary || '', project.name, plan.estimatedWords || 1000, (progress) => {
        sendEvent({ currentChapterIndex, chapterProgress: progress, globalProgress: Math.round(((currentChapterIndex - 1) / totalChapters) * 100), message: `Escribiendo partes del capítulo ${currentChapterIndex}...` });
      });
      const content = generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '';
      const wordCount = String(content).split(/\s+/).filter(Boolean).length;
      
      await prisma.manuscriptBlock.create({
        data: {
          projectId,
          chapterPlanId: plan.id,
          blockTitle: plan.title,
          content: String(content),
          wordCount,
          status: generated.data.externalAiUsed ? 'DRAFT' : 'NEEDS_REVISION',
          aiGenerated: true,
          aiModel: `${generated.data.providers || generated.provider}${generated.data.generationWarnings ? ` | ${generated.data.generationWarnings}` : ''}`.slice(0, 240),
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
    
    sendEvent({ done: true });
    res.end();
  } catch (error) {
    console.error('Error en SSE blocks:', error);
    res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' })}\n\n`);
    res.end();
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
        const content = generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '';
        const wordCount = String(content).split(/\s+/).filter(Boolean).length;
        await prisma.manuscriptBlock.create({
          data: {
            projectId,
            chapterPlanId: plan.id,
            blockTitle: plan.title,
            content: String(content),
            wordCount,
            status: generated.data.externalAiUsed ? 'DRAFT' : 'NEEDS_REVISION',
            aiGenerated: true,
            aiModel: `${generated.data.providers || generated.provider}${generated.data.generationWarnings ? ` | ${generated.data.generationWarnings}` : ''}`.slice(0, 240),
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
    const content = generated.data.content || Object.values(generated.data).find(v => typeof v === 'string') || '';
    const wordCount = String(content).split(/\s+/).filter(Boolean).length;
    await prisma.manuscriptBlock.update({
      where: { id: block.id },
      data: {
        content: String(content),
        wordCount,
        status: generated.data.externalAiUsed ? 'DRAFT' : 'NEEDS_REVISION',
        aiGenerated: true,
        aiModel: `${generated.data.providers || generated.provider}${generated.data.generationWarnings ? ` | ${generated.data.generationWarnings}` : ''}`.slice(0, 240),
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

router.get('/:id/visual-assets/:assetId/prompt', async (req, res, next) => {
  try {
    const project = await projectOr404(Number(req.params.id));
    const asset = project.visualAssets.find((item) => item.id === Number(req.params.assetId));
    if (!asset) {
      res.status(404).json({ error: 'Visual asset not found' });
      return;
    }
    const prompt = buildExternalImagePrompt(project, asset);
    res.json({
      prompt,
      provider: 'puter',
      fallbackProvider: 'local-svg',
      model: req.query.model || 'auto',
      asset: {
        id: asset.id,
        role: asset.layoutRole || asset.assetType,
        type: asset.assetType,
        name: asset.name,
        themeKey: asset.themeKey,
      },
      recommended: asset.assetType === 'cover'
        ? { width: 1600, height: 2400, aspectRatio: '2:3' }
        : { width: 1200, height: 720, aspectRatio: '5:3' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/visual-assets/:assetId/external-result', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const assetId = Number(req.params.assetId);
    const asset = await prisma.visualAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.projectId !== projectId) {
      res.status(404).json({ error: 'Visual asset not found' });
      return;
    }
    const decoded = decodeImageDataUrl(req.body.dataUrl);
    if (decoded.buffer.length < 1024) throw new Error('Generated image is too small');
    const nextVariant = (asset.variant || 0) + 1;
    const assetDir = path.join(exportDir, `project-${projectId}-external-ai-assets`);
    await fs.mkdir(assetDir, { recursive: true });
    const fileName = `${slugify(asset.layoutRole || asset.assetType || asset.name)}-${assetId}-v${nextVariant}.${extensionFromMime(decoded.mimeType)}`;
    const filePath = path.join(assetDir, fileName);
    await fs.writeFile(filePath, decoded.buffer);
    const previousHistory = parseJsonArray(asset.variantHistory);
    const nextHistory = [
      ...previousHistory,
      {
        variant: nextVariant,
        provider: req.body.provider || 'puter',
        model: req.body.model || 'auto',
        filePath,
        createdAt: new Date().toISOString(),
      },
    ].slice(-12);
    await prisma.visualAsset.update({
      where: { id: assetId },
      data: {
        filePath,
        replacementPath: JSON.stringify({
          source: 'external-ai',
          provider: req.body.provider || 'puter',
          model: req.body.model || 'auto',
          filePath,
          variant: nextVariant,
          generatedAt: new Date().toISOString(),
        }),
        prompt: typeof req.body.prompt === 'string' ? req.body.prompt : asset.prompt,
        externalProvider: String(req.body.provider || 'puter'),
        externalModel: String(req.body.model || 'auto'),
        externalPrompt: typeof req.body.prompt === 'string' ? req.body.prompt : null,
        externalStatus: 'GENERATED',
        externalError: null,
        mimeType: decoded.mimeType,
        aiGenerated: true,
        status: 'GENERATED',
        approvalStatus: 'PENDING',
        qualityStatus: 'PENDING',
        variant: nextVariant,
        variantHistory: JSON.stringify(nextHistory),
        approvedAt: null,
        rights: req.body.rights || 'Imagen generada por proveedor externo via Puter.js; revisar terminos/licencia antes de publicar externamente.',
      },
    });
    await upsertGate(projectId, 'visual-assets', 'GENERATED', 'Imagen IA externa generada; requiere aprobacion visual.');
    res.json(await projectOr404(projectId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/visual-assets/:assetId/external-fallback', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const assetId = Number(req.params.assetId);
    const asset = await prisma.visualAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.projectId !== projectId) {
      res.status(404).json({ error: 'Visual asset not found' });
      return;
    }
    await prisma.visualAsset.update({
      where: { id: assetId },
      data: {
        externalProvider: String(req.body.provider || 'puter'),
        externalModel: String(req.body.model || 'auto'),
        externalPrompt: typeof req.body.prompt === 'string' ? req.body.prompt : asset.prompt,
        externalStatus: 'FALLBACK_USED',
        externalError: String(req.body.error || 'External provider unavailable'),
        replacementPath: JSON.stringify({
          source: 'local-svg-fallback',
          provider: req.body.provider || 'puter',
          fallbackAt: new Date().toISOString(),
        }),
        status: 'GENERATED',
        approvalStatus: 'PENDING',
        qualityStatus: 'PENDING',
        rights: 'Fallback SVG local de Cervantes usado porque el proveedor IA externo no entrego una imagen usable.',
      },
    });
    await upsertGate(projectId, 'visual-assets', 'GENERATED', 'Proveedor externo no disponible; fallback local activo.');
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
    const replacement = parseReplacementPath(String(asset.replacementPath || ''));
    if (replacement?.filePath && await fileExists(String(replacement.filePath))) {
      res.setHeader('Cache-Control', 'no-store');
      res.type(String(asset.mimeType || mimeFromPath(String(replacement.filePath)))).sendFile(String(replacement.filePath));
      return;
    }
    const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
    res.setHeader('Cache-Control', 'no-store');
    res.type('image/svg+xml').send(getLocalSvgFallback(asset, title));
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
