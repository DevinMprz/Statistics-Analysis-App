/**
 * ============================================================================
 * PART 1A — Unit Tests: Minitool 2 Statistical Functions
 * ============================================================================
 *
 * Tests the pure mathematical functions exported from statistics.js:
 *   • mean()              — arithmetic mean
 *   • quartiles()         — five-number summary (min, Q1, median, Q3, max)
 *   • sortAscending()     — stable ascending sort
 *   • computeScatterLevels() — dot-plot stacking algorithm
 *   • bucketCounts()      — histogram binning
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Mathematical Accuracy):
 *   The Minitools visualise real statistical data for educational purposes.
 *   An off-by-one error in the median or quartile calculation would directly
 *   mislead the learner, so every boundary condition is covered here.
 * ============================================================================
 */

import {
  mean,
  quartiles,
  sortAscending,
  computeScatterLevels,
  bucketCounts,
} from '../statistics';

// ---------------------------------------------------------------------------
// Helper: generate an array of n sequential numbers starting at `start`
// ---------------------------------------------------------------------------
const seq = (n, start = 1) => Array.from({ length: n }, (_, i) => start + i);

// ---------------------------------------------------------------------------
// Helper: generate a large pseudo-random dataset (deterministic via seed)
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  // Simple xorshift32 — deterministic, fast, good enough for test data
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function generateLargeDataset(n, min = 0, max = 300, seed = 42) {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () =>
    parseFloat((rng() * (max - min) + min).toFixed(1)),
  );
}

// ===========================  mean()  ======================================

describe('mean()', () => {
  test('returns 0 for an empty array', () => {
    expect(mean([])).toBe(0);
  });

  test('returns 0 for null / undefined input', () => {
    expect(mean(null)).toBe(0);
    expect(mean(undefined)).toBe(0);
  });

  test('single element — mean equals the element', () => {
    expect(mean([7])).toBe(7);
  });

  test('two symmetric elements', () => {
    expect(mean([10, 20])).toBe(15);
  });

  test('known dataset — cholesterol-like values', () => {
    const data = [48.0, 50.0, 52.0, 54.0, 56.0];
    expect(mean(data)).toBeCloseTo(52.0, 5);
  });

  test('handles negative values', () => {
    expect(mean([-10, 0, 10])).toBeCloseTo(0, 5);
  });

  test('precision with many decimal places', () => {
    // Ensures floating-point accumulation doesn't drift significantly
    const data = Array(100).fill(0.1);
    expect(mean(data)).toBeCloseTo(0.1, 10);
  });

  test('large dataset (300 points) — mean stays within expected range', () => {
    // REASONING: The thesis specifies datasets of 250-300 points.
    // We verify the mean is within the expected statistical range.
    const data = generateLargeDataset(300, 100, 200);
    const result = mean(data);
    // For uniform distribution over [100, 200], expected mean ≈ 150
    expect(result).toBeGreaterThan(100);
    expect(result).toBeLessThan(200);
  });
});

// ===========================  quartiles()  =================================

