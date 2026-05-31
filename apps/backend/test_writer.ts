import { generateFullChapterTemplate } from './src/engines/templates';

async function main() {
  console.log("Starting diagnostic run of generateFullChapterTemplate...");
  try {
    const res = await generateFullChapterTemplate(
      "Introducción a las runas: historia y contexto",
      "requiere IA externa valida",
      "Runas",
      800, // target 800 words, which should be 1 iteration
      "Tono: Claro, experto, cálido y directo.",
      "Tablas: Serif",
      (progress) => console.log(`Progress: ${progress}%`)
    );
    console.log("Generation finished!");
    console.log("Used Provider:", res.provider);
    console.log("External AI Used:", res.data.externalAiUsed);
    console.log("Length of content:", (res.data.content || "").length, "chars");
    if (res.data.generationWarnings) {
      console.log("Warnings:", res.data.generationWarnings);
    }
    if (res.error) {
      console.log("Error:", res.error);
    }
  } catch (err) {
    console.error("Fatal Error during generation:", err);
  }
}

main();
