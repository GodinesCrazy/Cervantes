import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { createRequire } from 'node:module';

dotenv.config({ path: '.env' });

const require = createRequire(import.meta.url);
const {
  aiProviderInventory,
  providerChainForTask,
  humanizeAIError,
  AIOrchestrator,
} = require('../apps/backend/dist/ai/aiOrchestrator.js');

const inventory = aiProviderInventory();
const providers = Object.fromEntries(inventory.map((provider) => [provider.provider, provider]));

for (const provider of ['openai', 'gemini', 'groq', 'cerebras', 'deepseek', 'openrouter', 'cohere']) {
  assert(providers[provider], `Missing provider inventory entry: ${provider}`);
}

for (const provider of ['stability', 'replicate', 'fal', 'huggingface', 'pollinations', 'cloudflare']) {
  assert(providers[provider], `Missing visual provider inventory entry: ${provider}`);
  assert.equal(providers[provider].type, 'image', `${provider} should be exposed as image provider`);
}

assert.deepEqual(providerChainForTask('market-research').slice(0, 4), ['gemini', 'openai', 'openrouter', 'deepseek']);
assert.deepEqual(providerChainForTask('chapter-writing').slice(0, 4), ['deepseek', 'cerebras', 'groq', 'openai']);
assert.deepEqual(providerChainForTask('audit').slice(0, 4), ['gemini', 'openai', 'cohere', 'mistral']);
assert.deepEqual(providerChainForTask('rhythm').slice(0, 3), ['deepseek', 'openai', 'groq']);

assert.match(humanizeAIError('API key not valid'), /Falla credencial/);
assert.match(humanizeAIError('429 quota exceeded'), /Sin cuota/);
assert.match(humanizeAIError('request timeout'), /Lento/);

const orchestrator = new AIOrchestrator();
const status = orchestrator.providers();
assert(status.providers.length >= 10, 'Provider status should include text and visual providers');
assert(status.defaultChain.includes('cohere'), 'Default chain should include Cohere as semantic QA provider');

console.log(JSON.stringify({
  status: 'APPROVED',
  textProviders: inventory.filter((provider) => provider.usableByTextEngine).length,
  imageProviders: inventory.filter((provider) => provider.type === 'image').length,
  configured: inventory.filter((provider) => provider.configured).map((provider) => provider.provider),
}, null, 2));
