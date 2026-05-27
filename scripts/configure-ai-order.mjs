import fs from 'node:fs';

const envPath = new URL('../.env', import.meta.url);
const updates = {
  AI_PROVIDER: 'auto',
  AI_PROVIDER_ORDER: 'cerebras,groq,gemini,openrouter,openai',
  CEREBRAS_MODEL: 'gpt-oss-120b',
  AI_SECTION_DELAY_MS: '4500',
  AI_MAX_ATTEMPTS: '3',
};

let lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
const seen = new Set();

lines = lines.map((line) => {
  const match = line.match(/^([A-Z0-9_]+)=/);
  if (!match) return line;
  const key = match[1];
  if (!(key in updates)) return line;
  seen.add(key);
  return `${key}=${updates[key]}`;
});

for (const [key, value] of Object.entries(updates)) {
  if (!seen.has(key)) lines.push(`${key}=${value}`);
}

fs.writeFileSync(envPath, `${lines.join('\n').replace(/\n+$/g, '')}\n`);
console.log('AI provider order configured without printing secrets.');
