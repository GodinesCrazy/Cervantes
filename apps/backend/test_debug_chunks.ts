import { AIService } from './src/ai/aiService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ai = new AIService();

async function testSingleChunk() {
  console.log("=== Test 1: Simple chunk (no context) ===");
  const prompt1 = `You are a premium, expert book author writing in Spanish.
Chapter title: "Introducción a las runas"
Book topic: "Runas"
Target word count: WRITE AT LEAST 600 WORDS.
This is part 1 of 3 of the chapter.
This is the beginning of the chapter. Hook the reader immediately.

CRITICAL INSTRUCTIONS:
1. GOAL: Write with MAXIMUM information density. Each paragraph MUST contain at least 80 words.
2. QUANTITY: Return AT LEAST 6 blocks.
3. OUTPUT FORMAT: Return exclusively a valid JSON object (no markdown):
{
  "chapterTitle": "string",
  "opening": "string (at least 100 words)",
  "blocks": [
    { "type": "paragraph", "text": "string (at least 80 words each)" }
  ]
}`;

  try {
    const r1 = await ai.generate({ content: '' }, { engine: 'chapter-writer', prompt: prompt1, maxTokens: 8192 });
    console.log("Provider:", r1.provider);
    console.log("Error:", r1.error || "none");
    const d1 = r1.data as any;
    
    if (d1.blocks && Array.isArray(d1.blocks)) {
      console.log("SUCCESS: Direct blocks found:", d1.blocks.length);
      const text = d1.blocks.map((b: any) => b.text || b.body || '').join(' ');
      console.log("Word count:", text.split(/\s+/).filter(Boolean).length);
    } else if (d1.content) {
      console.log("Raw content length:", d1.content.length);
      try {
        const parsed = JSON.parse(d1.content);
        console.log("Parsed has blocks?", !!parsed.blocks);
        if (parsed.blocks) console.log("Blocks count:", parsed.blocks.length);
      } catch (e) {
        console.log("Content is not JSON, first 200 chars:", d1.content.slice(0, 200));
      }
    } else {
      console.log("UNEXPECTED DATA SHAPE. Keys:", Object.keys(d1));
      console.log("Full data (truncated):", JSON.stringify(d1).slice(0, 500));
    }
  } catch (err) {
    console.error("FATAL:", err);
  }

  console.log("\n=== Test 2: Continuation chunk (with context) ===");
  const fakeContext = "Las runas son un antiguo sistema de escritura utilizado por los pueblos germánicos. Su origen se remonta al siglo II d.C. y cada símbolo posee un significado fonético y simbólico. Las runas del Elder Futhark, el sistema más antiguo, constan de 24 caracteres divididos en tres familias u aettir. El estudio de las runas ha experimentado un renacimiento en las últimas décadas.";
  
  const prompt2 = `You are a premium, expert book author writing in Spanish.
Chapter title: "Introducción a las runas"
Book topic: "Runas"
Target word count: WRITE AT LEAST 600 WORDS.
This is part 2 of 3 of the chapter.

Previously generated context (DO NOT REPEAT, CONTINUE NATURALLY):
${fakeContext}

Continue the exposition into the next subtopics. DO NOT summarize.

CRITICAL INSTRUCTIONS:
1. GOAL: Write with MAXIMUM information density.
2. QUANTITY: Return AT LEAST 6 blocks.
3. OUTPUT FORMAT: Return exclusively a valid JSON object (no markdown):
{
  "blocks": [
    { "type": "paragraph", "text": "string (at least 80 words each)" }
  ]
}`;

  try {
    const r2 = await ai.generate({ content: '' }, { engine: 'chapter-writer', prompt: prompt2, maxTokens: 8192 });
    console.log("Provider:", r2.provider);
    console.log("Error:", r2.error || "none");
    const d2 = r2.data as any;
    
    if (d2.blocks && Array.isArray(d2.blocks)) {
      console.log("SUCCESS: Direct blocks found:", d2.blocks.length);
      const text = d2.blocks.map((b: any) => b.text || b.body || '').join(' ');
      console.log("Word count:", text.split(/\s+/).filter(Boolean).length);
    } else if (d2.content) {
      console.log("Raw content length:", d2.content.length);
      try {
        const parsed = JSON.parse(d2.content);
        console.log("Parsed has blocks?", !!parsed.blocks);
      } catch (e) {
        console.log("Content not JSON, first 300 chars:", d2.content.slice(0, 300));
      }
    } else {
      console.log("UNEXPECTED DATA SHAPE. Keys:", Object.keys(d2));
      console.log("Full data (truncated):", JSON.stringify(d2).slice(0, 500));
    }
  } catch (err) {
    console.error("FATAL:", err);
  }
}

testSingleChunk();
