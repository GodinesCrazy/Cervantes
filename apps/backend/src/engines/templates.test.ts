import { describe, expect, it } from 'vitest';
import { chapterPlanTemplate, clarificationQuestions, languageTemplate, marketResearchTemplate } from './templates';

describe('template engines', () => {
  it('generates clarification questions', async () => {
    const result = await clarificationQuestions('Runas premium');
    expect(result.data.length).toBeGreaterThan(3);
  });

  it('generates a chapter plan', async () => {
    const result = await chapterPlanTemplate(1, 'Runas premium');
    expect(result.data[0].title).toContain('Promesa');
  });

  it('does not leak demo runes into dog-care market research fallback', async () => {
    const result = await marketResearchTemplate('Un ebook sobre el cuidado de tu perro');
    const serialized = JSON.stringify(result.data).toLowerCase();
    expect(serialized).toContain('perro');
    expect(serialized).not.toContain('runa');
    expect(serialized).not.toContain('runes');
  });

  it('does not leak demo runes into dog-care language fallback', async () => {
    const result = await languageTemplate('Un ebook sobre el cuidado de tu perro');
    const serialized = JSON.stringify(result.data).toLowerCase();
    expect(serialized).toContain('perro');
    expect(serialized).not.toContain('runa');
    expect(serialized).not.toContain('runes');
  });
});
