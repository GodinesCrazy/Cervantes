import { AIService } from '../ai/aiService';

const ai = new AIService();

export const pipelinePhases = [
  'idea',
  'research',
  'languages',
  'go-nogo',
  'formula',
  'editorial-bible',
  'visual-bible',
  'chapter-plan',
  'blocks',
  'audit',
  'recovery',
  'visual-design',
  'export',
  'metadata',
  'publishing',
];

export async function clarificationQuestions(rawIdea: string) {
  return ai.generate([
    `¿Qué transformación concreta debe lograr el lector con "${rawIdea}"?`,
    '¿Qué nivel de experiencia tiene la audiencia principal?',
    '¿Qué promesa debe evitar exageraciones o claims no verificables?',
    '¿Qué tono debe dominar: didáctico, premium, práctico o inspiracional?',
  ], { engine: 'idea-intake', prompt: `Return JSON array of 4 Spanish clarification questions for this ebook idea: ${rawIdea}` });
}

export async function marketResearchTemplate(topic = 'ebook premium') {
  const normalized = topic
    .toLowerCase()
    .replace(/^un ebook premium sobre\s+/i, '')
    .replace(/^ebook premium sobre\s+/i, '')
    .replace(/\.$/, '');
  const extracted = normalized.match(/sobre ([^,.]+?)( para | con |$)/)?.[1] || normalized.match(/^([^,.]+?)( para | con |$)/)?.[1] || normalized;
  const coreTopic = extracted.trim() || 'metodo editorial';
  const displayTopic = coreTopic.charAt(0).toUpperCase() + coreTopic.slice(1);
  const recommendedTitle =
    coreTopic.includes('runa') ? 'Runas Esenciales: Método Visual para Principiantes' : `${displayTopic}: Método Visual Premium`;
  return ai.generate({
    niche: coreTopic,
    audience: 'Lectores que buscan una guía práctica, clara y visualmente cuidada.',
    opportunityScore: 78,
    riskLevel: 'MEDIUM',
    saturationLevel: 'MODERATE',
    recommendedTitle,
    suggestedTitles: JSON.stringify([
      {
        title: recommendedTitle,
        language: 'es',
        market: 'Spanish-first digital publishing',
        adaptation: 'Concepto creado para el mercado principal recomendado; no es traduccion literal.',
        promise: 'Equilibra claridad SEO, promesa visual y posicionamiento premium.',
      },
      {
        title: coreTopic.includes('runa') ? 'El Camino de las Runas' : `El Camino de ${displayTopic}`,
        language: 'es',
        market: 'Spanish premium niche',
        adaptation: 'Mas evocador para portada y branding, menos directo para busqueda.',
        promise: 'Tiene tono editorial memorable y funciona bien para portada.',
      },
      {
        title: coreTopic.includes('runa') ? 'Runas Paso a Paso' : `${displayTopic} Paso a Paso`,
        language: 'es',
        market: 'Spanish beginner SEO',
        adaptation: 'Adaptado a busqueda de principiantes y marketplaces.',
        promise: 'Prioriza claridad para principiantes y buen encaje en marketplaces.',
      },
      {
        title: coreTopic.includes('runa') ? 'Runes Made Visual' : `${displayTopic} Made Visual`,
        language: 'en',
        market: 'English expansion',
        adaptation: 'Titulo conceptual para expansion; se adapta al beneficio visual del mercado ingles.',
        promise: 'Mas natural para ingles que una traduccion directa del titulo espanol.',
      },
    ]),
    titleRationale:
      'El nombre comercial se propone despues del analisis porque debe responder a promesa, audiencia, saturacion, keywords, idioma del mercado principal y posicionamiento. Si otro idioma supera al principal, se adapta el concepto al mercado ganador en vez de traducirse palabra por palabra.',
    summary:
      'Hay oportunidad si el producto se diferencia por estructura, claridad editorial, diseño premium y una promesa específica.',
    fullReport:
      'Validar keywords, revisar 8-12 competidores directos, comparar precios, analizar portadas y detectar huecos de contenido accionable.',
  }, { 
    engine: 'market-research', 
    prompt: `Return strict JSON market research for this ebook topic: "${topic}". You MUST use exactly these keys in your JSON: "niche", "subNiche", "audience", "painDesire", "competitorCount", "priceRangeLow", "priceRangeHigh", "avgReviews", "formats", "estimatedLength", "commercialPromise", "observedCovers", "keywords", "language", "opportunityScore", "riskLevel", "saturationLevel", "recommendedTitle", "suggestedTitles", "titleRationale", "sourceNotes", "userVerified", "summary", and "fullReport". Do not invent new keys.` 
  });
}

