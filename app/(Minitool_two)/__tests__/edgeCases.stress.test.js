/**
 * ============================================================================
 * PART 3A — Edge Case & Stress Tests: Statistical Functions
 * ============================================================================
 *
 * Designed to "break" the statistical logic with:
 *   • Extremely large datasets (1000+ points)
 *   • All-identical values
 *   • Single-element arrays
 *   • Negative / zero / huge numbers
 *   • Floating-point precision edge cases
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Resilience & Stability):
 *   In an educational tool, a crash or NaN displayed on screen would confuse
 *   the student. These tests prove the math functions degrade gracefully.
 * ============================================================================
 */

import { mean, quartiles, computeScatterLevels, bucketCounts } from '../../lib/statistics';
import { generateGuideValues, GROUP_MODES } from '../../lib/grouping';
import { createXScale, generateAxisTicks } from '../../lib/scales';

// ---------------------------------------------------------------------------
// Deterministic random data generator
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function genLargeData(n, min = 0, max = 300, seed = 42) {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () =>
    parseFloat((rng() * (max - min) + min).toFixed(1)),
  );
}

// ===========================  STRESS: Large Datasets  ======================

describe('Stress — large dataset processing', () => {
  const data300 = genLargeData(300);
  const data500 = genLargeData(500);
  const data1000 = genLargeData(1000);

  test('mean() handles 1000 data points without error', () => {
    const result = mean(data1000);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  test('quartiles() on 500 points returns valid five-number summary', () => {
    const q = quartiles(data500);
    expect(q.min).toBeLessThanOrEqual(q.q1);
    expect(q.q1).toBeLessThanOrEqual(q.median);
    expect(q.median).toBeLessThanOrEqual(q.q3);
    expect(q.q3).toBeLessThanOrEqual(q.max);
  });

  test('computeScatterLevels() handles 300 overlapping dots', () => {
    // REASONING: Worst case for stacking — all dots at the same x position.
    const linearScale = (v) => v;
    const data = Array.from({ length: 300 }, (_, i) => ({ value: 50, id: `d${i}` }));
    const result = computeScatterLevels(data, linearScale, 5);
    expect(result).toHaveLength(300);
    // Levels should range from 1 to 300
    const maxLevel = Math.max(...result.map((d) => d.level));
    expect(maxLevel).toBe(300);
  });

  test('bucketCounts() on 1000 values preserves total count', () => {
    const boundaries = [0, 50, 100, 150, 200, 250, 300];
    const counts = bucketCounts(data1000, boundaries);
    const total = counts.reduce((a, b) => a + b, 0);
    expect(total).toBe(1000);
  });

  test('generateGuideValues(QUARTILES) on 300 points returns 3 ordered values', () => {
    const guides = generateGuideValues(GROUP_MODES.QUARTILES, data300);
    expect(guides).toHaveLength(3);
    expect(guides[0]).toBeLessThanOrEqual(guides[1]);
    expect(guides[1]).toBeLessThanOrEqual(guides[2]);
  });

  test('performance: quartiles() on 1000 points completes in < 50ms', () => {
    const start = performance.now();
    quartiles(data1000);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});

// ===========================  EDGE: All-identical values  ==================

describe('Edge — all-identical values', () => {
  const allSame = Array(100).fill(42);

  test('mean of identical values equals the value', () => {
    expect(mean(allSame)).toBe(42);
  });

  test('quartiles of identical values — all five equal', () => {
    const q = quartiles(allSame);
    expect(q.min).toBe(42);
    expect(q.q1).toBe(42);
    expect(q.median).toBe(42);
    expect(q.q3).toBe(42);
    expect(q.max).toBe(42);
  });

  test('bucketCounts — all in one bucket', () => {
    const counts = bucketCounts(allSame, [0, 50, 100]);
    const total = counts.reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  test('MEDIAN grouping returns the common value', () => {
    const [median] = generateGuideValues(GROUP_MODES.MEDIAN, allSame);
    expect(median).toBe(42);
  });
});

// ===========================  EDGE: Single element  ========================

describe('Edge — single element arrays', () => {
  test('mean([99]) = 99', () => {
    expect(mean([99])).toBe(99);
  });

  test('quartiles([99]) — min = median = max = 99', () => {
    const q = quartiles([99]);
    expect(q.min).toBe(99);
    expect(q.median).toBe(99);
    expect(q.max).toBe(99);
  });

  test('bucketCounts with single value and matching boundary', () => {
    const counts = bucketCounts([50], [0, 50, 100]);
    const total = counts.reduce((a, b) => a + b, 0);
    expect(total).toBe(1);
  });
});

// ===========================  EDGE: Extreme values  ========================

describe('Edge — extreme numeric values', () => {
  test('mean handles very large numbers', () => {
    const data = [1e15, 2e15, 3e15];
    expect(mean(data)).toBeCloseTo(2e15, -10);
  });

  test('mean handles very small numbers', () => {
    const data = [1e-15, 2e-15, 3e-15];
    expect(mean(data)).toBeCloseTo(2e-15, 25);
  });

  test('quartiles handles negative-to-positive range', () => {
    const data = [-1000, -500, 0, 500, 1000];
    const q = quartiles(data);
    expect(q.min).toBe(-1000);
    expect(q.median).toBe(0);
    expect(q.max).toBe(1000);
  });

  test('createXScale handles tiny domain (near-zero width)', () => {
    // REASONING: If min ≈ max, the scale shouldn't produce NaN or Infinity.
    const scale = createXScale({ min: 50, max: 50.001 }, [0, 500]);
    const result = scale(50.0005);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });
});

// ===========================  EDGE: Floating-point precision  ==============

describe('Edge — floating-point precision', () => {
  test('mean of 0.1 repeated 10 times ≈ 0.1', () => {
    // REASONING: Classic floating-point trap: 0.1 + 0.1 + ... != 1.0 exactly
    const data = Array(10).fill(0.1);
    expect(mean(data)).toBeCloseTo(0.1, 10);
  });

  test('quartiles handles values differing by tiny epsilon', () => {
    const data = [1.0000001, 1.0000002, 1.0000003, 1.0000004, 1.0000005];
    const q = quartiles(data);
    expect(q.min).toBeLessThan(q.max);
    expect(q.median).toBeCloseTo(1.0000003, 7);
  });

  test('bucketCounts — boundary at exact floating-point value', () => {
    // Values: [0.1, 0.2, 0.3]; boundaries: [0, 0.15, 0.3]
    // Bucket 0: [0, 0.15) → 0.1 = 1; Bucket 1: [0.15, 0.3] → 0.2, 0.3 = 2
    const counts = bucketCounts([0.1, 0.2, 0.3], [0, 0.15, 0.3]);
    expect(counts[0] + counts[1]).toBe(3); // no data loss
  });
});

// ===========================  EDGE: Scale functions  =======================

describe('Edge — scale edge cases', () => {
  test('generateAxisTicks with step = 0 falls back to d3 ticks', () => {
    const scale = createXScale({ min: 0, max: 100 }, [0, 500]);
    const ticks = generateAxisTicks(scale, 0);
    expect(Array.isArray(ticks)).toBe(true);
    // With step 0 / falsy, it falls through to the else branch
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  test('generateAxisTicks with very small step generates many ticks', () => {
    const scale = createXScale({ min: 0, max: 10 }, [0, 500]);
    const ticks = generateAxisTicks(scale, 0.5);
    expect(ticks.length).toBeGreaterThanOrEqual(20);
    // All ticks should be unique and sorted
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    }
  });
});
