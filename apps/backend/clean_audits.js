const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Obtener todos los reportes del proyecto 14 ordenados por fecha
  const reports = await prisma.auditReport.findMany({
    where: { projectId: 14 },
    orderBy: { id: 'desc' }
  });
  
  console.log(`Total reportes encontrados: ${reports.length}`);
  reports.forEach(r => console.log(`  ID: ${r.id} | Overall: ${r.overallScore} | Status: ${r.approvalStatus}`));
  
  if (reports.length > 1) {
    // Conservar solo el más reciente (mayor ID)
    const keepId = reports[0].id;
    const deleteIds = reports.slice(1).map(r => r.id);
    
    await prisma.auditReport.deleteMany({
      where: { id: { in: deleteIds } }
    });
    
    console.log(`\n✅ Eliminados ${deleteIds.length} reportes antiguos. Conservado ID: ${keepId}`);
  } else {
    console.log('\nNo hay reportes antiguos que eliminar.');
  }
}

main().finally(() => prisma.$disconnect());
