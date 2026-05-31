import { z } from 'zod';

export const ParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string()
});

export const ChecklistBlockSchema = z.object({
  type: z.literal('checklist'),
  heading: z.string().optional(),
  items: z.array(z.string())
});

export const TableBlockSchema = z.object({
  type: z.literal('table'),
  heading: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string()))
});

export const ExpertTipBlockSchema = z.object({
  type: z.literal('expert_tip'),
  heading: z.string().optional(),
  body: z.string(),
  source: z.string().optional(),
  requiresVerification: z.boolean().optional()
});

export const CaseStudyBlockSchema = z.object({
  type: z.literal('case_study'),
  heading: z.string().optional(),
  situation: z.string(),
  decision: z.string(),
  result: z.string()
});

export const ExerciseBlockSchema = z.object({
  type: z.literal('exercise'),
  heading: z.string().optional(),
  instructions: z.string(),
  fields: z.array(z.string())
});

export const InlineImageBlockSchema = z.object({
  type: z.literal('inline_image'),
  image_prompt: z.string(),
  caption: z.string().optional(),
  localUrl: z.string().optional()
});

export const BlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  ChecklistBlockSchema,
  TableBlockSchema,
  ExpertTipBlockSchema,
  CaseStudyBlockSchema,
  ExerciseBlockSchema,
  InlineImageBlockSchema
]);

export const ChapterSchema = z.object({
  chapterTitle: z.string(),
  objective: z.string().optional(),
  opening: z.string(),
  blocks: z.array(BlockSchema),
  summary: z.string(),
  action_closing: z.object({
    key_idea: z.string(),
    today_action: z.string(),
    common_error: z.string(),
    follow_up_question: z.string()
  }),
  references: z.array(z.object({
    title: z.string(),
    source: z.string(),
    verified: z.boolean()
  })).optional()
});

export type ChapterData = z.infer<typeof ChapterSchema>;

export function sanitizeGeneratedContent(rawContent: unknown): { success: boolean; data?: ChapterData; error?: string } {
  try {
    let jsonContent: unknown;
    
    // Si viene como string, intentamos parsear
    if (typeof rawContent === 'string') {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (!match) return { success: false, error: 'No JSON object found in response' };
      
      let cleanText = match[0];
      cleanText = cleanText.replace(/example\.com/gi, '');
      
      jsonContent = JSON.parse(cleanText);
    } else {
      jsonContent = rawContent;
    }

    const result = ChapterSchema.safeParse(jsonContent);
    if (!result.success) {
      return { success: false, error: 'Schema validation failed: ' + JSON.stringify(result.error.issues) };
    }

    // Sanitización extra de strings (eliminar HTML)
    const data = result.data;
    const htmlRegex = /<\/?[a-z][\s\S]*>/i;

    const traverseAndSanitize = (obj: any) => {
      if (typeof obj === 'string') {
        if (htmlRegex.test(obj)) throw new Error('HTML inyectado detectado');
        if (obj.includes('FIXME') || obj.includes('TODO')) throw new Error('Placeholder (TODO/FIXME) detectado');
        if (obj.toLowerCase().includes('lorem ipsum')) throw new Error('Lorem ipsum detectado');
        if (obj.includes('![') || obj.includes('](')) throw new Error('Markdown inyectado detectado');
        if (obj.includes('```json')) throw new Error('JSON encapsulado detectado');
        if (obj.includes('paragraph') && obj.length === 9) throw new Error('Etiqueta paragraph filtrada');
      } else if (Array.isArray(obj)) {
        obj.forEach(traverseAndSanitize);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(traverseAndSanitize);
      }
    };

    traverseAndSanitize(data);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sanitization failed' };
  }
}
