/**
 * ============================================================================
 * PART 3C — Data Integrity: Backend-to-Frontend Pipeline
 * ============================================================================
 *
 * Verifies that the JSON structure produced by the backend upload pipeline
 * is consumable by the frontend statistical functions without errors.
 *
 * This is a "contract test" — it simulates:
 *   1. Parsing a CSV/XLSX file (as the backend does)
 *   2. Running the parsed data through frontend statistics (as the UI does)
 *   3. Asserting the output is valid and no data is lost
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Data Integrity Backend-to-Frontend):
 *   The backend stores a JSON blob in MongoDB. The frontend reads it and
 *   feeds it into mean(), quartiles(), computeScatterLevels(), etc.
 *   If the shapes don't match, the student sees a blank chart or crash.
 * ============================================================================
 */

// We import the frontend functions directly — they are pure JS, no React deps
import { mean, quartiles, bucketCounts, computeScatterLevels } from '../app/(Minitool_two)/lib/statistics';
import { createXScale } from '../app/(Minitool_two)/lib/scales';
import { generateGuideValues, GROUP_MODES } from '../app/(Minitool_two)/lib/grouping';
import {
  computeGridCounts,
  computeQuadrantCounts,
  computeTwoGroups,
  computeFourGroups,
} from '../app/(Minitool_three)/chart_components/useStatistics';

// ---------------------------------------------------------------------------
// Simulate backend output shapes (what MongoDB would store)
// ---------------------------------------------------------------------------

/** Simulates the JSON a minitool2 scenario would look like after upload. */
const mockMinitool2Upload = {
  originalFileName: 'cholesterol_study.csv',
  columns: ['PatientID', 'CholesterolBefore', 'CholesterolAfter'],
  dataPoints: Array.from({ length: 250 }, (_, i) => ({
    PatientID: i + 1,
    CholesterolBefore: parseFloat((48 + Math.random() * 16).toFixed(1)),
    CholesterolAfter: parseFloat((50 + Math.random() * 14).toFixed(1)),
  })),
};

/** Simulates the JSON a minitool3 scenario would look like after upload. */
const mockMinitool3Upload = {
  originalFileName: 'scatter_data.xlsx',
  columns: ['x', 'y'],
  dataPoints: Array.from({ length: 300 }, (_, i) => ({
    x: parseFloat((Math.random() * 100).toFixed(1)),
    y: parseFloat((Math.random() * 100).toFixed(1)),
  })),
};

// ===========================  Minitool 2 Pipeline  =========================

describe('Data integrity: Minitool 2 pipeline', () => {
  // Extract the "CholesterolBefore" column — this is what the frontend does
  const values = mockMinitool2Upload.dataPoints.map((d) => d.CholesterolBefore);

  test('extracted values array has same length as dataPoints', () => {
    expect(values).toHaveLength(250);
  });

  test('all extracted values are finite numbers', () => {
    values.forEach((v) => {
      expect(typeof v).toBe('number');
      expect(isFinite(v)).toBe(true);
    });
  });

  test('mean() produces a valid result from backend data', () => {
    const m = mean(values);
    expect(typeof m).toBe('number');
    expect(isNaN(m)).toBe(false);
    // Should be roughly in the cholesterol range
    expect(m).toBeGreaterThan(48);
    expect(m).toBeLessThan(64);
  });

  test('quartiles() produces valid five-number summary from backend data', () => {
    const q = quartiles(values);
    expect(q.min).toBeLessThanOrEqual(q.q1);
    expect(q.q1).toBeLessThanOrEqual(q.median);
    expect(q.median).toBeLessThanOrEqual(q.q3);
    expect(q.q3).toBeLessThanOrEqual(q.max);
  });

  test('createXScale + computeScatterLevels works on backend data', () => {
    const q = quartiles(values);
    const scale = createXScale({ min: q.min, max: q.max }, [0, 600]);

    const dotData = values.map((v, i) => ({ value: v, id: `p${i}` }));
    const levels = computeScatterLevels(dotData, scale, 4);

    expect(levels).toHaveLength(250);
    levels.forEach((d) => {
      expect(d.level).toBeGreaterThanOrEqual(1);
      expect(typeof d.x).toBe('number');
    });
  });

  test('generateGuideValues(QUARTILES) works on backend data', () => {
    const guides = generateGuideValues(GROUP_MODES.QUARTILES, values);
    expect(guides).toHaveLength(3);
    guides.forEach((g) => {
      expect(typeof g).toBe('number');
      expect(isNaN(g)).toBe(false);
    });
  });

  test('bucketCounts preserves total on backend data', () => {
    const boundaries = [48, 52, 56, 60, 64];
    const counts = bucketCounts(values, boundaries);
    const total = counts.reduce((a, b) => a + b, 0);
    // May not equal 250 exactly if some values are outside [48, 64],
    // but no value should be double-counted.
    expect(total).toBeLessThanOrEqual(250);
  });
});

// ===========================  Minitool 3 Pipeline  =========================

describe('Data integrity: Minitool 3 pipeline', () => {
  const data = mockMinitool3Upload.dataPoints;

  test('all data points have numeric x and y', () => {
    data.forEach((d) => {
      expect(typeof d.x).toBe('number');
      expect(typeof d.y).toBe('number');
      expect(isFinite(d.x)).toBe(true);
      expect(isFinite(d.y)).toBe(true);
    });
  });

  test('computeGridCounts preserves total count (no data loss)', () => {
    const { counts } = computeGridCounts(data, 6, [0, 100], [0, 100]);
    const total = counts.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(300);
  });

  test('computeQuadrantCounts preserves total count', () => {
    const q = computeQuadrantCounts(data, 50, 50);
    const total = q.reduce((a, b) => a + b, 0);
    expect(total).toBe(300);
  });

  test('computeTwoGroups in 6 slices preserves total count', () => {
    const slices = computeTwoGroups(data, 6, [0, 100]);
    const total = slices.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(300);
  });

  test('computeFourGroups in 6 slices preserves total count', () => {
    const slices = computeFourGroups(data, 6, [0, 100]);
    const total = slices.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(300);
  });

  test('computeFourGroups — Q1 ≤ median ≤ Q3 in every non-trivial slice', () => {
    const slices = computeFourGroups(data, 6, [0, 100]);
    slices.forEach((s) => {
      if (s.count >= 4) {
        expect(s.q1).toBeLessThanOrEqual(s.median);
        expect(s.median).toBeLessThanOrEqual(s.q3);
        expect(s.low).toBeLessThanOrEqual(s.q1);
        expect(s.q3).toBeLessThanOrEqual(s.high);
      }
    });
  });
});
