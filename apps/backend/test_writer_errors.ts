import { AIService } from './src/ai/aiService';

async function main() {
  const ai = new AIService();
  const prompt = `Write a short paragraph about: "Introducción a las runas". Return JSON format.`;
  const providers = ['deepseek', 'cerebras', 'groq', 'openai'] as const;

  for (const provider of providers) {
    console.log(`\nTesting provider: ${provider}...`);
    try {
      const res = await ai.generate({ content: '' }, {
        provider,
        engine: 'chapter-writer',
        prompt
      });
      console.log(`[${provider}] Result:`, JSON.stringify(res, null, 2));
    } catch (err) {
      console.error(`[${provider}] Threw Fatal Error:`, err);
    }
  }
}

main();