export async function languageTemplate(topic: string) {
  return ai.generate({
    recommendedPrimary: 'es',
    recommendedSecondary: 'en',
    strategyNote:
      'Lanzar primero en espanol para velocidad editorial y preparar adaptacion inglesa cuando el indice, la promesa y la metadata esten validados. El titulo se adapta al mercado ganador: concepto, promesa e idioma, no traduccion literal.',
    analysis:
      'El mercado espanol gana para MVP por menor friccion de produccion y mejor control editorial inicial. Ingles queda como expansion de mayor techo, con naming localizado.',
    languageScores: JSON.stringify([
      { language: 'es', score: 84, market: 'Spanish-first digital publishing', naming: 'Runas Esenciales: Metodo Visual para Principiantes', reason: 'Menor friccion de produccion y audiencia inicial clara.' },
      { language: 'en', score: 76, market: 'English expansion', naming: 'Runes Made Visual', reason: 'Mayor mercado, mas competencia; requiere adaptacion de promesa y keywords.' },
      { language: 'pt', score: 61, market: 'Portuguese expansion', naming: 'Runas Visuais Passo a Passo', reason: 'Buena expansion futura.' },
    ]),
  }, { 
    engine: 'language-opportunity', 
    prompt: `Return strict JSON language opportunity analysis for a premium ebook about "${topic}", with recommendedPrimary, recommendedSecondary, analysis, strategyNote, languageScores as JSON string.` 
  });
}

export async function editorialFormulaTemplate(topic: string) {
  return ai.generate({
    productType: 'Ebook premium práctico',
    includesWorkbook: true,
    includesQuickGuide: true,
    includesTemplates: false,
    isBundle: true,
    recommendedPrice: 19.9,
    priceStrategy: 'Precio medio-premium con bundle de lanzamiento.',
    positioning: 'Guía editorial clara, aplicable y visualmente superior a competidores genéricos.',
    valueProposition: 'De idea dispersa a producto publicable con estructura profesional.',
    recommendation: 'Crear ebook principal + workbook + checklist de publicación.',
    reasoning: 'El bundle aumenta valor percibido sin multiplicar demasiado la complejidad del MVP.',
  }, { 
    engine: 'editorial-formula', 
    prompt: `Return strict JSON editorial formula for a premium ebook bundle about the topic: "${topic}". You MUST use exactly these keys in your JSON: "productType", "includesWorkbook", "includesQuickGuide", "includesTemplates", "isBundle", "recommendedPrice", "priceStrategy", "positioning", "valueProposition", "recommendation", and "reasoning". Do not invent new keys.` 
  });
}

export async function editorialBibleTemplate(name: string, topic: string) {
  return ai.generate({
    title: name,
    subtitle: 'Guía premium paso a paso',
    centralPromise: 'Convertir conocimiento en un producto editorial útil, confiable y vendible.',
    audience: 'Lectores autodidactas que quieren resultados aplicables.',
    tone: 'Claro, experto, cálido y directo.',
    structure: 'Introducción, fundamentos, método, práctica guiada, cierre y recursos.',
    tableOfContents:
      '# Índice maestro\n\nFront matter\n1. Promesa y contexto\n2. Fundamentos esenciales\n3. Método paso a paso\n4. Ejercicios guiados\n5. Checklist final\nApéndices\nGlosario\nCréditos visuales',
    contentRules: 'Evitar relleno, claims absolutos y lenguaje meta sobre generación.',
    qualityCriteria: 'Claridad, utilidad, continuidad, ejemplos y cierre accionable por capítulo.',
    fullDocument:
      'Biblia editorial en modo plantilla. Completar con ejemplos propios, fuentes y criterios comerciales antes de producción final.',
  }, { 
    engine: 'editorial-bible', 
    prompt: `Return strict JSON editorial bible for ebook title "${name}" which is about the topic: "${topic}". You MUST use exactly these keys in your JSON: "title", "subtitle", "centralPromise", "audience", "tone", "style", "structure", "tableOfContents", "estimatedLength", "contentRules", "claimsRules", "ethicsRules", "chapterTemplate", "exerciseTemplate", "qualityCriteria", "approvalChecklist", and "fullDocument". Do not invent new keys.` 
  });
}

