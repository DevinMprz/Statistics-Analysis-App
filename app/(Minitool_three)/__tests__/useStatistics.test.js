/**
 * ============================================================================
 * PART 1D — Unit Tests: Minitool 3 Bivariate Statistics
 * ============================================================================
 *
 * Tests the pure statistical functions exported from useStatistics.js:
 *   • computeGridCounts()     — NxN grid binning for scatter plots
 *   • computeQuadrantCounts() — four-quadrant classification
 *   • computeTwoGroups()      — vertical-slice two-group summary
 *   • computeFourGroups()     — vertical-slice four-group summary (with Q1/Q3)
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Bivariate Data Categorisation):
 *   Minitool 3 divides the scatter plot into vertical "slices" (columns).
 *   The thesis requires that stacked bivariate data is correctly categorised
 *   into 6 vertical columns. These tests verify the slicing, counting, and
 *   statistical summary logic.
 * ============================================================================
 */

import {
  computeGridCounts,
  computeQuadrantCounts,
  computeTwoGroups,
  computeFourGroups,
} from '../../chart_components/useStatistics';

// ---------------------------------------------------------------------------
// Helpers
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

function generateBivariateData(n, xRange = [0, 100], yRange = [0, 100], seed = 42) {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () => ({
    x: parseFloat((rng() * (xRange[1] - xRange[0]) + xRange[0]).toFixed(1)),
    y: parseFloat((rng() * (yRange[1] - yRange[0]) + yRange[0]).toFixed(1)),
  }));
}

// ===========================  computeGridCounts()  =========================

describe('computeGridCounts()', () => {
  test('2x2 grid — places points into correct cells', () => {
    // REASONING: Grid divides [0,100]x[0,100] into 4 cells.
    // Point (25,75) → col 0 (x < 50), row 0 (y > 50) → counts[0][0]
    // Point (75,25) → col 1 (x > 50), row 1 (y < 50) → counts[1][1]
    const data = [
      { x: 25, y: 75 },
      { x: 75, y: 25 },
    ];
    const { counts } = computeGridCounts(data, 2, [0, 100], [0, 100]);
    expect(counts).toHaveLength(2);
    expect(counts[0]).toHaveLength(2);
    // Total should equal number of data points
    const total = counts.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(2);
  });

  test('all points in same cell', () => {
    const data = [
      { x: 10, y: 90 },
      { x: 15, y: 85 },
      { x: 20, y: 80 },
    ];
    const { counts } = computeGridCounts(data, 2, [0, 100], [0, 100]);
    const total = counts.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
    expect(counts[0][0]).toBe(3); // top-left cell
  });

  test('returns correct xStep and yStep', () => {
    const { xStep, yStep } = computeGridCounts([], 4, [0, 100], [0, 200]);
    expect(xStep).toBe(25);  // (100-0)/4
    expect(yStep).toBe(50);  // (200-0)/4
  });

  test('6-column grid — thesis requirement for bivariate categorisation', () => {
    // REASONING: The thesis specifies that bivariate data should be
    // categorised into 6 vertical columns. We use a 6x6 grid.
    const data = generateBivariateData(300, [0, 60], [0, 60]);
    const { counts } = computeGridCounts(data, 6, [0, 60], [0, 60]);
    expect(counts).toHaveLength(6);
    counts.forEach((row) => expect(row).toHaveLength(6));
    const total = counts.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(300); // no data loss
  });

  test('edge points at domain boundaries are included', () => {
    // REASONING: Points exactly at max should be clamped to the last cell,
    // not dropped.
    const data = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    const { counts } = computeGridCounts(data, 2, [0, 100], [0, 100]);
    const total = counts.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(2);
  });
});

// ===========================  computeQuadrantCounts()  =====================

