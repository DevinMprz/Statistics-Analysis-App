/**
 * ============================================================================
 * PART 1E — Unit Tests: Data Generation & Combined Extent
 * ============================================================================
 *
 * Tests the pure data-generation helpers from data/_data.js:
 *   • generateCholesterolData() — random cholesterol dataset generator
 *   • generateSpeedTrapData()   — random speed-trap dataset generator
 *   • calculateCombinedExtent() — computes min/max across multiple datasets
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Data Integrity):
 *   These generators create the initial datasets that flow through the entire
 *   pipeline: generation → statistics → coordinate mapping → rendering.
 *   If generateCholesterolData produces values outside [minVal, maxVal], every
 *   downstream calculation and visualisation will be wrong.
 * ============================================================================
 */

import {
  generateCholesterolData,
  generateSpeedTrapData,
  calculateCombinedExtent,
  dataBefore,
  dataAfter,
} from '../../data/_data';

// ===========================  generateCholesterolData()  ===================

describe('generateCholesterolData()', () => {
  test('generates the requested number of data points', () => {
    const data = generateCholesterolData(100, 40, 70);
    expect(data).toHaveLength(100);
  });

  test('all values are within [minVal, maxVal]', () => {
    const data = generateCholesterolData(300, 40, 70);
    data.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(40);
      expect(v).toBeLessThanOrEqual(70);
    });
  });

  test('values are rounded to 1 decimal place', () => {
    const data = generateCholesterolData(50, 40, 70);
    data.forEach((v) => {
      const decimals = v.toString().split('.')[1];
      expect(!decimals || decimals.length <= 1).toBe(true);
    });
  });

  test('returns empty array for count = 0', () => {
    expect(generateCholesterolData(0, 40, 70)).toEqual([]);
  });

  test('returns empty array for negative count', () => {
    expect(generateCholesterolData(-5, 40, 70)).toEqual([]);
  });

  test('returns empty array when minVal >= maxVal', () => {
    expect(generateCholesterolData(10, 70, 40)).toEqual([]);
    expect(generateCholesterolData(10, 50, 50)).toEqual([]);
  });

  test('returns empty array for non-numeric parameters', () => {
    expect(generateCholesterolData('abc', 40, 70)).toEqual([]);
    expect(generateCholesterolData(10, 'low', 'high')).toEqual([]);
  });

  test('large dataset (300 points) — no data loss', () => {
    // REASONING: Thesis requirement — 250-300 point datasets must be
    // generated without losing any points.
    const data = generateCholesterolData(300, 40, 70);
    expect(data).toHaveLength(300);
    expect(data.every((v) => typeof v === 'number' && !isNaN(v))).toBe(true);
  });
});

// ===========================  generateSpeedTrapData()  =====================

describe('generateSpeedTrapData()', () => {
  test('generates correct count with values in range', () => {
    const data = generateSpeedTrapData(200, 20, 50);
    expect(data).toHaveLength(200);
    data.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(50);
    });
  });

  test('returns empty array for invalid parameters', () => {
    expect(generateSpeedTrapData(0, 20, 50)).toEqual([]);
    expect(generateSpeedTrapData(-1, 20, 50)).toEqual([]);
    expect(generateSpeedTrapData(10, 50, 20)).toEqual([]);
  });
});

// ===========================  calculateCombinedExtent()  ===================

describe('calculateCombinedExtent()', () => {
  test('finds min and max across multiple datasets', () => {
    const result = calculateCombinedExtent([[10, 20, 30], [5, 25], [15, 35]]);
    expect(result).toEqual({ min: 5, max: 35 });
  });

  test('single dataset', () => {
    const result = calculateCombinedExtent([[48, 52, 56, 60]]);
    expect(result).toEqual({ min: 48, max: 60 });
  });

  test('datasets with negative values', () => {
    const result = calculateCombinedExtent([[-10, 0, 10], [-20, 20]]);
    expect(result).toEqual({ min: -20, max: 20 });
  });

  test('empty datasets return default {min: 0, max: 100}', () => {
    expect(calculateCombinedExtent([[]])).toEqual({ min: 0, max: 100 });
    expect(calculateCombinedExtent([])).toEqual({ min: 0, max: 100 });
  });

  test('mixes of empty and non-empty datasets', () => {
    const result = calculateCombinedExtent([[], [10, 20], []]);
    expect(result).toEqual({ min: 10, max: 20 });
  });

  test('works on actual dataBefore and dataAfter arrays', () => {
    // REASONING: Verify the function works on the real cholesterol data
    // embedded in the application.
    const result = calculateCombinedExtent([dataBefore, dataAfter]);
    expect(result.min).toBe(48.0);
    expect(result.max).toBe(63.8);
  });
});
