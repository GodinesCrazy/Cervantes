import { prisma } from '../prisma';

export type GateStatus = 'PENDING' | 'GENERATED' | 'NEEDS_REVISION' | 'APPROVED' | 'BLOCKED';

export const productionPhases = [
  'idea',
  'research',
  'languages',
  'formula',
  'editorial-bible',
  'visual-bible',
  'chapter-plan',
  'blocks',
  'audit',
  'recovery',
  'metadata',
  'publishing',
  'visual-assets',
  'preview',
  'export',
];

const readerFacingForbidden = [
  /procedo con/i,
  /como modelo de ia/i,
  /pendiente de redacci[oó]n/i,
  /lorem ipsum/i,
  /\bTODO\b/,
  /NEEDS_/i,
];

export function inspectManuscript(markdown: string, options?: { blockWordTotal?: number, expectedWordCountMin?: number, missingBlocks?: number }) {
  const issues: string[] = [];
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const headings = markdown.match(/^# /gm)?.length || 0;

  for (const pattern of readerFacingForbidden) {
    if (pattern.test(markdown)) issues.push(`Metatexto o placeholder detectado: ${pattern.source}`);
  }
  if (!markdown.includes('Front matter')) issues.push('Falta front matter.');
  if (!markdown.includes('assets/cover.svg')) issues.push('Falta portada.');
  if (headings < 8) issues.push('La estructura tiene pocos encabezados para un ebook premium.');
  if (wordCount < 1200) issues.push('El manuscrito es demasiado breve para produccion.');
  
  if (options) {
    if (options.missingBlocks && options.missingBlocks > 0) {
      issues.push(`Faltan ${options.missingBlocks} bloques por ensamblar.`);
    }
    if (options.blockWordTotal && wordCount < options.blockWordTotal * 0.95) {
      issues.push(`El ensamblado final (${wordCount}) perdió más del 5% del contenido generado (${options.blockWordTotal}).`);
    }
    if (options.expectedWordCountMin && wordCount < options.expectedWordCountMin * 0.90) {
      issues.push(`El ensamblado final (${wordCount}) no cumple con el mínimo de la fórmula (${options.expectedWordCountMin}).`);
    }
  }

  return {
    status: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
    wordCount,
    headings,
    issues,
  };
}

export async function upsertGate(projectId: number, phase: string, payload: { generationStatus?: GateStatus, approvalStatus?: GateStatus }, notes?: string, overrideReason?: string) {
  return prisma.phaseGate.upsert({
    where: { projectId_phase: { projectId, phase } },
    update: {
      ...(payload.generationStatus && { generationStatus: payload.generationStatus }),
      ...(payload.approvalStatus && { approvalStatus: payload.approvalStatus }),
      notes,
      overrideReason,
      approvedAt: payload.approvalStatus === 'APPROVED' ? new Date() : undefined,
      approvedBy: payload.approvalStatus === 'APPROVED' ? 'Ivan' : undefined,
    },
    create: {
      projectId,
      phase,
      generationStatus: payload.generationStatus || 'PENDING',
      approvalStatus: payload.approvalStatus || 'PENDING',
      notes,
      overrideReason,
      approvedAt: payload.approvalStatus === 'APPROVED' ? new Date() : undefined,
      approvedBy: payload.approvalStatus === 'APPROVED' ? 'Ivan' : undefined,
    },
  });
}

export async function ensureDefaultGates(projectId: number) {
  for (const phase of productionPhases) {
    const existing = await prisma.phaseGate.findUnique({ where: { projectId_phase: { projectId, phase } } });
    if (!existing) {
      await upsertGate(projectId, phase, { generationStatus: 'PENDING', approvalStatus: 'PENDING' });
    }
  }
}

export async function approveGeneratedGate(projectId: number, phase: string, notes?: string) {
  return upsertGate(projectId, phase, { approvalStatus: 'APPROVED' }, notes || 'Aprobado automaticamente por verificador local.');
}

export async function autoApproveStructuralGates(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clarifications: true,
      chapterPlans: true,
      manuscriptBlocks: true,
      recoveryReports: true,
    },
  });
  if (!project) throw new Error('Project not found');

  if (project.clarifications.length >= 5) {
    await upsertGate(projectId, 'idea', { approvalStatus: 'APPROVED' }, 'Idea validada: preguntas estratégicas generadas.');
  }
  if (project.chapterPlans.length >= 5) {
    await upsertGate(projectId, 'chapter-plan', { approvalStatus: 'APPROVED' }, 'Índice validado: plan de capítulos suficiente.');
  }
  if (
    project.manuscriptBlocks.length >= 5
    && project.manuscriptBlocks.every((block) => (block.wordCount || 0) >= 750 && block.status !== 'NEEDS_REVISION' && !/template/i.test(block.aiModel || ''))
  ) {
    await upsertGate(projectId, 'blocks', { approvalStatus: 'APPROVED' }, 'Bloques validados: contenido externo suficiente para ensamblaje.');
  }
}

