import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const MARKET_LENGTH_MATRIX: Record<string, { min: number; target: number; max: number; desc: string }> = {
  'mini_ebook': { min: 5000, target: 8000, max: 18000, desc: 'Mini ebook / lead magnet' },
  'short_guide': { min: 15000, target: 20000, max: 35000, desc: 'Guía breve práctica' },
  'standard_ebook': { min: 30000, target: 38000, max: 60000, desc: 'Ebook práctico estándar' },
  'premium_manual': { min: 50000, target: 60000, max: 90000, desc: 'Manual premium / guía completa' },
  'premium_bundle': { min: 60000, target: 75000, max: 130000, desc: 'Premium bundle (ebook + anexos)' },
  'deep_nonfiction': { min: 50000, target: 65000, max: 120000, desc: 'No ficción profunda' },
  'short_fiction': { min: 17500, target: 25000, max: 40000, desc: 'Ficción corta / novella' },
  'commercial_fiction': { min: 60000, target: 80000, max: 120000, desc: 'Novela comercial' },
  'workbook': { min: 5000, target: 10000, max: 20000, desc: 'Workbook puro' },
  'visual_book': { min: 3000, target: 6000, max: 15000, desc: 'Libro visual / ilustrado' }
};

export async function decideBookStandards(projectId: number) {
  // Fetch existing context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { marketResearch: true, editorialFormula: true }
  });
  if (!project) throw new Error('Project not found');

  const formula = project.editorialFormula;
  const research = project.marketResearch;

  // Infer category if not explicit
  let category = 'standard_ebook';
  let isBundle = formula?.isBundle || false;
  let isPremium = (formula?.recommendedPrice || 0) >= 29.99;
  
  if (isBundle) category = 'premium_bundle';
  else if (isPremium) category = 'premium_manual';
  else if (formula?.productType?.toLowerCase().includes('guía rápida')) category = 'short_guide';
  else if (formula?.includesWorkbook && !formula.isBundle) category = 'workbook';

  const matrix = MARKET_LENGTH_MATRIX[category] || MARKET_LENGTH_MATRIX['standard_ebook'];

  let targetWords = matrix.target;
  let minWords = matrix.min;
  let maxWords = matrix.max;

  // If price is premium, bump requirements to upper range
  if (isPremium && category !== 'premium_bundle' && category !== 'premium_manual') {
      minWords = Math.max(minWords, 30000);
      targetWords = Math.max(targetWords, 40000);
  }

  // Detect High Responsibility
  const highRiskTopics = ['salud', 'nutrición', 'medicina', 'legal', 'finanzas', 'supervivencia', 'primeros auxilios', 'mascotas', 'inversión'];
  const ideaTopic = research?.niche?.toLowerCase() || '';
  const isHighRisk = highRiskTopics.some(t => ideaTopic.includes(t));
  const riskMode = isHighRisk ? 'HIGH_RESPONSIBILITY' : 'STANDARD';

  const benchmarkData = {
    projectId,
    productType: matrix.desc,
    category: category,
    subcategory: research?.subNiche || '',
    marketPosition: formula?.positioning || 'Standard',
    targetPlatforms: 'KDP, Gumroad',
    targetPrice: formula?.recommendedPrice || 9.99,
    recommendedWordCountMin: minWords,
    recommendedWordCountTarget: targetWords,
    recommendedWordCountMax: maxWords,
    recommendedPageCountMin: Math.floor(minWords / 250),
    recommendedPageCountTarget: Math.floor(targetWords / 250),
    recommendedPageCountMax: Math.floor(maxWords / 250),
    recommendedChapterCount: Math.max(5, Math.floor(targetWords / 5000)),
    recommendedWordsPerChapter: 5000,
    recommendedVisualCount: isPremium ? 10 : 2,
    requiresWorkbook: formula?.includesWorkbook || isBundle,
    requiresTemplates: formula?.includesTemplates || isBundle,
    requiresQuickGuide: formula?.includesQuickGuide || isBundle,
    requiresBibliography: isHighRisk || category === 'deep_nonfiction',
    requiresDisclaimer: isHighRisk,
    riskMode,
    reasoning: `Selected ${category} based on formula. Adjusted for premium: ${isPremium}. High risk: ${isHighRisk}.`,
    approvalStatus: 'APPROVED'
  };

  await prisma.bookStandardBenchmark.deleteMany({ where: { projectId } });
  const result = await prisma.bookStandardBenchmark.create({ data: benchmarkData });
  return result;
}
