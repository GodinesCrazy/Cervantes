export function lengthQualityGate(
  chapterPlanWordTotal: number,
  blockWordTotal: number,
  assembledManuscriptWordTotal: number,
  benchmark: any
) {
  const minRequired = benchmark.recommendedWordCountMin || 0;
  const issues = [];

  if (chapterPlanWordTotal < minRequired) {
    issues.push(`El plan de capítulos (${chapterPlanWordTotal} palabras) no alcanza el mínimo de mercado de ${minRequired} palabras para un ${benchmark.productType}.`);
  }

  if (blockWordTotal < chapterPlanWordTotal * 0.90) {
    issues.push(`Los bloques generados (${blockWordTotal} palabras) son inferiores al 90% de la longitud planeada (${chapterPlanWordTotal} palabras).`);
  }

  if (assembledManuscriptWordTotal < blockWordTotal * 0.95) {
    issues.push(`El ensamblaje del manuscrito perdió contenido (de ${blockWordTotal} a ${assembledManuscriptWordTotal} palabras).`);
  }

  if (assembledManuscriptWordTotal < minRequired) {
    issues.push(`El manuscrito final (${assembledManuscriptWordTotal} palabras) es demasiado corto para venderse como ${benchmark.productType} (mínimo: ${minRequired}).`);
  }

  if (benchmark.requiresWorkbook && !benchmark.workbookGenerated) {
    issues.push('Prometiste un workbook pero no ha sido generado o incluido.');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}
