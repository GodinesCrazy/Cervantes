import { prisma } from '../prisma';
import { GateStatus } from './qualityService';

export interface ProjectQualitySnapshot {
  projectId: number;
  baseIdea: string;
  normalizedTitle: string;
  language: string;
  category: string;
  riskMode: string;
  productType: string;
  expectedWordCountMin: number;
  expectedWordCountMax: number;
  expectedPageCountMin: number;
  expectedPageCountMax: number;
  expectedVisualAssetCount: number;
  formulaWordTarget: number;
  chapterPlanWordTotal: number;
  blockWordTotal: number;
  assembledManuscriptWordTotal: number;
  missingBlocks: number;
  draftBlocks: number;
  approvedBlocks: number;
  failedBlocks: number;
  visualBibleStatus: string;
  editorialBibleStatus: string;
  auditScores: Record<string, number>;
  criticalIssues: string[];
  warnings: string[];
  currentGateStatus: string;
  canAdvanceToNextStage: boolean;
}

export async function getProjectQualitySnapshot(projectId: number): Promise<ProjectQualitySnapshot> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      idea: true,
      marketResearch: true,
      languageOpportunity: true,
      editorialFormula: true,
      editorialBible: true,
      visualBible: true,
      chapterPlans: true,
      manuscriptBlocks: true,
      auditReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      recoveryReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      phaseGates: { where: { phase: 'blocks' } }, // Optional: depend on current phase
    },
  });

  if (!project) throw new Error('Project not found');

  const snapshot: ProjectQualitySnapshot = {
    projectId: project.id,
    baseIdea: project.idea?.rawIdea || '',
    normalizedTitle: project.marketResearch?.recommendedTitle || project.name,
    language: project.languageOpportunity?.recommendedPrimary || project.idea?.baseLanguage || 'es',
    category: project.marketResearch?.niche || 'General',
    riskMode: project.marketResearch?.riskLevel || 'LOW_RISK',
    productType: project.editorialFormula?.productType || 'ebook',
    
    // Will be populated by specific formula values or defaults
    expectedWordCountMin: 0,
    expectedWordCountMax: 0,
    expectedPageCountMin: 0,
    expectedPageCountMax: 0,
    expectedVisualAssetCount: 0,
    
    formulaWordTarget: 0,
    chapterPlanWordTotal: 0,
    blockWordTotal: 0,
    assembledManuscriptWordTotal: 0,
    
    missingBlocks: 0,
    draftBlocks: 0,
    approvedBlocks: 0,
    failedBlocks: 0,
    
    visualBibleStatus: project.visualBible?.approvalStatus || 'PENDING',
    editorialBibleStatus: project.editorialBible?.approvalStatus || 'PENDING',
    
    auditScores: {},
    criticalIssues: [],
    warnings: [],
    currentGateStatus: 'PENDING',
    canAdvanceToNextStage: false,
  };

  // 1. Expected Extents
  if (project.editorialFormula?.recommendedPrice && project.editorialFormula.recommendedPrice > 20) {
     snapshot.expectedWordCountMin = 25000;
     snapshot.expectedWordCountMax = 40000;
  } else {
     snapshot.expectedWordCountMin = 10000;
     snapshot.expectedWordCountMax = 25000;
  }
  
  // 2. Chapter Plan
  snapshot.chapterPlanWordTotal = project.chapterPlans.reduce((acc, ch) => acc + (ch.estimatedWords || 0), 0);

  // 3. Blocks
  const totalBlocks = project.manuscriptBlocks.length;
  snapshot.blockWordTotal = project.manuscriptBlocks.reduce((acc, b) => acc + (b.wordCount || 0), 0);
  
  snapshot.draftBlocks = project.manuscriptBlocks.filter(b => b.status === 'PENDING' || b.status === 'GENERATING').length;
  snapshot.approvedBlocks = project.manuscriptBlocks.filter(b => b.approvalStatus === 'APPROVED').length;
  snapshot.failedBlocks = project.manuscriptBlocks.filter(b => b.approvalStatus === 'REJECTED' || b.status === 'FAILED' || b.approvalStatus === 'NEEDS_REVISION').length;
  
  if (project.chapterPlans.length > 0 && totalBlocks < project.chapterPlans.length) {
     snapshot.missingBlocks = project.chapterPlans.length - totalBlocks;
  }

  // 4. Assembled Manuscript
  if (project.recoveryReports.length > 0) {
    const report = project.recoveryReports[0];
    if (report.masterManuscript) {
       snapshot.assembledManuscriptWordTotal = report.masterManuscript.split(/\s+/).filter(Boolean).length;
    }
  }

  // 5. Audit Scores
  if (project.auditReports.length > 0) {
    const audit = project.auditReports[0];
    snapshot.auditScores = {
      coherence: audit.coherenceScore || 0,
      tone: audit.toneScore || 0,
      structure: audit.structureScore || 0,
      completeness: audit.completenessScore || 0,
      overall: audit.overallScore || 0,
    };
    if (audit.issues) {
      snapshot.criticalIssues.push(...audit.issues.split(';').map(s => s.trim()).filter(Boolean));
    }
  }

  // Validate coherence
  if (snapshot.chapterPlanWordTotal < snapshot.expectedWordCountMin * 0.8) {
     snapshot.criticalIssues.push('Índice maestro suma menos del 80% de las palabras prometidas.');
  }

  if (snapshot.assembledManuscriptWordTotal > 0 && snapshot.assembledManuscriptWordTotal < snapshot.blockWordTotal * 0.95) {
     snapshot.criticalIssues.push('El manuscrito ensamblado perdió más del 5% del contenido generado.');
  }
  
  if (snapshot.missingBlocks > 0) {
     snapshot.criticalIssues.push(`Faltan ${snapshot.missingBlocks} bloques por generar o ensamblar.`);
  }

  // Identify current gate status
  const currentGate = await prisma.phaseGate.findUnique({
    where: { projectId_phase: { projectId, phase: project.currentPhase } }
  });
  
  snapshot.currentGateStatus = currentGate?.approvalStatus || 'PENDING';
  
  // Can Advance
  snapshot.canAdvanceToNextStage = snapshot.currentGateStatus === 'APPROVED' && snapshot.criticalIssues.length === 0;

  return snapshot;
}
