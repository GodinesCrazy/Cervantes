import type { LayoutDocument } from './layoutEngine';

export type EditorialDepthReport = {
  status: 'APPROVED' | 'NEEDS_REVISION';
  score: number;
  checks: Record<string, boolean>;
  issues: string[];
  recommendedActions: string[];
};

const genericSignals = [
  /es importante\b/gi,
  /en conclusi[oó]n\b/gi,
  /puede ayudar\b/gi,
  /de manera efectiva\b/gi,
  /es fundamental\b/gi,
];
const aiSignals = [/como modelo/i, /en este texto/i, /a continuaci[oó]n/i, /prompt/i, /generado por ia/i];
const markdownSignals = [/\*\*/, /!\[/, /\|---\|/];
const riskyClaims = [/garantiza/i, /cura/i, /elimina por completo/i, /sin riesgo/i, /resultados asegurados/i];

export class EditorialDepthInspector {
  inspect(layout: LayoutDocument): EditorialDepthReport {
    const text = layout.pages.map((page) => `${page.title}\n${page.subtitle || ''}\n${page.content.join('\n')}`).join('\n\n');
    const words = text.split(/\s+/).filter(Boolean);
    const paragraphs = text.split(/\n+/).filter((line) => line.trim().length > 80);
    const repeatedOpeners = new Map<string, number>();
    for (const paragraph of paragraphs) {
      const key = paragraph.trim().split(/\s+/).slice(0, 7).join(' ').toLowerCase();
      repeatedOpeners.set(key, (repeatedOpeners.get(key) || 0) + 1);
    }
    const repeated = [...repeatedOpeners.values()].some((count) => count > Math.max(4, Math.floor(layout.pages.length / 12)));
    const genericHits = genericSignals.reduce((count, pattern) => count + (text.match(pattern)?.length || 0), 0);
    const hasExamples = /ejemplo|caso|escenario|aplicaci[oó]n pr[aá]ctica/i.test(text);
    const hasVisuals = /!\[Figura editorial|Tabla de decisi[oó]n|Worksheet|Checklist/i.test(text);
    const hasCommercialCoherence = Boolean(layout.title && layout.subtitle && /promesa|mercado|lector|public/i.test(text));
    const hasRiskyClaims = riskyClaims.some((pattern) => pattern.test(text));
    const aiTone = aiSignals.some((pattern) => pattern.test(text));
    const markdownVisible = markdownSignals.some((pattern) => pattern.test(text));
    const enoughDepth = words.length >= 1200 && layout.pages.length >= 8;
    const lowGenericTone = genericHits <= Math.max(8, Math.floor(words.length / 280));

    const checks = {
      enoughDepth,
      lowGenericTone,
      noAiTone: !aiTone,
      noVisibleMarkdown: !markdownVisible,
      noExcessiveRepetition: !repeated,
      hasExamples,
      hasVisuals,
      noRiskyClaims: !hasRiskyClaims,
      commercialCoherence: hasCommercialCoherence,
    };
    const issues: string[] = [];
    if (!checks.enoughDepth) issues.push('El contenido necesita mas desarrollo editorial antes de competir como ebook premium.');
    if (!checks.lowGenericTone) issues.push('Hay demasiadas frases genericas; conviene agregar escenas, ejemplos y decisiones concretas.');
    if (!checks.noAiTone) issues.push('Se detecta tono o metatexto asociado a IA/chat.');
    if (!checks.noVisibleMarkdown) issues.push('Hay marcas Markdown visibles en paginas reader-facing.');
    if (!checks.noExcessiveRepetition) issues.push('Hay repeticion estructural en parrafos.');
    if (!checks.hasExamples) issues.push('Faltan ejemplos o casos aplicados.');
    if (!checks.hasVisuals) issues.push('Faltan figuras, tablas o worksheets integrados al contenido.');
    if (!checks.noRiskyClaims) issues.push('Hay claims absolutos o riesgosos.');
    if (!checks.commercialCoherence) issues.push('La promesa comercial no queda conectada con contenido y metadata.');
    const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
    const hasBlockingIssue = !checks.enoughDepth || !checks.noAiTone || !checks.noVisibleMarkdown || !checks.hasVisuals || !checks.noRiskyClaims || !checks.commercialCoherence;
    const status = hasBlockingIssue || score < 85 ? 'NEEDS_REVISION' : 'APPROVED';
    return {
      status,
      score,
      checks,
      issues,
      recommendedActions: issues.length
        ? [
            'Expandir capitulos breves con ejemplos humanos y pasos concretos.',
            'Regenerar paginas marcadas como needs revision.',
            'Revisar claims y reemplazarlos por recomendaciones prudentes.',
          ]
        : ['Contenido listo para maquetacion y exportacion premium.'],
    };
  }
}
