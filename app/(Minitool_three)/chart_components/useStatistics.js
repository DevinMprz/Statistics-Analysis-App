import { useMemo } from "react";

// --- Pure math helpers (no React, no hooks) ---

/** Sort an array of numbers ascending (returns new array). */
const sortAsc = (arr) => [...arr].sort((a, b) => a - b);

/** Median of a *pre-sorted* numeric array. */
const medianSorted = (sorted) => {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Q1 of a *pre-sorted* numeric array (lower quartile – median of lower half). */
const q1Sorted = (sorted) => {
  const mid = Math.floor(sorted.length / 2);
  return medianSorted(sorted.slice(0, mid));
};

/** Q3 of a *pre-sorted* numeric array (upper quartile – median of upper half). */
const q3Sorted = (sorted) => {
  const mid = Math.ceil(sorted.length / 2);
  return medianSorted(sorted.slice(mid));
};

// ---------------------------------------------------------------------------
// Grid overlay – count points per cell
// ---------------------------------------------------------------------------
export const computeGridCounts = (data, gridSize, xDomain, yDomain) => {
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  const xStep = (xMax - xMin) / gridSize;
  const yStep = (yMax - yMin) / gridSize;

  // Initialize gridSize x gridSize matrix
  const counts = Array.from({ length: gridSize }, () =>
    new Array(gridSize).fill(0),
  );

  for (const { x, y } of data) {
    let col = Math.floor((x - xMin) / xStep);
    let row = Math.floor((yMax - y) / yStep); // rows go top→bottom
    // Clamp to valid range (edge values land on last cell)
    col = Math.min(col, gridSize - 1);
    row = Math.min(row, gridSize - 1);
    if (col >= 0 && row >= 0) counts[row][col]++;
  }
  return { counts, xStep, yStep };
};

// ---------------------------------------------------------------------------
// Cross (quadrant) – count points in 4 cells
// ---------------------------------------------------------------------------
export const computeQuadrantCounts = (data, cx, cy) => {
  const q = [0, 0, 0, 0]; // TL, TR, BL, BR
  for (const { x, y } of data) {
    if (x <= cx && y >= cy) q[0]++;
    else if (x > cx && y >= cy) q[1]++;
    else if (x <= cx && y < cy) q[2]++;
    else q[3]++;
  }
  return q;
};

// ---------------------------------------------------------------------------
// Two Equal Groups – vertical slicing with Median / Low / High per slice
// ---------------------------------------------------------------------------
export const computeTwoGroups = (data, sliceCount, xDomain) => {
  const [xMin, xMax] = xDomain;
  const sliceWidth = (xMax - xMin) / sliceCount;
  const slices = [];

  for (let i = 0; i < sliceCount; i++) {
    const lo = xMin + i * sliceWidth;
    const hi = lo + sliceWidth;
    const points = data.filter(
      (d) => d.x >= lo && (i === sliceCount - 1 ? d.x <= hi : d.x < hi),
    );
    const yVals = sortAsc(points.map((d) => d.y));
    slices.push({
      xLo: lo,
      xHi: hi,
      low: yVals.length ? yVals[0] : null,
      high: yVals.length ? yVals[yVals.length - 1] : null,
      median: yVals.length ? medianSorted(yVals) : null,
      count: yVals.length,
    });
  }
  return slices;
};

// ---------------------------------------------------------------------------
// Four Equal Groups – vertical slicing with Low/Q1/Median/Q3/High per slice
// ---------------------------------------------------------------------------
export const computeFourGroups = (data, sliceCount, xDomain) => {
  const [xMin, xMax] = xDomain;
  const sliceWidth = (xMax - xMin) / sliceCount;
  const slices = [];

  for (let i = 0; i < sliceCount; i++) {
    const lo = xMin + i * sliceWidth;
    const hi = lo + sliceWidth;
    const points = data.filter(
      (d) => d.x >= lo && (i === sliceCount - 1 ? d.x <= hi : d.x < hi),
    );
    const yVals = sortAsc(points.map((d) => d.y));
    slices.push({
      xLo: lo,
      xHi: hi,
      low: yVals.length ? yVals[0] : null,
      high: yVals.length ? yVals[yVals.length - 1] : null,
      q1: yVals.length >= 2 ? q1Sorted(yVals) : null,
      median: yVals.length ? medianSorted(yVals) : null,
      q3: yVals.length >= 2 ? q3Sorted(yVals) : null,
      count: yVals.length,
    });
  }
  return slices;
};

// ---------------------------------------------------------------------------
// React hook – memoises expensive calculations
// ---------------------------------------------------------------------------
const useStatistics = ({
  data,
  activeGrid,
  twoGroupsCount,
  fourGroupsCount,
  crossCenter, // { x, y } in DATA coordinates
  xDomain, // [min, max] of padded x-axis
  yDomain, // [min, max] of padded y-axis
}) => {
  const gridData = useMemo(() => {
    if (!activeGrid || !data.length) return null;
    return computeGridCounts(data, activeGrid, xDomain, yDomain);
  }, [data, activeGrid, xDomain, yDomain]);

  const quadrantCounts = useMemo(() => {
    if (!crossCenter || !data.length) return null;
    return computeQuadrantCounts(data, crossCenter.x, crossCenter.y);
  }, [data, crossCenter]);

  const twoGroupSlices = useMemo(() => {
    if (!twoGroupsCount || !data.length) return null;
    return computeTwoGroups(data, twoGroupsCount, xDomain);
  }, [data, twoGroupsCount, xDomain]);

  const fourGroupSlices = useMemo(() => {
    if (!fourGroupsCount || !data.length) return null;
    return computeFourGroups(data, fourGroupsCount, xDomain);
  }, [data, fourGroupsCount, xDomain]);

  return { gridData, quadrantCounts, twoGroupSlices, fourGroupSlices };
};

export default useStatistics;
