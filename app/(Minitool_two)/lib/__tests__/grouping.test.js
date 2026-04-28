/**
 * ============================================================================
 * PART 1C — Unit Tests: Grouping Logic
 * ============================================================================
 *
 * Tests generateGuideValues() from grouping.js — the function that computes
 * vertical guide-line positions for the dot-plot based on the selected
 * grouping mode (median split, quartile split, fixed interval, etc.).
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Mathematical Accuracy):
 *   When a student selects "Two equal groups", the guide line MUST be placed
 *   at the exact median. A wrong placement means the groups are unequal and
 *   the educational exercise fails.
 * ============================================================================
 */

import { generateGuideValues, GROUP_MODES } from '../grouping';

// ---------------------------------------------------------------------------
// Helper: deterministic large dataset
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

function generateDataset(n, min = 0, max = 100, seed = 42) {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () =>
    parseFloat((rng() * (max - min) + min).toFixed(1)),
  );
}

// ===========================  NONE / CUSTOM  ===============================

describe('GROUP_MODES.NONE and CUSTOM', () => {
  test('NONE always returns empty array', () => {
    expect(generateGuideValues(GROUP_MODES.NONE, [1, 2, 3])).toEqual([]);
  });

  test('CUSTOM always returns empty array', () => {
    expect(generateGuideValues(GROUP_MODES.CUSTOM, [1, 2, 3])).toEqual([]);
  });

  test('any mode with empty values returns empty', () => {
    expect(generateGuideValues(GROUP_MODES.MEDIAN, [])).toEqual([]);
    expect(generateGuideValues(GROUP_MODES.QUARTILES, null)).toEqual([]);
  });
});

// ===========================  MEDIAN  ======================================

describe('GROUP_MODES.MEDIAN', () => {
  test('returns single value (the median)', () => {
    // REASONING: "Two equal groups" → one dividing line at the median.
    const result = generateGuideValues(GROUP_MODES.MEDIAN, [1, 2, 3, 4, 5]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(3); // median of [1,2,3,4,5]
  });

  test('even number of elements — median is average of middle two', () => {
    const result = generateGuideValues(GROUP_MODES.MEDIAN, [10, 20, 30, 40]);
    expect(result[0]).toBe(25); // (20+30)/2
  });

  test('large dataset (300 points) — median is within data range', () => {
    const data = generateDataset(300, 40, 70);
    const [median] = generateGuideValues(GROUP_MODES.MEDIAN, data);
    expect(median).toBeGreaterThanOrEqual(40);
    expect(median).toBeLessThanOrEqual(70);
  });
});

// ===========================  QUARTILES  ===================================

describe('GROUP_MODES.QUARTILES', () => {
  test('returns three values: Q1, median, Q3', () => {
    const result = generateGuideValues(GROUP_MODES.QUARTILES, [1, 2, 3, 4, 5, 6, 7]);
    expect(result).toHaveLength(3);
    // For [1,2,3,4,5,6,7]: Q1=2, median=4, Q3=6
    expect(result).toEqual([2, 4, 6]);
  });

  test('values are in ascending order', () => {
    const data = generateDataset(100);
    const result = generateGuideValues(GROUP_MODES.QUARTILES, data);
    expect(result[0]).toBeLessThanOrEqual(result[1]);
    expect(result[1]).toBeLessThanOrEqual(result[2]);
  });
});

// ===========================  FIXED_INTERVAL  ==============================

describe('GROUP_MODES.FIXED_INTERVAL', () => {
  test('generates lines at regular intervals', () => {
    // REASONING: Values in [0, 100] with interval 25 → lines at 25, 50, 75
    const values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = generateGuideValues(GROUP_MODES.FIXED_INTERVAL, values, {
      intervalWidth: 25,
    });
    expect(result).toEqual([25, 50, 75]);
  });

  test('returns empty when intervalWidth is 0 or negative', () => {
    expect(
      generateGuideValues(GROUP_MODES.FIXED_INTERVAL, [1, 2, 3], { intervalWidth: 0 }),
    ).toEqual([]);
    expect(
      generateGuideValues(GROUP_MODES.FIXED_INTERVAL, [1, 2, 3], { intervalWidth: -5 }),
    ).toEqual([]);
  });

  test('interval wider than data range — returns empty', () => {
    // REASONING: Data in [10, 20], interval = 100 → no line fits between.
    const result = generateGuideValues(GROUP_MODES.FIXED_INTERVAL, [10, 20], {
      intervalWidth: 100,
    });
    expect(result).toEqual([]);
  });
});

// ===========================  FIXED_GROUP_SIZE  ============================

describe('GROUP_MODES.FIXED_GROUP_SIZE', () => {
  test('groups of 2 on 6 elements → 2 dividers', () => {
    // REASONING: Sorted [1,2,3,4,5,6], groups of 2 → lines between (2,3) and (4,5)
    const result = generateGuideValues(GROUP_MODES.FIXED_GROUP_SIZE, [6, 1, 4, 3, 2, 5], {
      fixedGroupSize: 2,
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(2.5); // midpoint of 2 and 3
    expect(result[1]).toBe(4.5); // midpoint of 4 and 5
  });

  test('group size larger than data — returns empty', () => {
    const result = generateGuideValues(GROUP_MODES.FIXED_GROUP_SIZE, [1, 2, 3], {
      fixedGroupSize: 10,
    });
    expect(result).toEqual([]);
  });

  test('returns empty when fixedGroupSize is 0', () => {
    expect(
      generateGuideValues(GROUP_MODES.FIXED_GROUP_SIZE, [1, 2, 3], { fixedGroupSize: 0 }),
    ).toEqual([]);
  });
});
