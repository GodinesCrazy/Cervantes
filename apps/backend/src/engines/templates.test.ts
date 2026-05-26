import { describe, expect, it } from 'vitest';
import { chapterPlanTemplate, clarificationQuestions } from './templates';

describe('template engines', () => {
  it('generates clarification questions', async () => {
    const result = await clarificationQuestions('Runas premium');
    expect(result.data.length).toBeGreaterThan(3);
  });

  it('generates a chapter plan', async () => {
    const result = await chapterPlanTemplate(1, 'Runas premium');
    expect(result.data[0].title).toContain('Promesa');
  });
});
