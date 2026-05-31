import { prisma } from './src/prisma';

async function main() {
  const logs = await prisma.aIUsageLog.findMany({
    where: { projectId: 48 },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log(`Found ${logs.length} logs for project 48:`);
  for (const log of logs) {
    console.log(`\n[${log.createdAt.toISOString()}] Engine: ${log.engine} | Provider: ${log.provider} | Selected: ${log.selectedProvider} | Status: ${log.status}`);
    if (log.error) {
      console.log(`  Error: ${log.error}`);
    }
    if (log.humanReadableError) {
      console.log(`  Human Readable Error: ${log.humanReadableError}`);
    }
  }
}

main();