export async function visualBibleTemplate(topic: string) {
  return ai.generate({
    visualConcept: 'Premium editorial contemporáneo',
    artDirection: 'Composición limpia, alto contraste, acentos cálidos y diagramas sobrios.',
    colorPalette: '#101214, #F4F0E8, #C9A227, #3A7D7C, #D95D39',
    typography: 'Serif elegante para títulos, sans humanista para lectura y tablas.',
    coverStyle: 'Portada con símbolo central, textura sutil y jerarquía tipográfica clara.',
    imagePrompts:
      'Portada editorial premium, símbolo abstracto del tema, fondo texturizado sobrio, luz suave, composición limpia.',
    requiredAssets: 'Portada, contraportada, separadores, iconos, tablas, láminas, figuras, workbook y mockups.',
    visualChecklist: 'Legibilidad, contraste, coherencia de paleta, portabilidad a PDF/EPUB.',
    fullDocument: 'Biblia visual base para producir assets consistentes.',
  }, { 
    engine: 'visual-bible', 
    prompt: `Return strict JSON premium visual bible for an ebook about the topic: "${topic}". You MUST use exactly these keys in your JSON: "visualConcept", "artDirection", "colorPalette", "typography", "coverStyle", "backCoverStyle", "separatorStyle", "plateStyle", "tableStyle", "calloutStyle", "iconographyStyle", "imagePrompts", "requiredAssets", "visualChecklist", "exportCriteria", and "fullDocument". Do not invent new keys.` 
  });
}

