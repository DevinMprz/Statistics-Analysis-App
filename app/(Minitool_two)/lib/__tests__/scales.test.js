/**
 * ============================================================================
 * PART 1B — Unit Tests: Scale & Axis Functions
 * ============================================================================
 *
 * Tests the coordinate-mapping functions from scales.js:
 *   • createXScale()      — maps a data domain to a pixel range
 *   • generateAxisTicks()  — produces axis tick marks
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Visual Mapping):
 *   These functions convert raw cholesterol / speed values into pixel
 *   coordinates. If createXScale maps 200 → 150px instead of 250px, the dot
 *   is drawn in the wrong place and the student draws incorrect conclusions.
 * ============================================================================
 */

import { createXScale, generateAxisTicks } from '../scales';

// ===========================  createXScale()  ==============================

describe('createXScale()', () => {
  test('maps domain min to range start and domain max to range end', () => {
    // REASONING: The most fundamental contract — boundary values map exactly.
    const scale = createXScale({ min: 0, max: 100 }, [0, 500]);
    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(500);
  });

  test('maps midpoint correctly (linear interpolation)', () => {
    const scale = createXScale({ min: 0, max: 100 }, [0, 500]);
    expect(scale(50)).toBe(250);
  });

  test('cholesterol range — maps 48 mg/dL to correct pixel', () => {
    // REASONING: Real-world Minitool 2 data. Domain [40, 70], chart width 600px.
    const scale = createXScale({ min: 40, max: 70 }, [0, 600]);
    // 48 is 8/30 of the way through → 8/30 * 600 = 160
    expect(scale(48)).toBeCloseTo(160, 1);
  });

  test('handles negative domain values', () => {
    const scale = createXScale({ min: -50, max: 50 }, [0, 1000]);
    expect(scale(0)).toBe(500);
    expect(scale(-50)).toBe(0);
    expect(scale(50)).toBe(1000);
  });

  test('handles reversed range (right-to-left chart)', () => {
    const scale = createXScale({ min: 0, max: 100 }, [500, 0]);
    expect(scale(0)).toBe(500);
    expect(scale(100)).toBe(0);
    expect(scale(50)).toBe(250);
  });

  test('extrapolation — values outside domain still map linearly', () => {
    // REASONING: d3 scaleLinear does NOT clamp by default, so values
    // outside the domain extrapolate. We verify this behavior.
    const scale = createXScale({ min: 0, max: 100 }, [0, 500]);
    expect(scale(200)).toBe(1000); // extrapolated
    expect(scale(-50)).toBe(-250);
  });
});

// ===========================  generateAxisTicks()  =========================

describe('generateAxisTicks()', () => {
  // Helper: create a scale with known domain for tick generation
  const makeScale = (min, max) => createXScale({ min, max }, [0, 500]);

  test('always includes domain min and max', () => {
    // REASONING: The axis must show at least the endpoints so students
    // can read boundary values.
    const scale = makeScale(40, 70);
    const ticks = generateAxisTicks(scale, 10);
    expect(ticks[0]).toBe(40);
    expect(ticks[ticks.length - 1]).toBe(70);
  });

  test('with step = 10, generates correct intermediate ticks', () => {
    const scale = makeScale(0, 50);
    const ticks = generateAxisTicks(scale, 10);
    expect(ticks).toEqual([0, 10, 20, 30, 40, 50]);
  });

  test('step that does not evenly divide the range still includes endpoints', () => {
    // REASONING: Domain [0, 25] with step 10 → ticks at 0, 10, 20, then 25 appended.
    const scale = makeScale(0, 25);
    const ticks = generateAxisTicks(scale, 10);
    expect(ticks).toContain(0);
    expect(ticks).toContain(25);
    expect(ticks).toContain(10);
    expect(ticks).toContain(20);
  });

  test('no step provided — falls back to d3 auto-ticks', () => {
    const scale = makeScale(0, 100);
    const ticks = generateAxisTicks(scale);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(100);
  });

  test('returns deduplicated sorted ticks', () => {
    // REASONING: If step aligns with min/max, don't double-count them.
    const scale = makeScale(0, 100);
    const ticks = generateAxisTicks(scale, 25);
    const unique = [...new Set(ticks)];
    expect(ticks).toEqual(unique);
    // Also verify sorted
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
    }
  });

  test('handles non-finite domain gracefully', () => {
    // REASONING: If the domain is corrupt (NaN/Infinity), we should not crash.
    const scale = createXScale({ min: NaN, max: NaN }, [0, 500]);
    const ticks = generateAxisTicks(scale, 10);
    expect(Array.isArray(ticks)).toBe(true);
    expect(ticks).toEqual([]); // No valid ticks possible
  });
});
