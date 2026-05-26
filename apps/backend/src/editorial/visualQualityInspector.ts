import fs from 'node:fs/promises';
import type { LayoutDocument } from './layoutEngine';

export type VisualQualityReport = {
  status: 'APPROVED' | 'NEEDS_REVISION';
  score: number;
  pageCount: number;
  assetCount: number;
  checks: Record<string, boolean>;
  issues: string[];
};

const requiredPageTypes = ['cover', 'title', 'toc', 'chapter-opener', 'reading-page', 'figure-page', 'worksheet', 'appendix', 'credits'];
const forbidden = [/\*\*/, /!\[/, /como modelo de ia/i, /prompt/i, /lorem ipsum/i, /pendiente de redacci[oó]n/i, /NEEDS_/i];

async function exists(filePath?: string) {
  if (!filePath) return false;
  try {
    const stat = await fs.stat(filePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}

export class VisualQualityInspector {
  async inspect(layout: LayoutDocument, html: string, renderedFilePath?: string): Promise<VisualQualityReport> {
    const issues: string[] = [];
    const pageTypes = new Set(layout.pages.map((page) => page.type));
    const pageTypeCoverage = requiredPageTypes.every((type) => pageTypes.has(type as never));
    const assetEntries = Object.entries(layout.assets);
    const missingAssets: string[] = [];
    for (const [role, filePath] of assetEntries) {
      if (!(await exists(filePath))) missingAssets.push(role);
    }
    const rawMarkdownVisible = forbidden.some((pattern) => pattern.test(html));
    const longTextPages = layout.pages.filter((page) => page.content.join(' ').split(/\s+/).filter(Boolean).length > 360);
    const renderedHtmlExists = await exists(renderedFilePath);
    const hasPageShell = html.includes('book-page') && html.includes('book-cover');
    const hasFigures = html.includes('figure-page') && html.includes('worksheet-page') && html.includes('chapter-opener');
    const pdfFallback = renderedFilePath?.toLowerCase().endsWith('.html') === true && html.includes('PDF_RENDER_FALLBACK');

    if (!pageTypeCoverage) issues.push('Faltan plantillas editoriales requeridas.');
    if (assetEntries.length < 7 || missingAssets.length) issues.push(`Faltan assets SVG premium: ${missingAssets.join(', ') || 'cantidad insuficiente'}.`);
    if (rawMarkdownVisible) issues.push('Hay marcas Markdown, placeholders o metatexto visibles.');
    if (longTextPages.length) issues.push('Hay paginas con demasiado texto corrido para estandar premium.');
    if (!renderedHtmlExists) issues.push('No existe HTML renderizado persistido.');
    if (!hasPageShell) issues.push('El preview no esta renderizado como paginas de libro.');
    if (!hasFigures) issues.push('Faltan figuras, worksheet o aperturas visuales.');
    if (pdfFallback) issues.push('PDF cayo a fallback HTML.');

    const checks = {
      pageTypeCoverage,
      requiredAssetsPresent: assetEntries.length >= 7 && missingAssets.length === 0,
      noRawMarkdown: !rawMarkdownVisible,
      balancedTextDensity: longTextPages.length === 0,
      renderedHtmlExists,
      pageShellPresent: hasPageShell,
      figuresPresent: hasFigures,
      noPdfFallback: !pdfFallback,
    };
    const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
    return {
      status: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
      score,
      pageCount: layout.pages.length,
      assetCount: assetEntries.length,
      checks,
      issues,
    };
  }
}
