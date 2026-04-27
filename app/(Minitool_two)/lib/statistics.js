/**
 * Pure statistical helpers for Minitool 2.
 * No React, no side-effects — fully unit-testable.
 *
 * All functions assume numeric input arrays. Empty inputs return safe defaults
 * so callers don't need to guard.
 */

/** Returns the arithmetic mean of `values`, or 0 for an empty array. */
export const mean = (values) => {
  if (!values || values.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
};

/** Returns the median of an already-sorted ascending array. */
const medianOfSorted = (sorted) => {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/**
 * Computes the five-number summary (min, Q1, median, Q3, max) using the
 * "exclusive" (Tukey) method: the median splits the data, and Q1/Q3 are
 * the medians of the lower/upper halves.
 *
 * @param {number[]} values - unsorted numeric values
 * @returns {{min:number,q1:number,median:number,q3:number,max:number}}
 */
export const quartiles = (values) => {
  if (!values || values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  const lower = sorted.slice(0, mid);
  const upper = n % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return {
    min: sorted[0],
    q1: medianOfSorted(lower),
    median: medianOfSorted(sorted),
    q3: medianOfSorted(upper),
    max: sorted[n - 1],
  };
};

/** Returns a stable ascending-sorted copy of `values`. */
export const sortAscending = (values) => [...values].sort((a, b) => a - b);

/**
 * Computes vertical "stack levels" for a dot plot so overlapping dots are
 * placed at increasing levels above the axis. Runs in O(n log n + n·L)
 * where L is the maximum stack height, which is small in practice.
 *
 * @param {Array<{value:number, type?:string}>} data
 * @param {(v:number)=>number} xScale - maps data value -> pixel x
 * @param {number} dotRadius
 * @returns {Array<{value:number, type?:string, level:number, x:number}>}
 */
export const computeScatterLevels = (data, xScale, dotRadius) => {
  if (!data || data.length === 0) return [];
  const minDistance = dotRadius * 2;

  // Sort by x position (stable).
  const sorted = data
    .map((d) => ({ ...d, x: xScale(d.value) }))
    .sort((a, b) => a.x - b.x);

  // levelLastX[k] = right-most occupied x at level k.
  const levelLastX = [];
  const out = new Array(sorted.length);

  for (let i = 0; i < sorted.length; i++) {
    const dot = sorted[i];
    let level = 0;
    while (
      level < levelLastX.length &&
      dot.x - levelLastX[level] < minDistance
    ) {
      level++;
    }
    levelLastX[level] = dot.x;
    out[i] = { ...dot, level: level + 1 }; // 1-indexed for rendering
  }
  return out;
};

/**
 * Counts how many values fall inside each consecutive (left-closed,
 * right-open) bucket defined by `boundaries` in *data-space*. The final
 * bucket is right-closed so the maximum value is always included.
 *
 * @param {number[]} values
 * @param {number[]} boundaries - ascending domain values including the chart edges
 * @returns {number[]} counts with length boundaries.length - 1
 */
export const bucketCounts = (values, boundaries) => {
  if (boundaries.length < 2) return [];
  const counts = new Array(boundaries.length - 1).fill(0);
  const last = boundaries.length - 2;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    // Linear scan is fine for small boundary counts; switch to bsearch if needed.
    for (let b = 0; b <= last; b++) {
      const lo = boundaries[b];
      const hi = boundaries[b + 1];
      const inside = b === last ? v >= lo && v <= hi : v >= lo && v < hi;
      if (inside) {
        counts[b]++;
        break;
      }
    }
  }
  return counts;
};
