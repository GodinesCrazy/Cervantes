import fs from 'node:fs';

const keys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'CEREBRAS_API_KEY', 'DEEPSEEK_API_KEY', 'OPENROUTER_API_KEY'];
const envPath = new URL('../.env', import.meta.url);
const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const values = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

for (const key of keys) {
  const value = values[key] || process.env[key] || '';
  const present = Boolean(value && !/^(changeme|xxx|your_|placeholder)$/i.test(value));
  console.log(`${key}=${present}`);
}
