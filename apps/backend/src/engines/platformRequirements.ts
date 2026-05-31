export function getPlatformRequirements(platforms: string[]) {
  const reqs = [];
  const platformsLower = platforms.map(p => p.toLowerCase());

  if (platformsLower.some(p => p.includes('kdp') || p.includes('amazon'))) {
    reqs.push({
      platform: 'Amazon KDP',
      recommendedFormat: 'EPUB',
      validation: 'Kindle Previewer',
      cover: 'High Quality',
      restrictions: ['Disclosure de IA cuando corresponda', 'Evitar contenido de baja calidad', 'Metadata coherente']
    });
  }
  
  if (platformsLower.some(p => p.includes('apple'))) {
    reqs.push({
      platform: 'Apple Books',
      recommendedFormat: 'EPUB 3',
      cover: 'JPG/PNG, RGB, min 1400px en lado menor',
      restrictions: ['Imágenes optimizadas', 'Metadata consistente']
    });
  }

  if (platformsLower.some(p => p.includes('gumroad'))) {
    reqs.push({
      platform: 'Gumroad',
      recommendedFormat: 'PDF',
      cover: 'Any',
      restrictions: ['PDF mobile-friendly recomendado', 'Producto descargable claro']
    });
  }

  // Fallback default
  if (reqs.length === 0) {
    reqs.push({
      platform: 'Standard Web',
      recommendedFormat: 'PDF',
      cover: 'Standard',
      restrictions: []
    });
  }

  return reqs;
}

export function exportFormatDecision(platforms: string[], productType: string) {
  const isGumroadOnly = platforms.length === 1 && platforms[0].toLowerCase().includes('gumroad');
  const isBundle = productType.toLowerCase().includes('bundle');
  
  if (isBundle) {
    return 'ZIP (PDF + Workbook + Anexos)';
  } else if (isGumroadOnly) {
    return 'PDF (Mobile Friendly)';
  } else {
    // Default to EPUB as the standard for major retailers (KDP, Apple, Kobo, Play)
    return 'EPUB';
  }
}
