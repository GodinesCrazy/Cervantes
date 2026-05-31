import { prisma } from '../../prisma';
import { sanitizeHtmlContent } from './contentSanitizer';
import { auditFoodSafety } from './foodSafetyGuard';

export interface FinalExportQualityReport {
  isReady: boolean;
  blockers: string[];
}

export async function validateFinalExportReadiness(projectId: number, markdownText?: string): Promise<FinalExportQualityReport> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phaseGates: true,
      visualAssets: true,
      formatBuilds: true,
    }
  });

  if (!project) throw new Error('Project not found');

  const blockers: string[] = [];

  if (markdownText) {
    const sanitizerResult = sanitizeHtmlContent(markdownText);
    if (!sanitizerResult.isClean) {
      blockers.push('Error de Sanitización Comercial: ' + sanitizerResult.errors.join(' | '));
    }

    const safetyResult = auditFoodSafety(markdownText);
    if (!safetyResult.isSafe) {
      blockers.push('Alerta de Seguridad Alimentaria / Comercial: ' + safetyResult.errors.join(' | '));
    }
  }

  // Check that ALL prior phases are APPROVED
  const requiredPhases = [
    'idea', 'research', 'languages', 'formula', 'editorial-bible', 'visual-bible',
    'chapter-plan', 'blocks', 'audit', 'recovery', 'visual-assets', 'metadata', 'publishing'
  ];

  for (const phase of requiredPhases) {
    const gate = project.phaseGates.find(g => g.phase === phase);
    if (!gate || gate.approvalStatus !== 'APPROVED') {
      blockers.push(`Falta aprobar la etapa: ${phase}`);
    }
  }

  // Check visual assets (all must be approved, none pending/failed)
  if (project.visualAssets.length === 0) {
    blockers.push('No hay assets visuales generados (el PDF se generaría sin gráficos).');
  }

  for (const asset of project.visualAssets) {
    if (asset.approvalStatus !== 'APPROVED') {
      blockers.push(`Asset visual no aprobado: ${asset.name} (${asset.assetType})`);
    }
  }

  return {
    isReady: blockers.length === 0,
    blockers
  };
}
