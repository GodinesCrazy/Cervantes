import { Router } from 'express';
import { prisma } from '../prisma';
import { createBackup } from '../services/backupService';
import { AIOrchestrator, aiProviderInventory } from '../ai/aiOrchestrator';

const router = Router();
const aiOrchestrator = new AIOrchestrator();

router.get('/', async (_req, res, next) => {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, aiProvider: process.env.AI_PROVIDER || 'auto', aiModel: process.env.AI_MODEL || 'gpt-4o' },
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: req.body,
      create: { id: 1, ...req.body },
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (_req, res, next) => {
  try {
    const latestBackup = await prisma.backupRecord.findFirst({ orderBy: { createdAt: 'desc' } });
    const projectCount = await prisma.project.count();
    const readinessCount = await prisma.publicationReadiness.count({ where: { status: 'APPROVED' } });
    const configuredProvider = process.env.AI_PROVIDER || 'auto';
    const inventory = aiProviderInventory();
    const keyStatus = Object.fromEntries(inventory.map((provider) => [provider.provider, provider.configured]));
    const configuredOrder = (process.env.AI_PROVIDER_ORDER || '')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean);
    const defaultOrder = ['cerebras', 'deepseek', 'groq', 'gemini', 'cohere', 'openrouter', 'mistral', 'together', 'fireworks', 'openai'];
    const providerOrder = configuredOrder.length > 0 ? configuredOrder : defaultOrder;
    const autoChain = providerOrder.filter((provider) => keyStatus[provider as keyof typeof keyStatus]);
    res.json({
      ai: {
        provider: configuredProvider,
        activeChain: configuredProvider === 'auto' ? [...autoChain, 'template'] : [configuredProvider, 'template'],
        keysDetected: keyStatus,
        models: {
          openai: process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-4o',
          gemini: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.5-flash',
          groq: process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile',
          cerebras: process.env.CEREBRAS_MODEL || 'gpt-oss-120b',
          deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          openrouter: process.env.OPENROUTER_MODEL || 'openrouter/free',
          mistral: process.env.MISTRAL_MODEL || 'mistral-small-latest',
          together: process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          fireworks: process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/llama-v3p1-70b-instruct',
          cohere: process.env.COHERE_MODEL || 'command-a-03-2025',
        },
        inventory,
      },
      storage: {
        databaseUrl: process.env.DATABASE_URL,
        exportsPath: 'storage/exports',
        backupsPath: 'storage/backups',
      },
      database: {
        status: 'OK',
        projectCount,
      },
      validator: {
        approvedPublicationPackages: readinessCount,
      },
      latestBackup,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ai/providers', async (_req, res, next) => {
  try {
    res.json(aiOrchestrator.providers());
  } catch (error) {
    next(error);
  }
});

router.post('/ai/smoke-test', async (req, res, next) => {
  try {
    const providers = Array.isArray(req.body?.providers) ? req.body.providers.map(String) : undefined;
    res.json(await aiOrchestrator.smokeTest(providers));
  } catch (error) {
    next(error);
  }
});

router.post('/backup', async (_req, res, next) => {
  try {
    res.json(await createBackup());
  } catch (error) {
    next(error);
  }
});

export default router;
