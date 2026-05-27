const forbidden = [
  /como modelo de ia/gi,
  /a continuaci[oó]n/gi,
  /en este texto/gi,
  /prompt/gi,
  /pendiente de redacci[oó]n/gi,
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
    const words = original.split(/\s+/).filter(Boolean).length;
    const hasCase = /caso|ejemplo|escenario|situaci[oó]n/i.test(original);
    const hasApplication = /aplicaci[oó]n|paso|ejercicio|checklist|pr[aá]ctica/i.test(original);
    const hasCaution = /evita|advertencia|seguridad|riesgo|prudente|verificar/i.test(original);
    const additions: string[] = [];

    if (words < 260) {
      additions.push(`## Desarrollo editorial

En "${title}", la idea central se transforma en una secuencia de lectura aplicable. Primero sitúa al lector frente al problema real; luego muestra qué señales debe observar; después propone una decisión concreta; finalmente deja una forma simple de revisar si la acción funcionó. Ese ritmo evita que el capítulo parezca una respuesta breve y lo acerca a una guía editorial completa.

Para este tramo del libro, la intención no es llenar páginas, sino crear confianza. Un ebook premium debe sonar escrito por alguien que acompaña al lector: explica, ejemplifica, advierte y aterriza cada concepto en una acción visible.`);
    }

    if (!hasCase) {
      additions.push(`## Caso aplicado

En el caso de "${title}", imagina a un lector que llega con entusiasmo, pero también con dudas. Si recibe solo definiciones, probablemente abandone. Si en cambio encuentra una situación concreta, una decisión guiada y un resultado esperable, puede avanzar con más seguridad. Por eso esta sección presenta el concepto como una escena práctica: qué ocurre, qué mirar, qué evitar y cómo actuar sin exagerar la promesa.`);
    }

    if (!hasApplication) {
      additions.push(`## Aplicación guiada

1. Identifica una señal observable relacionada con el tema.
2. Escríbela con palabras simples, sin interpretar de más.
3. Elige una acción pequeña que puedas ejecutar esta semana.
4. Registra qué cambió, qué no cambió y qué conviene ajustar.

Este ciclo aplicado a "${title}" transforma lectura en experiencia y hace que el contenido tenga valor más allá de la explicación.`);
    }

    if (!hasCaution) {
      additions.push(`## Criterio prudente

En "${title}", evita convertir una recomendación general en promesa absoluta. Cuando haya dudas, información incompleta o posibles efectos sobre bienestar, dinero, salud, seguridad o decisiones importantes, el lector debe verificar, contrastar y actuar de forma proporcional. La calidad editorial también se mide por la prudencia con que una guía marca sus límites.`);
    }

    return `${original}\n\n${additions.join('\n\n')}`.trim();
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