export async function chapterPlanTemplate(projectId: number, topic: string) {
  return ai.generate([
    {
      projectId,
      chapterNumber: 1,
      title: 'Promesa, lector y mapa del viaje',
      summary: 'Define el problema, el resultado esperado y cómo usar el libro.',
      estimatedWords: 1800,
      order: 1,
    },
    {
      projectId,
      chapterNumber: 2,
      title: 'Fundamentos esenciales',
      summary: 'Explica conceptos base sin sobrecargar al lector.',
      estimatedWords: 2600,
      order: 2,
    },
    {
      projectId,
      chapterNumber: 3,
      title: 'Método paso a paso',
      summary: 'Entrega el proceso principal con ejemplos y decisiones prácticas.',
      estimatedWords: 3200,
      order: 3,
    },
    {
      projectId,
      chapterNumber: 4,
      title: 'Práctica guiada y errores comunes',
      summary: 'Incluye ejercicios, plantillas y correcciones frecuentes.',
      estimatedWords: 2800,
      order: 4,
    },
    {
      projectId,
      chapterNumber: 5,
      title: 'Sistema visual, tablas y recursos descargables',
      summary: 'Integra figuras, láminas, tablas de decisión y recursos de apoyo.',
      estimatedWords: 2200,
      order: 5,
    },
    {
      projectId,
      chapterNumber: 6,
      title: 'Checklist final y próximos pasos',
      summary: 'Cierra con síntesis accionable, traducción base y guía de publicación.',
      estimatedWords: 1800,
      order: 6,
    },
  ], { engine: 'chapter-plan', prompt: `Return JSON array of exactly 6 chapter plan objects for a premium ebook about the topic: "${topic}". Make sure the chapters flow logically and practically. You MUST use exactly these keys for each object: "projectId" (set to ${projectId}), "chapterNumber" (integer), "title" (string), "summary" (string), "estimatedWords" (integer), and "order" (integer).` });
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractContent(data: Record<string, unknown>) {
  return String(data.content || Object.values(data).find(v => typeof v === 'string') || '').trim();
}

function localEditorialChapterFallback(title: string, summary: string, topic: string, minWords: number) {
  const baseSummary = summary || `Este capitulo desarrolla una parte esencial de ${topic}.`;
  const base = [
    `# ${title}`,
    `## Apertura editorial`,
    `${baseSummary} La finalidad de este capitulo es transformar una idea general en una experiencia de lectura clara, útil y aplicable. Un ebook premium no se limita a explicar conceptos: acompaña al lector, ordena sus decisiones y le entrega una forma concreta de avanzar sin sentirse perdido. Por eso, esta sección se presenta como una guía de trabajo, con contexto, método, ejemplos y un cierre práctico.`,
    `## Lo que el lector debe comprender`,
    `Antes de aplicar cualquier técnica, conviene entender por qué este tema importa dentro de "${topic}". El lector necesita una base suficientemente sólida para tomar decisiones, pero no una acumulación de teoría que lo aleje del resultado prometido. El enfoque correcto combina tres capas: una explicación sencilla, una interpretación práctica y una acción verificable. Cuando esas capas están presentes, el contenido se siente escrito por un editor humano y no como una respuesta genérica.`,
    `En la práctica, esto significa que cada idea debe responder a una pregunta concreta: qué es, por qué importa y cómo se usa. Si una página solo define conceptos, queda incompleta. Si solo enumera pasos, puede volverse mecánica. Si solo inspira, no ayuda a ejecutar. La calidad editorial aparece cuando las tres funciones trabajan juntas y el lector percibe continuidad entre la promesa del libro, el índice y cada capítulo.`,
    `## Método paso a paso`,
    `1. Define el objetivo de la sección en una frase precisa. El objetivo debe ser observable: al terminar, el lector podrá decidir, comparar, aplicar o corregir algo.`,
    `2. Presenta el concepto central con lenguaje directo. Evita promesas absolutas y explica los límites naturales del método.`,
    `3. Agrega un ejemplo breve. El ejemplo debe parecer realista, con una situación, una decisión y una consecuencia.`,
    `4. Convierte el ejemplo en una herramienta: una lista de revisión, una tabla de criterios, una pregunta de diagnóstico o un ejercicio guiado.`,
    `5. Cierra con una transición hacia el capítulo siguiente para que el libro no se sienta como fragmentos separados.`,
    `## Ejemplo aplicado`,
    `Imagina que el lector llega a este capítulo con curiosidad, pero también con dudas sobre cómo convertir la información en una decisión práctica. Una versión débil del contenido le diría solamente qué debe hacer. Una versión editorial premium le muestra cómo pensar: primero identifica el problema, luego revisa las condiciones, después elige una acción y finalmente evalúa si esa acción produjo el resultado esperado. Este cambio de enfoque hace que el lector sienta que está aprendiendo un sistema, no memorizando respuestas.`,
    `Por ejemplo, si el tema exige interpretar señales, hábitos, símbolos, rutinas o decisiones, la guía debe enseñar al lector a mirar patrones. No basta con decir "observa con atención". Hay que explicar qué observar, durante cuánto tiempo, cómo registrar lo observado y qué errores evitar. Esa precisión es la que diferencia un ebook superficial de una obra vendible y confiable.`,
    `## Tabla editorial de decisión`,
    `| Situación del lector | Riesgo común | Acción recomendada | Resultado esperado |`,
    `| --- | --- | --- | --- |`,
    `| Quiere avanzar rápido | Saltar fundamentos | Revisar el mapa del capítulo antes de practicar | Menos confusión y mejor retención |`,
    `| Tiene dudas sobre el método | Buscar respuestas absolutas | Comparar señales y contexto | Decisiones más prudentes |`,
    `| Necesita aplicar lo aprendido | Quedarse en teoría | Completar una mini práctica guiada | Progreso visible |`,
    `## Ejercicio guiado`,
    `Toma una situación concreta relacionada con "${topic}" y descríbela en tres líneas. Luego responde: qué sé con seguridad, qué estoy suponiendo y qué necesito comprobar antes de actuar. Esta simple separación reduce errores, mejora la claridad mental y convierte la lectura en una herramienta de trabajo. Al finalizar, escribe una acción pequeña que puedas ejecutar en menos de diez minutos. La acción debe ser específica, medible y coherente con la promesa del capítulo.`,
    `## Errores frecuentes`,
    `El primer error es confundir profundidad con extensión. Un capítulo puede ser largo y aun así no aportar valor si repite la misma idea con otras palabras. El segundo error es usar un tono demasiado impersonal, como si el texto hablara desde lejos. El tercero es no mostrar consecuencias prácticas. El lector premium quiere sentir que cada página tiene intención: una imagen que orienta, una tabla que compara, un ejemplo que aterriza y una conclusión que prepara el siguiente paso.`,
    `## Cierre accionable`,
    `La idea central de este capítulo es que el conocimiento solo se vuelve valioso cuando se convierte en criterio y acción. Antes de continuar, el lector debería poder explicar el concepto principal con sus propias palabras, reconocer un caso de uso y aplicar una pequeña decisión con seguridad razonable. Si eso ocurre, el capítulo cumple su función dentro del libro: no solo informa, sino que acompaña, ordena y mejora la experiencia del lector.`,
  ];

  while (countWords(base.join('\n\n')) < minWords) {
    const round = Math.ceil((minWords - countWords(base.join('\n\n'))) / 120);
    base.push(
      `## Profundización editorial ${round}`,
      `Para reforzar la coherencia del capítulo, conviene volver al principio rector: cada explicación debe terminar en una decisión útil. En "${topic}", el lector no compra únicamente información; compra claridad, confianza y una forma de avanzar. Por eso, este bloque añade una capa de contexto, un ejemplo adicional y una recomendación aplicable. Si una idea parece demasiado abstracta, debe convertirse en una pregunta concreta. Si una recomendación parece demasiado general, debe transformarse en una acción pequeña. Este proceso mantiene el estándar premium incluso cuando el sistema trabaja con fallback local.`,
    );
  }

  return base.join('\n\n');
}

function ensureChapterDepth(content: string, title: string, summary: string, topic: string, minWords: number) {
  if (countWords(content) >= minWords) return content;
  const supplement = localEditorialChapterFallback(title, summary, topic, minWords - countWords(content) + 350);
  return `${content.trim()}\n\n${supplement.replace(/^# .+\n\n/, '')}`.trim();
}

export async function generateFullChapterTemplate(title: string, summary: string, topic: string, wordCount: number, onProgress?: (progress: number) => void) {
  const minWords = Math.max(850, Math.min(1600, Math.round((wordCount || 1000) * 0.6)));
  const warnings: string[] = [];
  const sectionDelayMs = Number(process.env.AI_SECTION_DELAY_MS || 3500);
  // Dividir el capítulo en secciones para evitar bloqueos y administrar proveedores externos por tramo.
  const sections = [
    { name: 'Introducción', goal: `Write a compelling and comprehensive introduction (MINIMUM ${Math.round(wordCount * 0.2)} words) for this chapter. Hook the reader, provide deep context, and explain what they will learn.` },
    { name: 'Desarrollo central', goal: `Write the extensive main body content (MINIMUM ${Math.round(wordCount * 0.5)} words) for this chapter. Cover the core concepts, techniques, and practical advice in extreme depth.` },
    { name: 'Aplicación práctica', goal: `Write a detailed practical application section (MINIMUM ${Math.round(wordCount * 0.2)} words). Include concrete examples, scenarios, tips, and actionable steps the reader can take.` },
    { name: 'Conclusión', goal: `Write a robust conclusion (MINIMUM ${Math.round(wordCount * 0.1)} words). Summarize key takeaways deeply and transition to the next chapter smoothly.` },
  ];

  const parts: string[] = [];
  const providers = new Set<string>();

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const result = await ai.generate(
      { content: '' },
      {
        engine: 'chapter-writer',
        prompt: `You are a premium, expert book author and ghostwriter writing in Spanish. 
Chapter title: "${title}"
Book topic: "${topic}"
Chapter summary: "${summary}"
Section to write: "${section.name}"

CRITICAL INSTRUCTIONS:
1. ${section.goal}
2. You MUST write at length. Provide comprehensive, extensive details to meet or exceed the word count goal.
3. Do NOT summarize. Do NOT be brief. Expand on every concept with rich, premium editorial quality.
4. Write in a clear, coherent, engaging and authoritative tone in Spanish.
5. Use markdown formatting (headings, bullet points, bold text) where appropriate.
6. Return a valid JSON object with exactly one key: "content". The value must contain the markdown text for this section.

Do NOT output meta-commentary.`,
      }
    );

    if (result.error) {
      warnings.push(`${section.name}: ${result.error}`);
      if (i === 0 && result.provider === 'template') {
        warnings.push('Se detuvo la escritura por IA para este capitulo porque ningun proveedor externo disponible respondio en la primera seccion.');
        if (onProgress) onProgress(100);
        break;
      }
    }

    const text = extractContent(result.data as Record<string, unknown>);

    if (text && countWords(text) > 80) {
      parts.push(text);
      providers.add(result.provider);
    } else {
      warnings.push(`${section.name}: salida demasiado corta; se completara con respaldo editorial local.`);
    }
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sections.length) * 100));
    }
    
    if (i < sections.length - 1) {
      await new Promise(resolve => setTimeout(resolve, result.provider === 'template' ? 250 : sectionDelayMs));
    }
  }

  const generatedContent = parts.join('\n\n').trim();
  const fullContent = ensureChapterDepth(generatedContent || `# ${title}\n\n${summary}`, title, summary, topic, minWords);
  const externalAiUsed = Array.from(providers).some(provider => provider !== 'template');
  if (!externalAiUsed) {
    warnings.push('No se obtuvo contenido util de una IA externa; este capitulo queda como borrador local no publicable hasta regenerar con una credencial valida.');
  }
  return {
    data: {
      content: fullContent,
      externalAiUsed,
      generationWarnings: warnings.join(' | '),
      providers: Array.from(providers).join(', ') || 'template',
    },
    provider: externalAiUsed ? 'multi-ai' : 'template',
  };
}

