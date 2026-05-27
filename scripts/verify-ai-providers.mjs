import dotenv from 'dotenv';
import { createRequire } from 'node:module';

dotenv.config({ path: '.env' });

const require = createRequire(import.meta.url);
const { AIService } = require('../apps/backend/dist/ai/aiService.js');

const providers = process.argv.slice(2);
const defaultProviders = ['cerebras', 'deepseek', 'groq', 'gemini', 'openrouter', 'openai'];
const ai = new AIService();
const results = [];

for (const provider of providers.length ? providers : defaultProviders) {
  const started = Date.now();
  const result = await ai.generate(
    { content: 'fallback' },
    {
      provider,
      engine: 'provider-smoke-test',
      prompt: 'Return JSON only: {"content":"ok"}',
    },
  );
  results.push({
    provider,
    ok: !result.error && result.provider === provider && String(result.data?.content || '').toLowerCase().includes('ok'),
    usedProvider: result.provider,
    model: result.model,
    ms: Date.now() - started,
    error: result.error ? result.error.slice(0, 180) : undefined,
  });
}

console.log(JSON.stringify(results, null, 2));
