import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import archiver from 'archiver';
import { prisma } from '../prisma';

const root = path.resolve(__dirname, '../../../..');
const storageDir = path.join(root, 'storage');
const backupDir = path.join(storageDir, 'backups');

export async function createBackup(projectId?: number) {
  await fs.mkdir(backupDir, { recursive: true });
  const filePath = path.join(backupDir, `cervantes-backup-${projectId || 'workspace'}-${Date.now()}.zip`);

  await new Promise<void>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = createWriteStream(filePath);
    stream.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(stream);
    archive.directory(storageDir, 'storage');
    archive.file(path.join(root, 'prisma', 'schema.prisma'), { name: 'prisma/schema.prisma' });
    archive.finalize().catch(reject);
  });

  const stats = await fs.stat(filePath);
  return prisma.backupRecord.create({
    data: {
      projectId,
      backupType: projectId ? 'project' : 'workspace',
      filePath,
      fileSize: stats.size,
      status: 'DONE',
    },
  });
}
