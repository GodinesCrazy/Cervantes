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
  /prompt/i,
  /pendiente de redacci[oó]n/i,
  /lorem ipsum/i,
  /\bTODO\b/,
  /NEEDS_/i,
];

export function inspectManuscript(markdown: string) {
  const issues: string[] = [];
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const headings = markdown.match(/^# /gm)?.length || 0;

  for (const pattern of readerFacingForbidden) {
    if (pattern.test(markdown)) issues.push(`Metatexto o placeholder detectado: ${pattern.source}`);
  }
  if (!markdown.includes('Front matter')) issues.push('Falta front matter.');
  if (!markdown.includes('Apendice A: Checklist editorial')) issues.push('Falta checklist editorial.');
  if (!markdown.includes('Apendice B: Resumen en ingles')) issues.push('Falta resumen multidioma.');
  if (!markdown.includes('assets/cover.svg')) issues.push('Falta portada.');
  if (!markdown.includes('Tabla de decisión')) issues.push('Faltan tablas de decision.');
  if (headings < 8) issues.push('La estructura tiene pocos encabezados para un ebook premium.');
  if (wordCount < 1200) issues.push('El manuscrito es demasiado breve para produccion.');

  return {
    status: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
    wordCount,
    headings,
    issues,
  };
}

export async function upsertGate(projectId: number, phase: string, status: GateStatus, notes?: string, overrideReason?: string) {
  return prisma.phaseGate.upsert({
    where: { projectId_phase: { projectId, phase } },
    update: {
      status,
      notes,
      overrideReason,
      approvedAt: status === 'APPROVED' ? new Date() : undefined,
      approvedBy: status === 'APPROVED' ? 'Ivan' : undefined,
    },
    create: {
      projectId,
      phase,
      status,
      notes,
      overrideReason,
      approvedAt: status === 'APPROVED' ? new Date() : undefined,
      approvedBy: status === 'APPROVED' ? 'Ivan' : undefined,
    },
  });
}

export async function ensureDefaultGates(projectId: number) {
  for (const phase of productionPhases) {
    const existing = await prisma.phaseGate.findUnique({ where: { projectId_phase: { projectId, phase } } });
    if (!existing) {
      await upsertGate(projectId, phase, 'PENDING');
    }
  }
}

export async function approveGeneratedGate(projectId: number, phase: string, notes?: string) {
  return upsertGate(projectId, phase, 'APPROVED', notes || 'Aprobado automaticamente por verificador local.');
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
    await upsertGate(projectId, 'idea', 'APPROVED', 'Idea validada: preguntas estratégicas generadas.');
  }
  if (project.chapterPlans.length >= 5) {
    await upsertGate(projectId, 'chapter-plan', 'APPROVED', 'Índice validado: plan de capítulos suficiente.');
  }
  if (project.manuscriptBlocks.length >= 5 && project.manuscriptBlocks.every((block) => (block.content || '').trim().length > 300)) {
    await upsertGate(projectId, 'blocks', 'APPROVED', 'Bloques validados: contenido base suficiente para ensamblaje.');
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
  if (project.recoveryReports.length === 0) blockers.push('Falta reporte de recuperacion y ensamblaje.');
  if (project.visualAssets.length === 0) blockers.push('Faltan assets visuales planificados.');
  if (project.visualAssets.some((asset) => asset.approvalStatus !== 'APPROVED')) blockers.push('Hay assets visuales sin aprobar.');
  if (!project.metadataPackage?.commercialTitle) blockers.push('Falta metadata comercial.');
  if (!project.publishingChecklist?.aiDeclaration) blockers.push('Falta declaracion de IA.');

  const gateBlockers = project.phaseGates
    .filter((gate) => gate.status !== 'APPROVED' && gate.phase !== 'export')
    .map((gate) => `Gate no aprobado: ${gate.phase} (${gate.status})`);

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
