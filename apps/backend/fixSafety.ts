import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 51;
  const blocks = await prisma.manuscriptBlock.findMany({ where: { projectId } });
  
  for (const block of blocks) {
    if (block.content) {
      let c = String(block.content);
      let changed = false;
      if (c.includes('retirar el moho') || c.includes('retiró el moho') || c.includes('capa superficial contaminada')) {
        c = c.replace(/Se retiró el moho visible.*?y se re‑selló el envase/g, 'Se descartó el lote completo por motivos de seguridad alimentaria');
        c = c.replace(/retirar la capa superficial contaminada/g, 'descartar el fermento de inmediato');
        c = c.replace(/retirar el moho visible/g, 'desechar el lote');
        changed = true;
      }
      
      if (changed) {
        console.log('Fixed safety in block', block.id);
        await prisma.manuscriptBlock.update({
          where: { id: block.id },
          data: { content: c }
        });
      }
    }
  }
}
main().catch(console.error);
