const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const logs = await prisma.aIUsageLog.findMany({ 
    where: { engine: 'audit' }, 
    orderBy: { id: 'desc' }, 
    take: 2 
  }); 
  console.log(logs.map(l => ({ 
    id: l.id, 
    status: l.status, 
    error: l.error, 
    res: l.result?.slice(0, 500) 
  }))); 
} 
main().finally(() => prisma.$disconnect());
