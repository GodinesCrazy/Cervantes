export class AntiRepetitionService {
  private bannedPhrases = [
    'Conviene',
    'Resulta valioso',
    'Es importante destacar',
    'Cabe señalar',
    'En resumen',
    'En conclusión',
    'Por lo tanto',
    'Como se mencionó anteriormente',
    'sirve para orientar'
  ];

  private previousBlocks: string[] = [];

  constructor() {}

  // Normalize text to calculate similarity
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúüñ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Jaccard index for similarity
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.normalize(text1).split(' '));
    const words2 = new Set(this.normalize(text2).split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  public detectRepetition(content: string, contextBlocks: string[] = []): { isRepetitive: boolean; reason?: string } {
    const normalizedContent = this.normalize(content);
    
    // 1. Check for banned phrases
    for (const phrase of this.bannedPhrases) {
      if (normalizedContent.includes(this.normalize(phrase))) {
        return { isRepetitive: true, reason: `Contiene frase repetitiva o muletilla: "${phrase}"` };
      }
    }

    // 2. Check similarity against context blocks (threshold 0.6)
    const blocksToCheck = contextBlocks.length > 0 ? contextBlocks : this.previousBlocks;
    for (const block of blocksToCheck) {
      if (block.split(' ').length < 25) continue; // Only check paragraphs with more than 25 words
      
      const similarity = this.calculateSimilarity(content, block);
      if (similarity > 0.6) {
        return { isRepetitive: true, reason: `Similitud alta (${Math.round(similarity * 100)}%) con un bloque anterior.` };
      }
    }

    return { isRepetitive: false };
  }

  public registerBlock(content: string) {
    if (content.split(' ').length >= 25) {
      this.previousBlocks.push(content);
    }
  }

  public clearHistory() {
    this.previousBlocks = [];
  }
}