describe('quartiles()', () => {
  test('returns zeros for empty array', () => {
    const q = quartiles([]);
    expect(q).toEqual({ min: 0, q1: 0, median: 0, q3: 0, max: 0 });
  });

  test('returns zeros for null / undefined', () => {
    expect(quartiles(null)).toEqual({ min: 0, q1: 0, median: 0, q3: 0, max: 0 });
    expect(quartiles(undefined)).toEqual({ min: 0, q1: 0, median: 0, q3: 0, max: 0 });
  });

  test('single element — all values equal that element', () => {
    const q = quartiles([42]);
    expect(q.min).toBe(42);
    expect(q.median).toBe(42);
    expect(q.max).toBe(42);
  });

  test('two elements', () => {
    const q = quartiles([10, 20]);
    expect(q.min).toBe(10);
    expect(q.median).toBe(15); // average of the two
    expect(q.max).toBe(20);
  });

  test('odd count — textbook example [1..7]', () => {
    // REASONING: With 7 values [1,2,3,4,5,6,7]:
    //   median = 4 (middle), lower = [1,2,3] → Q1 = 2, upper = [5,6,7] → Q3 = 6
    const q = quartiles([1, 2, 3, 4, 5, 6, 7]);
    expect(q.min).toBe(1);
    expect(q.q1).toBe(2);
    expect(q.median).toBe(4);
    expect(q.q3).toBe(6);
    expect(q.max).toBe(7);
  });

  test('even count — textbook example [1..8]', () => {
    // REASONING: With 8 values [1,2,3,4,5,6,7,8]:
    //   median = (4+5)/2 = 4.5, lower = [1,2,3,4] → Q1 = (2+3)/2 = 2.5,
    //   upper = [5,6,7,8] → Q3 = (6+7)/2 = 6.5
    const q = quartiles([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(q.min).toBe(1);
    expect(q.q1).toBe(2.5);
    expect(q.median).toBe(4.5);
    expect(q.q3).toBe(6.5);
    expect(q.max).toBe(8);
  });

  test('unsorted input — should sort internally', () => {
    const q = quartiles([7, 1, 5, 3, 6, 2, 4]);
    expect(q.min).toBe(1);
    expect(q.median).toBe(4);
    expect(q.max).toBe(7);
  });

  test('duplicate values', () => {
    const q = quartiles([5, 5, 5, 5, 5]);
    expect(q.min).toBe(5);
    expect(q.q1).toBe(5);
    expect(q.median).toBe(5);
    expect(q.q3).toBe(5);
    expect(q.max).toBe(5);
  });

  test('negative values', () => {
    const q = quartiles([-10, -5, 0, 5, 10]);
    expect(q.min).toBe(-10);
    expect(q.median).toBe(0);
    expect(q.max).toBe(10);
  });

  test('invariant: Q1 ≤ median ≤ Q3 for any dataset', () => {
    // REASONING: For ANY valid dataset this ordering must hold.
    // We verify it on a large random dataset.
    const data = generateLargeDataset(300);
    const q = quartiles(data);
    expect(q.min).toBeLessThanOrEqual(q.q1);
    expect(q.q1).toBeLessThanOrEqual(q.median);
    expect(q.median).toBeLessThanOrEqual(q.q3);
    expect(q.q3).toBeLessThanOrEqual(q.max);
  });

  test('does not mutate the original array', () => {
    const original = [5, 3, 1, 4, 2];
    const copy = [...original];
    quartiles(original);
    expect(original).toEqual(copy);
  });

  test('250-point dataset — statistical markers are numerically stable', () => {
    // REASONING: Thesis requirement — verify correctness at 250-300 data points
    const data = generateLargeDataset(250, 40, 70); // cholesterol-like range
    const q = quartiles(data);

    // Basic sanity: all five numbers should be within the data range
    expect(q.min).toBeGreaterThanOrEqual(40);
    expect(q.max).toBeLessThanOrEqual(70);
    expect(q.q1).toBeGreaterThanOrEqual(q.min);
    expect(q.q3).toBeLessThanOrEqual(q.max);

    // Median should be roughly in the middle of the range for uniform data
    expect(q.median).toBeGreaterThan(45);
    expect(q.median).toBeLessThan(65);
  });
});

// ===========================  sortAscending()  =============================

describe('sortAscending()', () => {
  test('returns sorted copy', () => {
    expect(sortAscending([3, 1, 2])).toEqual([1, 2, 3]);
  });

  test('does not mutate the original', () => {
    const arr = [3, 1, 2];
    sortAscending(arr);
    expect(arr).toEqual([3, 1, 2]);
  });

  test('already sorted array stays the same', () => {
    expect(sortAscending([1, 2, 3])).toEqual([1, 2, 3]);
  });

  test('handles negative numbers', () => {
    expect(sortAscending([0, -5, 3, -2])).toEqual([-5, -2, 0, 3]);
  });

  test('handles decimals correctly', () => {
    expect(sortAscending([1.5, 1.2, 1.8])).toEqual([1.2, 1.5, 1.8]);
  });
});

// ===========================  computeScatterLevels()  ======================

describe('computeScatterLevels()', () => {
  // A simple linear xScale for testing: value → pixel position
  const linearScale = (v) => v * 10;

  test('returns empty array for empty data', () => {
    expect(computeScatterLevels([], linearScale, 5)).toEqual([]);
  });

  test('returns empty array for null data', () => {
    expect(computeScatterLevels(null, linearScale, 5)).toEqual([]);
  });

  test('single dot gets level 1', () => {
    const data = [{ value: 10, id: 'a' }];
    const result = computeScatterLevels(data, linearScale, 5);
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe(1);
  });

  test('non-overlapping dots all get level 1', () => {
    // REASONING: If dots are far enough apart (distance > 2 * dotRadius),
    // they should all sit at level 1 (no stacking needed).
    const data = [
      { value: 10, id: 'a' },
      { value: 20, id: 'b' },
      { value: 30, id: 'c' },
    ];
    const dotRadius = 5; // minDistance = 10, but pixel gap = 100 → no overlap
    const result = computeScatterLevels(data, linearScale, dotRadius);
    expect(result.every((d) => d.level === 1)).toBe(true);
  });

  test('overlapping dots stack to higher levels', () => {
    // REASONING: Dots at values 1 and 2 → pixel positions 10 and 20.
    // With dotRadius = 10 (minDistance = 20), they overlap → second dot goes to level 2.
    const data = [
      { value: 1, id: 'a' },
      { value: 2, id: 'b' },
    ];
    const dotRadius = 10;
    const result = computeScatterLevels(data, linearScale, dotRadius);
    const levels = result.map((d) => d.level).sort();
    expect(levels).toEqual([1, 2]);
  });

  test('many identical values create a vertical stack', () => {
    // REASONING: All dots at the same position must stack: levels 1, 2, 3, 4, 5
    const data = Array.from({ length: 5 }, (_, i) => ({ value: 50, id: `d${i}` }));
    const result = computeScatterLevels(data, linearScale, 5);
    const levels = result.map((d) => d.level).sort((a, b) => a - b);
    expect(levels).toEqual([1, 2, 3, 4, 5]);
  });

  test('preserves original data properties', () => {
    const data = [{ value: 10, id: 'test', extra: 'hello' }];
    const result = computeScatterLevels(data, linearScale, 5);
    expect(result[0].id).toBe('test');
    expect(result[0].extra).toBe('hello');
    expect(result[0]).toHaveProperty('x');
    expect(result[0]).toHaveProperty('level');
  });
});

// ===========================  bucketCounts()  ==============================

describe('bucketCounts()', () => {
  test('returns empty array when boundaries have fewer than 2 elements', () => {
    expect(bucketCounts([1, 2, 3], [10])).toEqual([]);
    expect(bucketCounts([1, 2, 3], [])).toEqual([]);
  });

  test('single bucket — all values inside', () => {
    // REASONING: boundaries [0, 100] creates one bucket [0, 100].
    // All values 1-10 fall inside.
    expect(bucketCounts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [0, 100])).toEqual([10]);
  });

  test('values distributed across multiple buckets', () => {
    // Boundaries: [0, 10, 20, 30] → 3 buckets: [0,10), [10,20), [20,30]
    const values = [5, 15, 25, 0, 10, 20, 30];
    const counts = bucketCounts(values, [0, 10, 20, 30]);
    // [0,10) → 5, 0 = 2;  [10,20) → 15, 10 = 2;  [20,30] → 25, 20, 30 = 3
    expect(counts).toEqual([2, 2, 3]);
  });

  test('values at exact boundary positions', () => {
    // REASONING: Tests the inclusive/exclusive boundary behavior.
    // Non-last buckets are [lo, hi), last bucket is [lo, hi].
    const counts = bucketCounts([0, 10, 20], [0, 10, 20]);
    // [0,10) → 0 = 1;  [10,20] → 10, 20 = 2
    expect(counts).toEqual([1, 2]);
  });

  test('values outside all boundaries are not counted', () => {
    const counts = bucketCounts([-5, 100], [0, 10, 20]);
    expect(counts).toEqual([0, 0]);
  });

  test('large dataset (300 values) — total counts equal input length', () => {
    // REASONING: No data point should be lost during bucketing
    const data = generateLargeDataset(300, 0, 100);
    const boundaries = [0, 25, 50, 75, 100];
    const counts = bucketCounts(data, boundaries);
    const total = counts.reduce((a, b) => a + b, 0);
    expect(total).toBe(300);
  });
});
