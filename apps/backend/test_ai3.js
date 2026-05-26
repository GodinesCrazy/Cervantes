const { AIService } = require('./dist/ai/aiService.js');
const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

async function test() {
  const ai = new AIService();
  try {
    const res = await ai.generate({ content: '' }, {
      engine: 'test',
      prompt: `You are a premium, expert book author and ghostwriter. 
Write the complete, full-length content for a chapter titled "Entrenamiento y comportamiento para perros".
The book's overall topic is: "Cuidado de Perros".
The chapter's summary/goal is: "Aprender técnicas de entrenamiento efectivas para tu perro, incluyendo obediencia, socialización y manejo de comportamientos problemáticos".
You MUST write approximately 1000 words. 
Write in a clear, highly coherent, engaging, and authoritative tone. Use markdown formatting (headings, bullet points, bold text) where appropriate to make it highly readable. Do not add any introductory or concluding meta-commentary, just return the raw chapter content. Return a JSON object with exactly one key: "content" (string).`
    });
    console.log("Error inside AIResult:", res.error);
  } catch(e) {
    console.error("Crash:", e);
  }
}
test();
