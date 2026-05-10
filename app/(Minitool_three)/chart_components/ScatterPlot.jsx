import React, { useState, useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G, Rect } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { scaleLinear } from "d3-scale";
import useStatistics from "./useStatistics";
import useDimensions from "../../hooks/useDimensions";

const ScatterPlot = ({
  data = [],
  width: widthProp,
  height: heightProp,
  showCross = false,
  hideData = false,
  activeGrid = null,
  twoGroupsCount = null,
  fourGroupsCount = null,
  selectedPoint = null,
  onPointSelect,
  onScrollEnabled,
}) => {
  const { width: windowWidth } = useDimensions();
  const containerWidth = widthProp ?? windowWidth;

  // ── Chart geometry constants ──────────────────────────────
  const isCompact = containerWidth < 600;
  const CHART_WIDTH = Math.max(280, containerWidth - (isCompact ? 20 : 40));
  const CHART_HEIGHT = heightProp ?? (isCompact ? 320 : 500);
  const PADDING = isCompact ? 24 : 40;
  // Reserve extra space on the left for the rotated "Y Variable" label
  // and along the bottom for the "X Variable" label so they never overlap
  // the tick numbers.
  const Y_AXIS_LABEL_WIDTH = isCompact ? 18 : 22;
  const X_AXIS_LABEL_HEIGHT = isCompact ? 18 : 22;
  const Y_AXIS_WIDTH = (isCompact ? 40 : 50) + Y_AXIS_LABEL_WIDTH;
  const X_AXIS_HEIGHT = (isCompact ? 32 : 40) + X_AXIS_LABEL_HEIGHT;
  const PLOT_LEFT = Y_AXIS_WIDTH + PADDING;
  const PLOT_RIGHT = CHART_WIDTH - PADDING;
  const PLOT_TOP = PADDING;
  const PLOT_BOTTOM = CHART_HEIGHT - X_AXIS_HEIGHT - PADDING;

  // ── Scales (memoised) ────────────────────────────────────────
  const { xScale, yScale, xDomain, yDomain, xTickValues, yTickValues } =
    useMemo(() => {
      const xVals = data.map((d) => d.x);
      const yVals = data.map((d) => d.y);
      const _minX = Math.min(...xVals);
      const _maxX = Math.max(...xVals);
      const _minY = Math.min(...yVals);
      const _maxY = Math.max(...yVals);
      const xPad = (_maxX - _minX) * 0.1;
      const yPad = (_maxY - _minY) * 0.1;
      const _xDomain = [_minX - xPad, _maxX + xPad];
      const _yDomain = [_minY - yPad, _maxY + yPad];

      const _xScale = scaleLinear()
        .domain(_xDomain)
        .range([PLOT_LEFT, PLOT_RIGHT]);
      const _yScale = scaleLinear()
        .domain(_yDomain)
        .range([PLOT_BOTTOM, PLOT_TOP]);

      const xTicks = 6;
      const yTicks = 6;
      const _xTickValues = Array.from(
        { length: xTicks },
        (_, i) =>
          _xDomain[0] + (i * (_xDomain[1] - _xDomain[0])) / (xTicks - 1),
      );
      const _yTickValues = Array.from(
        { length: yTicks },
        (_, i) =>
          _yDomain[0] + (i * (_yDomain[1] - _yDomain[0])) / (yTicks - 1),
      );

      return {
        xScale: _xScale,
        yScale: _yScale,
        xDomain: _xDomain,
        yDomain: _yDomain,
        xTickValues: _xTickValues,
        yTickValues: _yTickValues,
      };
    }, [data, PLOT_LEFT, PLOT_RIGHT, PLOT_TOP, PLOT_BOTTOM]);

  // ── Cross (draggable) state ───────────────────────────────────
  const midDataX = (xDomain[0] + xDomain[1]) / 2;
  const midDataY = (yDomain[0] + yDomain[1]) / 2;
  const [crossCenter, setCrossCenter] = useState({ x: midDataX, y: midDataY });
  // Keep the cross centred when domain changes (dataset switch)
  const prevDomainRef = useRef(null);
  const domainKey = `${xDomain[0]},${xDomain[1]},${yDomain[0]},${yDomain[1]}`;
  if (prevDomainRef.current !== domainKey) {
    prevDomainRef.current = domainKey;
    // reset to centre of new domain
    crossCenter.x = midDataX;
    crossCenter.y = midDataY;
  }

  const crossStartRef = useRef({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      crossStartRef.current = { ...crossCenter };
      onScrollEnabled?.(false);
    })
    .onUpdate((e) => {
      const dataX =
        crossStartRef.current.x +
        e.translationX / ((PLOT_RIGHT - PLOT_LEFT) / (xDomain[1] - xDomain[0]));
      const dataY =
        crossStartRef.current.y -
        e.translationY / ((PLOT_BOTTOM - PLOT_TOP) / (yDomain[1] - yDomain[0]));
      // Clamp within domain
      const cx = Math.max(xDomain[0], Math.min(xDomain[1], dataX));
      const cy = Math.max(yDomain[0], Math.min(yDomain[1], dataY));
      setCrossCenter({ x: cx, y: cy });
    })
    .onEnd(() => {
      onScrollEnabled?.(true);
    })
    .minDistance(0);

  // ── Statistics hook ───────────────────────────────────────────
  const { gridData, quadrantCounts, twoGroupSlices, fourGroupSlices } =
    useStatistics({
      data,
      activeGrid,
      twoGroupsCount,
      fourGroupsCount,
      crossCenter: showCross ? crossCenter : null,
      xDomain,
      yDomain,
    });

  // ── Tap to select a point ─────────────────────────────────────
  const handlePointTap = useCallback(
    (index) => {
      if (onPointSelect) {
        onPointSelect(selectedPoint === index ? null : index);
      }
    },
    [onPointSelect, selectedPoint],
  );

  // ── SVG layer: grid overlay ───────────────────────────────────
  const renderGridOverlay = () => {
    if (!gridData) return null;
    const { counts, xStep, yStep } = gridData;
    const elements = [];
    const gridSize = counts.length;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x1 = xScale(xDomain[0] + col * xStep);
        const y1 = yScale(yDomain[1] - row * yStep);
        const x2 = xScale(xDomain[0] + (col + 1) * xStep);
        const y2 = yScale(yDomain[1] - (row + 1) * yStep);
        const cellW = x2 - x1;
        const cellH = y2 - y1;

        elements.push(
          <G key={`grid-${row}-${col}`}>
            <Rect
              x={x1}
              y={y1}
              width={cellW}
              height={cellH}
              fill="transparent"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <SvgText
              x={x1 + cellW / 2}
              y={y1 + cellH / 2 + 5}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              fill="#334155"
            >
              {counts[row][col]}
            </SvgText>
          </G>,
        );
      }
    }
    return <G>{elements}</G>;
  };

  // ── SVG layer: cross (quadrant) overlay ───────────────────────
  const renderCrossOverlay = () => {
    if (!showCross) return null;
    const cx = xScale(crossCenter.x);
    const cy = yScale(crossCenter.y);

    const counts = quadrantCounts || [0, 0, 0, 0];

    return (
      <G>
        {/* Vertical line */}
        <Line
          x1={cx}
          y1={PLOT_TOP}
          x2={cx}
          y2={PLOT_BOTTOM}
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        {/* Horizontal line */}
        <Line
          x1={PLOT_LEFT}
          y1={cy}
          x2={PLOT_RIGHT}
          y2={cy}
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        {/* Center handle */}
        <Circle cx={cx} cy={cy} r="8" fill="#dc2626" opacity="0.8" />
        <Circle cx={cx} cy={cy} r="3" fill="#fff" />

        {/* Quadrant counts: TL, TR, BL, BR */}
        <SvgText
          x={PLOT_LEFT + 10}
          y={PLOT_TOP + 18}
          fontSize="14"
          fontWeight="bold"
          fill="#dc2626"
        >
          {counts[0]}
        </SvgText>
        <SvgText
          x={PLOT_RIGHT - 10}
          y={PLOT_TOP + 18}
          fontSize="14"
          fontWeight="bold"
          fill="#dc2626"
          textAnchor="end"
        >
          {counts[1]}
        </SvgText>
        <SvgText
          x={PLOT_LEFT + 10}
          y={PLOT_BOTTOM - 8}
          fontSize="14"
          fontWeight="bold"
          fill="#dc2626"
        >
          {counts[2]}
        </SvgText>
        <SvgText
          x={PLOT_RIGHT - 10}
          y={PLOT_BOTTOM - 8}
          fontSize="14"
          fontWeight="bold"
          fill="#dc2626"
          textAnchor="end"
        >
          {counts[3]}
        </SvgText>
      </G>
    );
  };

  // ── SVG layer: two-group slicing ──────────────────────────────
  const renderTwoGroupsOverlay = () => {
    if (!twoGroupSlices) return null;
    return (
      <G>
        {twoGroupSlices.map((s, i) => {
          const x1 = xScale(s.xLo);
          const x2 = xScale(s.xHi);
          const xMid = (x1 + x2) / 2;

          // Slice boundary
          if (i > 0) {
            return null; // we draw boundaries below
          }
          return null;
        })}
        {/* Slice boundaries */}
        {twoGroupSlices.map((s, i) => (
          <G key={`two-boundary-${i}`}>
            {i > 0 && (
              <Line
                x1={xScale(s.xLo)}
                y1={PLOT_TOP}
                x2={xScale(s.xLo)}
                y2={PLOT_BOTTOM}
                stroke="#7c3aed"
                strokeWidth="1"
                strokeDasharray="4,3"
              />
            )}
          </G>
        ))}
        {/* Stats per slice */}
        {twoGroupSlices.map((s, i) => {
          if (s.count === 0) return null;
          const x1 = xScale(s.xLo);
          const x2 = xScale(s.xHi);
          const xMid = (x1 + x2) / 2;
          const medY = yScale(s.median);
          const lowY = yScale(s.low);
          const highY = yScale(s.high);

          return (
            <G key={`two-stats-${i}`}>
              {/* Median line */}
              <Line
                x1={x1 + 4}
                y1={medY}
                x2={x2 - 4}
                y2={medY}
                stroke="#7c3aed"
                strokeWidth="2.5"
              />
              {/* Low line */}
              <Line
                x1={x1 + 4}
                y1={lowY}
                x2={x2 - 4}
                y2={lowY}
                stroke="#7c3aed"
                strokeWidth="1.5"
              />
              {/* High line */}
              <Line
                x1={x1 + 4}
                y1={highY}
                x2={x2 - 4}
                y2={highY}
                stroke="#7c3aed"
                strokeWidth="1.5"
              />
              {/* Vertical whisker connecting low → high */}
              <Line
                x1={xMid}
                y1={lowY}
                x2={xMid}
                y2={highY}
                stroke="#7c3aed"
                strokeWidth="1"
                strokeDasharray="3,2"
              />
              {/* Labels */}
              <SvgText
                x={xMid}
                y={medY - 5}
                fontSize="9"
                textAnchor="middle"
                fill="#7c3aed"
                fontWeight="bold"
              >
                Med {Math.round(s.median)}
              </SvgText>
            </G>
          );
        })}
      </G>
    );
  };

  // ── SVG layer: four-group slicing (box-whisker) ───────────────
  const renderFourGroupsOverlay = () => {
    if (!fourGroupSlices) return null;
    return (
      <G>
        {/* Slice boundaries */}
        {fourGroupSlices.map((s, i) => (
          <G key={`four-boundary-${i}`}>
            {i > 0 && (
              <Line
                x1={xScale(s.xLo)}
                y1={PLOT_TOP}
                x2={xScale(s.xLo)}
                y2={PLOT_BOTTOM}
                stroke="#0891b2"
                strokeWidth="1"
                strokeDasharray="4,3"
              />
            )}
          </G>
        ))}
        {/* Box-whisker per slice */}
        {fourGroupSlices.map((s, i) => {
          if (s.count === 0) return null;
          const x1 = xScale(s.xLo);
          const x2 = xScale(s.xHi);
          const xMid = (x1 + x2) / 2;
          const boxInset = (x2 - x1) * 0.15;
          const bx1 = x1 + boxInset;
          const bx2 = x2 - boxInset;

          const lowY = yScale(s.low);
          const highY = yScale(s.high);
          const medY = yScale(s.median);
          const q1Y = s.q1 != null ? yScale(s.q1) : medY;
          const q3Y = s.q3 != null ? yScale(s.q3) : medY;

          return (
            <G key={`four-stats-${i}`}>
              {/* Whisker: low → Q1 */}
              <Line
                x1={xMid}
                y1={lowY}
                x2={xMid}
                y2={q1Y}
                stroke="#0891b2"
                strokeWidth="1"
              />
              {/* Whisker: Q3 → high */}
              <Line
                x1={xMid}
                y1={q3Y}
                x2={xMid}
                y2={highY}
                stroke="#0891b2"
                strokeWidth="1"
              />
              {/* Low cap */}
              <Line
                x1={bx1 + boxInset}
                y1={lowY}
                x2={bx2 - boxInset}
                y2={lowY}
                stroke="#0891b2"
                strokeWidth="1.5"
              />
              {/* High cap */}
              <Line
                x1={bx1 + boxInset}
                y1={highY}
                x2={bx2 - boxInset}
                y2={highY}
                stroke="#0891b2"
                strokeWidth="1.5"
              />
              {/* Box Q1 → Q3 */}
              <Rect
                x={bx1}
                y={q3Y}
                width={bx2 - bx1}
                height={q1Y - q3Y}
                fill="rgba(8,145,178,0.12)"
                stroke="#0891b2"
                strokeWidth="1.5"
              />
              {/* Median line inside box */}
              <Line
                x1={bx1}
                y1={medY}
                x2={bx2}
                y2={medY}
                stroke="#0891b2"
                strokeWidth="2.5"
              />
            </G>
          );
        })}
      </G>
    );
  };

  // ── SVG layer: selected-point projection lines ────────────────
  const renderSelectedPointOverlay = () => {
    if (selectedPoint == null || !data[selectedPoint]) return null;
    const pt = data[selectedPoint];
    const cx = xScale(pt.x);
    const cy = yScale(pt.y);

    return (
      <G>
        {/* Vertical projection to X-axis */}
        <Line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={PLOT_BOTTOM}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        {/* Horizontal projection to Y-axis */}
        <Line
          x1={cx}
          y1={cy}
          x2={PLOT_LEFT}
          y2={cy}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        {/* X-axis value highlight */}
        <Rect
          x={cx - 20}
          y={PLOT_BOTTOM + 2}
          width="40"
          height="18"
          rx="3"
          fill="#f59e0b"
        />
        <SvgText
          x={cx}
          y={PLOT_BOTTOM + 15}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fill="#fff"
        >
          {Math.round(pt.x * 10) / 10}
        </SvgText>
        {/* Y-axis value highlight */}
        <Rect
          x={PLOT_LEFT - 50}
          y={cy - 9}
          width="46"
          height="18"
          rx="3"
          fill="#f59e0b"
        />
        <SvgText
          x={PLOT_LEFT - 27}
          y={cy + 4}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fill="#fff"
        >
          {Math.round(pt.y * 10) / 10}
        </SvgText>
        {/* Highlight ring */}
        <Circle
          cx={cx}
          cy={cy}
          r="7"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
        />
      </G>
    );
  };

  // ── Main render ───────────────────────────────────────────────
  const svgContent = (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Background grid lines & Y-axis ticks */}
      {yTickValues.map((tickValue, i) => {
        const y = yScale(tickValue);
        return (
          <G key={`y-tick-${i}`}>
            <Line
              x1={Y_AXIS_WIDTH}
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
            <SvgText
              x={Y_AXIS_WIDTH - 10}
              y={y + 4}
              fontSize="11"
              textAnchor="end"
              fill="#666"
            >
              {Math.round(tickValue)}
            </SvgText>
          </G>
        );
      })}

      {/* X-axis ticks */}
      {xTickValues.map((tickValue, i) => {
        const x = xScale(tickValue);
        return (
          <G key={`x-tick-${i}`}>
            <Line
              x1={x}
              y1={PADDING}
              x2={x}
              y2={CHART_HEIGHT - X_AXIS_HEIGHT}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
            <SvgText
              x={x}
              y={CHART_HEIGHT - X_AXIS_HEIGHT + 20}
              fontSize="11"
              textAnchor="middle"
              fill="#666"
            >
              {Math.round(tickValue)}
            </SvgText>
          </G>
        );
      })}

      {/* Axes */}
      <Line
        x1={Y_AXIS_WIDTH}
        y1={PADDING}
        x2={Y_AXIS_WIDTH}
        y2={CHART_HEIGHT - X_AXIS_HEIGHT}
        stroke="#333"
        strokeWidth="2"
      />
      <Line
        x1={Y_AXIS_WIDTH}
        y1={CHART_HEIGHT - X_AXIS_HEIGHT}
        x2={CHART_WIDTH}
        y2={CHART_HEIGHT - X_AXIS_HEIGHT}
        stroke="#333"
        strokeWidth="2"
      />

      {/* Overlays (behind dots so taps register) */}
      {renderGridOverlay()}
      {renderTwoGroupsOverlay()}
      {renderFourGroupsOverlay()}
      {renderCrossOverlay()}

      {/* Data points */}
      {data.map((point, index) => {
        const cx = xScale(point.x);
        const cy = yScale(point.y);
        return (
          <Circle
            key={`point-${index}`}
            cx={cx}
            cy={cy}
            r={selectedPoint === index ? 6 : 4}
            fill={selectedPoint === index ? "#f59e0b" : "#2563eb"}
            opacity={hideData ? 0 : 0.7}
            onPress={() => handlePointTap(index)}
          />
        );
      })}

      {/* Projection lines for selected point (on top of everything) */}
      {renderSelectedPointOverlay()}

      {/* Axis labels */}
      <SvgText
        x={12}
        y={(PLOT_TOP + PLOT_BOTTOM) / 2}
        fontSize="13"
        textAnchor="middle"
        fill="#333"
        transform={`rotate(-90 12 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
      >
        Y Variable
      </SvgText>
      <SvgText
        x={(PLOT_LEFT + PLOT_RIGHT) / 2}
        y={CHART_HEIGHT - 6}
        fontSize="13"
        textAnchor="middle"
        fill="#333"
      >
        X Variable
      </SvgText>
    </Svg>
  );

  // Wrap in GestureDetector only when cross is active (for dragging)
  if (showCross) {
    return (
      <View
        style={{
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          marginVertical: 10,
        }}
      >
        <GestureDetector gesture={panGesture}>
          <View>{svgContent}</View>
        </GestureDetector>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
      }}
    >
      {svgContent}
    </View>
  );
};

export default ScatterPlot;
