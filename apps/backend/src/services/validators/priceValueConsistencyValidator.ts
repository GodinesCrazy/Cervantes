export function priceValueConsistencyValidator(price: number, benchmark: any, finalWordCount: number) {
  const issues = [];
  const isPremiumPrice = price >= 29.99;
  
  if (isPremiumPrice) {
    if (finalWordCount < 30000 && !benchmark.productType.includes('visual') && !benchmark.requiresWorkbook) {
      issues.push(`Precio premium ($${price}) no está justificado para un libro de ${finalWordCount} palabras sin complementos visuales o prácticos.`);
    }
  }

  if (price > 49.99 && !benchmark.productType.includes('bundle') && !benchmark.requiresWorkbook) {
    issues.push(`Los precios por encima de $50 suelen requerir bundles o cursos, no un solo ebook estándar.`);
  }

  return {
    passed: issues.length === 0,
    issues
  };
}
