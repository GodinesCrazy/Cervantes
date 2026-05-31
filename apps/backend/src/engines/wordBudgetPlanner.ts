import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateWordBudget(projectId: number) {
  const benchmark = await prisma.bookStandardBenchmark.findUnique({ where: { projectId } });
  if (!benchmark) throw new Error('BookStandardBenchmark not found. Run standard decision first.');

  const targetWords = benchmark.recommendedWordCountTarget || 30000;
  
  // Allocate words: 
  // Front Matter: 5%
  // Back Matter: 5%
  // Main Book: 90% (if no workbook)
  
  let mainRatio = 0.90;
  let frontRatio = 0.05;
  let backRatio = 0.05;
  let workbookWords = 0;
  let quickGuideWords = 0;

  if (benchmark.requiresWorkbook) {
    workbookWords = Math.floor(targetWords * 0.15);
    mainRatio -= 0.15;
  }
  if (benchmark.requiresQuickGuide) {
    quickGuideWords = Math.floor(targetWords * 0.05);
    mainRatio -= 0.05;
  }

  const frontMatterWords = Math.floor(targetWords * frontRatio);
  const backMatterWords = Math.floor(targetWords * backRatio);
  const mainBookWords = Math.floor(targetWords * mainRatio);

  const totalTargetWords = frontMatterWords + mainBookWords + backMatterWords + workbookWords + quickGuideWords;

  // Let's assume the user will generate between 5 and N chapters.
  const numChapters = benchmark.recommendedChapterCount || Math.max(5, Math.floor(mainBookWords / 4000));
  const minWordsPerChapter = benchmark.productType?.includes('premium') ? 4000 : 1500;
  
  let chapterTargetWords = Math.floor(mainBookWords / numChapters);
  // Ensure we don't go below the premium rule limit.
  if (chapterTargetWords < minWordsPerChapter) {
      chapterTargetWords = minWordsPerChapter;
  }

  return {
    totalTargetWords,
    frontMatterWords,
    mainBookWords,
    workbookWords,
    quickGuideWords,
    appendixWords: backMatterWords,
    chapterBudgets: {
      chapterCount: numChapters,
      targetWordsPerChapter: chapterTargetWords,
      minAcceptableWordsPerChapter: Math.floor(chapterTargetWords * 0.90),
      maxWordsPerChapter: Math.floor(chapterTargetWords * 1.25)
    }
  };
}
