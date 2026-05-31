import { AIOrchestrator } from '../ai/aiOrchestrator';

export class CopyeditingEngine {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = new AIOrchestrator();
  }

  public async copyedit(content: string): Promise<string> {
    const prompt = `
Eres un editor jefe de ebooks premium y experto en copyediting en español.
Tu tarea es corregir y elevar la calidad del siguiente texto editorial.

REGLAS ESTRICTAS:
1. Corrige tildes, ortografía, gramática y puntuación.
2. Naturaliza frases robóticas y mejora la fluidez.
3. Elimina traducciones literales o construcciones forzadas (e.g. "Resulta valioso", "Conviene").
4. Mantén consistencia de tratamiento (usa un tono neutro profesional y directo, no robótico).
5. No uses mayúsculas innecesarias.
6. Evita muletillas. Evita frases genéricas sin contenido.
7. NO agregues introducciones, saludos ni explicaciones, devuelve ÚNICAMENTE el texto corregido en formato Markdown.

TEXTO ORIGINAL:
${content}
`;

    const result = await this.orchestrator.run('editorial-rewrite', { content: '' }, prompt);
    const correctedText = (result.data as any)?.content || (result.data as any) || content;
    
    // Fallback if the AI returned a JSON string instead of raw markdown content due to orchestration parsing
    if (typeof correctedText === 'string') {
      return correctedText.replace(/^```markdown\s*/, '').replace(/```$/, '').trim();
    }
    
    return content;
  }
}
