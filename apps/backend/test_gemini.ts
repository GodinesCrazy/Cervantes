import { AIService } from './src/ai/aiService';
import { envConfig } from './src/config';

async function main() {
  console.log("Configured GEMINI_API_KEY:", envConfig.credentials.gemini ? "presente" : "ausente");
  console.log("GEMINI_MODEL:", envConfig.models.gemini || "usando default (gemini-2.5-flash)");
  
  const ai = new AIService();
  try {
    const res = await ai.generate({ content: 'test' }, {
      provider: 'gemini',
      engine: 'provider-smoke-test',
      prompt: 'Return JSON only: {"content":"ok"}',
    });
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error directo:", err);
  }
}

main();
