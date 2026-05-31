export function validateChapterSchema(content: string): { isValid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content is not a string.' };
  }

  try {
    const parsed = JSON.parse(content);
    if (!parsed.chapterTitle) return { isValid: false, error: 'Missing chapterTitle' };
    if (!parsed.blocks || !Array.isArray(parsed.blocks)) return { isValid: false, error: 'Missing blocks array' };

    for (const b of parsed.blocks) {
      if (!b.type) return { isValid: false, error: 'Block is missing type' };
      
      if (b.type === 'paragraph' && !b.text) return { isValid: false, error: 'Paragraph block missing text' };
      if (b.type === 'checklist' && (!b.items || !Array.isArray(b.items))) return { isValid: false, error: 'Checklist block missing items array' };
      if (b.type === 'table' && (!b.columns || !Array.isArray(b.columns) || !b.rows || !Array.isArray(b.rows))) return { isValid: false, error: 'Table block missing columns or rows array' };
      if (b.type === 'inline_image' && !b.caption) return { isValid: false, error: 'Inline_image block missing caption' };
      if (b.type === 'case_study' && (!b.situation || !b.decision || !b.result)) return { isValid: false, error: 'Case_study block missing fields' };
      if (b.type === 'expert_tip' && !b.body) return { isValid: false, error: 'Expert_tip block missing body' };
      if (b.type === 'exercise' && (!b.instructions || !b.fields || !Array.isArray(b.fields))) return { isValid: false, error: 'Exercise block missing fields' };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: `Invalid JSON format: ${err.message}` };
  }
}
