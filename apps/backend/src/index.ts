import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import projectsRouter from './routes/projects';
import settingsRouter from './routes/settings';
import { prisma } from './prisma';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/ready', (_req, res) => {
  res.json({ ok: true, service: 'cervantes-backend' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/settings', settingsRouter);

app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
  });
});

const server = app.listen(port, () => {
  console.log(`Cervantes API listening on http://localhost:${port} (reloaded)`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
