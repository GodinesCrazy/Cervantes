const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.phaseGate.updateMany({
  where: { projectId: 51, phase: 'preview' },
  data: { approvalStatus: 'PENDING' }
}).then(() => console.log('Fixed')).catch(console.error).finally(() => prisma.$disconnect());
