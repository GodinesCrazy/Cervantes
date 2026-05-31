const forbidden = [
  /como modelo de ia/gi,
  /a continuaci[oó]n/gi,
  /en este texto/gi,
  /prompt/gi,
  /pendiente de redacci[oó]n/gi,
  /\bcomo\s+se\s+muestra\s+en\s+la\s+figura\s*\d*[.,]?\d*\b/gi,
  /\bvea\s+la\s+figura\s*\d*[.,]?\d*\b/gi,
  /\bver\s+figura\s*\d*[.,]?\d*\b/gi,
  /\b[Ff]igura\s*\d+[.,]?\d*\b/gi,
  /\b[Ii]magen\s*\d+[.,]?\d*\b/gi,
  /\b[Tt]abla\s*\d+[.,]?\d*\b/gi,
];

function clean(content: string) {
  let next = content || '';
  for (const pattern of forbidden) next = next.replace(pattern, '');
  return next
    .replace(/\b[Ee]s importante\b/g, 'Conviene')
    .replace(/\b[Ee]s fundamental\b/g, 'Resulta valioso')
    .replace(/\bde manera efectiva\b/g, 'con claridad')
    .replace(/\bpuede ayudar\b/g, 'sirve para orientar')
    .replace(/\bgarantizar\b/gi, 'favorecer')
    .replace(/\bgarantiza\b/gi, 'favorece')
    .replace(/\bsin riesgo\b/gi, 'con menor riesgo')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class EditorialRewriteEngine {
  rewriteBlock(title: string, content: string | null | undefined, bookTopic: string) {
    const original = clean(content || `# ${title}`);
    return original;
  }

  rewriteMarkdown(markdown: string) {
    return clean(markdown)
      .replace(/\b[Ee]s importante\b/g, 'Conviene')
      .replace(/\b[Ee]s fundamental\b/g, 'Resulta valioso')
      .replace(/\bde manera efectiva\b/g, 'con claridad')
      .replace(/\bpuede ayudar\b/g, 'sirve para orientar')
      .replace(/\bgarantizar\b/gi, 'favorecer')
      .replace(/\bgarantiza\b/gi, 'favorece');
  }
}
