import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 51;
  const blocks = await prisma.manuscriptBlock.findMany({ where: { projectId } });
  
  for (const block of blocks) {
    if (block.content) {
      let c = String(block.content);
      let changed = false;
      if (c.includes('Se reservan espacios')) {
        c = c.replace(/Se reservan espacios.*?\./g, '');
        changed = true;
      }
      
      if (changed) {
        console.log('Fixed placeholder in block', block.id);
        await prisma.manuscriptBlock.update({
          where: { id: block.id },
          data: { content: c }
        });
      }
    }
  }
}
main().catch(console.error);
