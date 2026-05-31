import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 51;
  const blocks = await prisma.manuscriptBlock.findMany({
    where: { projectId },
    orderBy: { order: 'asc' }
  });
  
  for (const block of blocks) {
    console.log('--- BLOCK ' + block.id + ' ---');
    const c = String(block.content || '');
    console.log(c.substring(0, 150) + '...');
    
    let isBroken = false;
    if (!c || !c.trim().startsWith('{')) {
      isBroken = true;
    } else {
      try {
        JSON.parse(c);
      } catch (e) {
        isBroken = true;
      }
    }
    console.log('isBroken?', isBroken);
  }
}
main().catch(console.error);
