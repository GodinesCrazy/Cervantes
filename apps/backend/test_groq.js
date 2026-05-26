const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

async function test() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  console.log("API Key (first 10):", apiKey?.slice(0, 10));
  console.log("Model:", model);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a premium ghostwriter. Return strict JSON only.' },
        { role: 'user', content: `Write a chapter about dog training. Return JSON with key "content" (string) containing about 1000 words of premium content in Spanish.` }
      ]
    })
  });

  const body = await response.text();
  console.log("Status:", response.status);
  console.log("Body:", body.slice(0, 800));
}

test().catch(console.error);
