const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const plans = await prisma.chapterPlan.findMany({ 
    where: { projectId: 14 } 
  }); 
  console.log(plans); 
} 
main().finally(() => prisma.$disconnect());
