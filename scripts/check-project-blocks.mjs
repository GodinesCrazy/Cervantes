import { PrismaClient } from '@prisma/client';

const projectId = Number(process.argv[2] || 35);
const prisma = new PrismaClient();

const blocks = await prisma.manuscriptBlock.findMany({
  where: { projectId },
  select: { id: true, blockTitle: true, wordCount: true, status: true, aiModel: true },
  orderBy: { order: 'asc' },
});

console.log(JSON.stringify(blocks, null, 2));

await prisma.$disconnect();
