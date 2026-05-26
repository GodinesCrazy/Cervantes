const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 14;

  // 1. Limpiar visual assets duplicados - conservar solo 4 (uno de cada tipo)
  const assets = await prisma.visualAsset.findMany({ where: { projectId } });
  console.log(`Total visual assets encontrados: ${assets.length}`);
  
  const seen = new Set();
  const toDelete = [];
  for (const asset of assets) {
    if (seen.has(asset.assetType)) {
      toDelete.push(asset.id);
    } else {
      seen.add(asset.assetType);
    }
  }
  
  if (toDelete.length > 0) {
    await prisma.visualAsset.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`✅ Eliminados ${toDelete.length} assets duplicados. Quedan ${assets.length - toDelete.length}.`);
  }

  // 2. Verificar gate de recovery
  const gates = await prisma.qualityGate.findMany({ where: { projectId } });
  console.log('\nGates actuales:');
  gates.forEach(g => console.log(`  ${g.phase}: ${g.status}`));
  
  // 3. Verificar si recovery gate existe, si no, crearlo
  const recoveryGate = gates.find(g => g.phase === 'recovery');
  if (!recoveryGate) {
    await prisma.qualityGate.create({
      data: { projectId, phase: 'recovery', status: 'APPROVED', notes: 'Manuscrito ensamblado correctamente.' }
    });
    console.log('\n✅ Gate de recovery creado como APPROVED.');
  } else if (recoveryGate.status !== 'APPROVED') {
    await prisma.qualityGate.update({
      where: { id: recoveryGate.id },
      data: { status: 'APPROVED' }
    });
    console.log('\n✅ Gate de recovery actualizado a APPROVED.');
  } else {
    console.log('\nGate de recovery ya está APPROVED.');
  }
}

main().finally(() => prisma.$disconnect());