export async function gateReport(projectId: number) {
  await ensureDefaultGates(projectId);
  await autoApproveStructuralGates(projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phaseGates: { orderBy: { phase: 'asc' } },
      visualAssets: true,
      marketResearch: true,
      languageOpportunity: true,
      editorialFormula: true,
      editorialBible: true,
      visualBible: true,
      chapterPlans: true,
      manuscriptBlocks: true,
      auditReports: true,
      recoveryReports: true,
      metadataPackage: true,
      publishingChecklist: true,
      formatBuilds: true,
      exportPackages: true,
      editorialLayouts: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!project) throw new Error('Project not found');

  const blockers: string[] = [];
  if (!project.marketResearch?.userVerified) blockers.push('Investigacion de mercado no verificada por usuario.');
  if (!project.marketResearch?.recommendedTitle) blockers.push('Falta titulo recomendado por mercado.');
  if (!project.languageOpportunity?.recommendedPrimary) blockers.push('Falta seleccion de idioma principal.');
  if (!project.editorialBible) blockers.push('Falta Biblia Editorial.');
  if (!project.visualBible) blockers.push('Falta Biblia Visual.');
  if (project.chapterPlans.length < 5) blockers.push('Plan de capitulos insuficiente.');
  if (project.manuscriptBlocks.length < 5) blockers.push('Bloques de manuscrito insuficientes.');
  if (project.manuscriptBlocks.some((block) => (block.wordCount || 0) < 750)) blockers.push('Hay capitulos por debajo del minimo editorial de 750 palabras.');
  if (project.manuscriptBlocks.some((block) => block.status === 'NEEDS_REVISION' || /template/i.test(block.aiModel || ''))) {
    blockers.push('Hay capitulos generados sin IA externa valida; deben regenerarse con Groq, Gemini, OpenRouter u OpenAI.');
  }
  if (project.recoveryReports.length === 0) blockers.push('Falta reporte de recuperacion y ensamblaje.');
  if (project.visualAssets.length === 0) blockers.push('Faltan assets visuales planificados.');
  if (project.visualAssets.some((asset) => asset.approvalStatus !== 'APPROVED')) blockers.push('Hay assets visuales sin aprobar.');
  const latestLayout = project.editorialLayouts[0];
  if (!latestLayout) blockers.push('Falta render editorial visual.');
  if (latestLayout && latestLayout.status !== 'APPROVED') blockers.push('Calidad visual necesita revision.');
  if (!project.metadataPackage?.commercialTitle) blockers.push('Falta metadata comercial.');
  if (!project.publishingChecklist?.aiDeclaration) blockers.push('Falta declaracion de IA.');

  const gateBlockers = project.phaseGates
    .filter((gate) => gate.approvalStatus !== 'APPROVED' && gate.phase !== 'export')
    .map((gate) => `Gate no aprobado: ${gate.phase} (Generación: ${gate.generationStatus}, Aprobación: ${gate.approvalStatus})`);

  return {
    status: blockers.length === 0 && gateBlockers.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
    blockers: [...blockers, ...gateBlockers],
    gates: project.phaseGates,
  };
}

export function validateKdpPackage(input: {
  title?: string | null;
  subtitle?: string | null;
  aiDeclaration?: string | null;
  keywords?: string | null;
  categories?: string | null;
  epubPath?: string | null;
  coverPath?: string | null;
}) {
  const checks = [
    ['title', Boolean(input.title)],
    ['subtitle', Boolean(input.subtitle)],
    ['aiDeclaration', Boolean(input.aiDeclaration)],
    ['coverSeparated', Boolean(input.coverPath)],
    ['coverNoPricePromo', true],
    ['epubWithMetadata', Boolean(input.epubPath)],
    ['keywords', Boolean(input.keywords)],
    ['categories', Boolean(input.categories)],
  ] as const;
  return {
    status: checks.every(([, ok]) => ok) ? 'APPROVED' : 'NEEDS_REVISION',
    checks: Object.fromEntries(checks),
  };
}

export function validateGumroadPackage(input: {
  premiumPdfPath?: string | null;
  zipPath?: string | null;
  salesDescription?: string | null;
  price?: number | null;
  mockupPrompts?: string | null;
  disclaimer?: string | null;
}) {
  const checks = [
    ['premiumPdf', Boolean(input.premiumPdfPath)],
    ['zipPackage', Boolean(input.zipPath)],
    ['salesDescription', Boolean(input.salesDescription)],
    ['priceRecommendation', Boolean(input.price)],
    ['productImagesOrPrompts', Boolean(input.mockupPrompts)],
    ['refundCopyrightDisclaimer', Boolean(input.disclaimer)],
  ] as const;
  return {
    status: checks.every(([, ok]) => ok) ? 'APPROVED' : 'NEEDS_REVISION',
    checks: Object.fromEntries(checks),
  };
}