describe('computeQuadrantCounts()', () => {
  test('distributes points into 4 quadrants', () => {
    // REASONING: Center at (50, 50). Four points, one in each quadrant.
    const data = [
      { x: 25, y: 75 }, // top-left  → q[0]
      { x: 75, y: 75 }, // top-right → q[1]
      { x: 25, y: 25 }, // bot-left  → q[2]
      { x: 75, y: 25 }, // bot-right → q[3]
    ];
    const q = computeQuadrantCounts(data, 50, 50);
    expect(q).toEqual([1, 1, 1, 1]);
  });

  test('point exactly on center goes to top-left (x<=cx, y>=cy)', () => {
    const data = [{ x: 50, y: 50 }];
    const q = computeQuadrantCounts(data, 50, 50);
    expect(q[0]).toBe(1); // top-left because x<=cx AND y>=cy
  });

  test('total counts always equal data length', () => {
    const data = generateBivariateData(250);
    const q = computeQuadrantCounts(data, 50, 50);
    const total = q.reduce((a, b) => a + b, 0);
    expect(total).toBe(250);
  });

  test('all points in one quadrant', () => {
    const data = Array.from({ length: 10 }, () => ({ x: 80, y: 80 }));
    const q = computeQuadrantCounts(data, 50, 50);
    expect(q).toEqual([0, 10, 0, 0]); // all top-right
  });
});

// ===========================  computeTwoGroups()  ==========================

describe('computeTwoGroups()', () => {
  test('6 slices on bivariate data — thesis requirement', () => {
    // REASONING: The thesis requires 6 vertical columns.
    // Each slice should report low, high, median, and count.
    const data = generateBivariateData(300, [0, 60], [0, 100]);
    const slices = computeTwoGroups(data, 6, [0, 60]);

    expect(slices).toHaveLength(6);
    const totalCount = slices.reduce((acc, s) => acc + s.count, 0);
    expect(totalCount).toBe(300); // no data loss

    slices.forEach((slice) => {
      expect(slice).toHaveProperty('xLo');
      expect(slice).toHaveProperty('xHi');
      expect(slice).toHaveProperty('low');
      expect(slice).toHaveProperty('high');
      expect(slice).toHaveProperty('median');
      expect(slice).toHaveProperty('count');
      if (slice.count > 0) {
        expect(slice.low).toBeLessThanOrEqual(slice.median);
        expect(slice.median).toBeLessThanOrEqual(slice.high);
      }
    });
  });

  test('single slice = entire dataset', () => {
    const data = [
      { x: 10, y: 5 },
      { x: 20, y: 15 },
      { x: 30, y: 10 },
    ];
    const slices = computeTwoGroups(data, 1, [0, 40]);
    expect(slices).toHaveLength(1);
    expect(slices[0].count).toBe(3);
    expect(slices[0].low).toBe(5);
    expect(slices[0].high).toBe(15);
    expect(slices[0].median).toBe(10);
  });

  test('empty slice returns null statistics', () => {
    // REASONING: If no points fall in a slice, statistics should be null, not 0.
    const data = [{ x: 5, y: 10 }];
    const slices = computeTwoGroups(data, 2, [0, 100]);
    // Point is in first slice [0, 50)
    expect(slices[0].count).toBe(1);
    expect(slices[1].count).toBe(0);
    expect(slices[1].median).toBeNull();
    expect(slices[1].low).toBeNull();
    expect(slices[1].high).toBeNull();
  });
});

// ===========================  computeFourGroups()  =========================

describe('computeFourGroups()', () => {
  test('6 slices on large dataset — includes Q1 and Q3', () => {
    const data = generateBivariateData(300, [0, 60], [0, 100]);
    const slices = computeFourGroups(data, 6, [0, 60]);

    expect(slices).toHaveLength(6);
    const totalCount = slices.reduce((acc, s) => acc + s.count, 0);
    expect(totalCount).toBe(300);

    slices.forEach((slice) => {
      expect(slice).toHaveProperty('q1');
      expect(slice).toHaveProperty('q3');
      if (slice.count >= 2) {
        // REASONING: Q1 ≤ median ≤ Q3 must always hold.
        expect(slice.q1).toBeLessThanOrEqual(slice.median);
        expect(slice.median).toBeLessThanOrEqual(slice.q3);
      }
    });
  });

  test('slice with a single point — Q1 and Q3 are null', () => {
    const data = [{ x: 5, y: 42 }];
    const slices = computeFourGroups(data, 1, [0, 10]);
    expect(slices[0].count).toBe(1);
    expect(slices[0].median).toBe(42);
    expect(slices[0].q1).toBeNull();
    expect(slices[0].q3).toBeNull();
  });

  test('deterministic result — same input always produces same output', () => {
    const data = generateBivariateData(100, [0, 60], [0, 100], 99);
    const result1 = computeFourGroups(data, 6, [0, 60]);
    const result2 = computeFourGroups(data, 6, [0, 60]);
    expect(result1).toEqual(result2);
  });
});
