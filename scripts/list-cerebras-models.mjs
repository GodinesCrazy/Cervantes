import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const key = process.env.CEREBRAS_API_KEY;
if (!key) {
  console.log(JSON.stringify({ ok: false, error: 'CEREBRAS_API_KEY missing' }, null, 2));
  process.exit(0);
}

const response = await fetch('https://api.cerebras.ai/v1/models', {
  headers: { Authorization: `Bearer ${key}` },
});

const body = await response.text();
if (!response.ok) {
  console.log(JSON.stringify({ ok: false, status: response.status, body: body.slice(0, 500) }, null, 2));
  process.exit(0);
}

const data = JSON.parse(body);
const models = (data.data || data.models || [])
  .map((model) => model.id || model.name || model)
  .filter(Boolean);

console.log(JSON.stringify({ ok: true, models }, null, 2));
