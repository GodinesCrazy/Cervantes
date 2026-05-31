import { describe, it, expect } from 'vitest';
import { MARKET_LENGTH_MATRIX } from '../../src/engines/bookStandardBenchmarkEngine';
import { lengthQualityGate } from '../../src/services/validators/lengthQualityGate';
import { priceValueConsistencyValidator } from '../../src/services/validators/priceValueConsistencyValidator';

describe('Market Length Standards', () => {
  it('Should define the matrix correctly', () => {
    expect(MARKET_LENGTH_MATRIX['standard_ebook'].min).toBe(30000);
    expect(MARKET_LENGTH_MATRIX['premium_manual'].min).toBe(50000);
  });

  it('Premium ebook fails if word count is 15000', () => {
    const benchmark = { productType: 'premium_manual', recommendedWordCountMin: 50000, requiresWorkbook: false };
    const result = lengthQualityGate(55000, 50000, 15000, benchmark);
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => /demasiado corto/i.test(i))).toBe(true);
  });

  it('Premium bundle fails without workbook', () => {
    const benchmark = { productType: 'premium_bundle', recommendedWordCountMin: 60000, requiresWorkbook: true, workbookGenerated: false };
    const result = lengthQualityGate(70000, 68000, 65000, benchmark);
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.includes('workbook'))).toBe(true);
  });

  it('Price validation fails for $40 with 15000 words', () => {
    const benchmark = { productType: 'standard_ebook', requiresWorkbook: false };
    const result = priceValueConsistencyValidator(40, benchmark, 15000);
    expect(result.passed).toBe(false);
    expect(result.issues[0]).toMatch(/Precio premium.*no está justificado/i);
  });

  it('Price validation passes for $40 with 50000 words', () => {
    const benchmark = { productType: 'premium_manual', requiresWorkbook: false };
    const result = priceValueConsistencyValidator(40, benchmark, 55000);
    expect(result.passed).toBe(true);
  });
});
