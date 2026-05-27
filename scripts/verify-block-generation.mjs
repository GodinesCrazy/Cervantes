import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

process.env.AI_PROVIDER = 'gemini';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'invalid-test-key';

const require = createRequire(import.meta.url);
const { generateFullChapterTemplate } = require('../apps/backend/dist/engines/templates.js');

const result = await generateFullChapterTemplate(
  'Introducción a las Runas',
  'Presenta el origen, el propósito práctico y el mapa de aprendizaje para principiantes.',
  'Runas premium para principiantes',
  1200,
);

const content = String(result.data.content || '');
const wordCount = content.split(/\s+/).filter(Boolean).length;

assert.ok(wordCount >= 850, `Expected at least 850 words, got ${wordCount}`);
assert.equal(result.data.externalAiUsed, false, 'Invalid Gemini key should not be counted as external AI success');
assert.match(String(result.data.generationWarnings || ''), /IA externa|gemini|credencial|fallback|respaldo/i);
assert.doesNotMatch(content, /API key not valid|INVALID_ARGUMENT|gemini request failed/i);

console.log(JSON.stringify({
  status: 'PASS',
  wordCount,
  provider: result.provider,
  externalAiUsed: result.data.externalAiUsed,
}));