export async function auditTemplate() {
  return ai.generate({
    coherenceScore: 82,
    toneScore: 86,
    structureScore: 80,
    completenessScore: 74,
    overallScore: 81,
    issues: 'Faltan ejemplos específicos y referencias de mercado en algunos bloques.',
    recommendations: 'Añadir casos concretos, revisar transiciones y cerrar cada capítulo con checklist.',
    approvalStatus: 'NEEDS_REVISION',
    fullReport: 'Auditoría de plantilla completada. Lista para revisión editorial humana.',
  }, { engine: 'audit', prompt: `Return strict JSON editorial audit report. You MUST respond entirely in SPANISH (all text fields must be in Spanish). You MUST use EXACTLY these keys: "coherenceScore" (number 0-100), "toneScore" (number 0-100), "structureScore" (number 0-100), "completenessScore" (number 0-100), "overallScore" (number 0-100), "issues" (array of strings in Spanish describing problems found), "recommendations" (array of strings in Spanish with actionable suggestions), "fullReport" (string in Spanish with a detailed editorial summary), and "approvalStatus" (string: use "APPROVED" if overallScore >= 75, otherwise "NEEDS_REVISION"). Do not nest scores inside a "scores" object.` });
}

export async function metadataTemplate(name: string) {
  const title = name === 'Proyecto en análisis' ? 'Título comercial pendiente de investigación' : name;
  return ai.generate({
    commercialTitle: title,
    subtitle: 'Una guía premium, práctica y lista para aplicar',
    longDescription:
      'Libro diseñado para transformar una idea o conocimiento en una experiencia clara, estructurada y comercialmente atractiva.',
    shortDescription: 'Guía premium con método, ejercicios y checklist final.',
    salesBullets: 'Método paso a paso\nDiseño editorial claro\nChecklist de publicación\nFormato práctico',
    keywords: 'ebook premium, guía práctica, publicación digital, metodología',
    suggestedCategories: 'Educación / Desarrollo personal / Negocios digitales',
    recommendedPrice: 19.9,
    launchStrategy: 'Validar portada, descripción y precio con preventa o audiencia inicial.',
    promoCopy: 'Convierte una idea en un libro claro, útil y listo para publicar.',
  }, { engine: 'metadata', prompt: `Return strict JSON commercial metadata for ebook title "${title}" for KDP and Gumroad.` });
}

export async function publishingTemplate() {
  return ai.generate({
    items:
      'Portada final aprobada\nMetadata revisada\nPDF validado\nEPUB validado\nDeclaración de IA preparada\nPrecio definido\nArchivos respaldados',
    editorialGate: 'PENDING',
    technicalGate: 'PENDING',
    visualGate: 'PENDING',
    complianceGate: 'PENDING',
    platformGate: 'PENDING',
    aiDeclaration: 'Contenido asistido por herramientas de IA y revisado editorialmente por el autor.',
    copyrightStatus: 'Pendiente de confirmación final de assets y fuentes.',
    overallStatus: 'PENDING',
  }, { engine: 'publishing', prompt: 'Return strict JSON publishing checklist for KDP and Gumroad with AI declaration, copyright status, gates and items.' });
}
