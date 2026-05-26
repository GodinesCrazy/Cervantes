import { describe, expect, it } from 'vitest';
import { inspectManuscript, validateGumroadPackage, validateKdpPackage } from './qualityService';

describe('production quality service', () => {
  it('detects reader-facing metatext and placeholders', () => {
    const report = inspectManuscript('# Draft\n\nTODO procedo con el siguiente capitulo');
    expect(report.status).toBe('NEEDS_REVISION');
    expect(report.issues.length).toBeGreaterThan(0);
  });

  it('approves complete KDP checklist input', () => {
    const result = validateKdpPackage({
      title: 'Runas Esenciales',
      subtitle: 'Metodo visual',
      aiDeclaration: 'AI-assisted and human reviewed.',
      keywords: 'runas, guia',
      categories: 'Body Mind Spirit',
      epubPath: 'ebook.epub',
      coverPath: 'cover.svg',
    });
    expect(result.status).toBe('APPROVED');
  });

  it('approves complete Gumroad checklist input', () => {
    const result = validateGumroadPackage({
      premiumPdfPath: 'ebook.pdf',
      zipPath: 'package.zip',
      salesDescription: 'Premium practical ebook.',
      price: 19.9,
      mockupPrompts: '3D ebook mockup',
      disclaimer: 'Rights reviewed.',
    });
    expect(result.status).toBe('APPROVED');
  });
});
