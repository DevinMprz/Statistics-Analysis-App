import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from "react-native-gesture-handler";

// Default settings with toggle options
const defaultSettings = {
  width: 300,
  height: 100,
  data: null,
  dotRadius: 4,
  dotColor: "blue",
  thresholdColor: "red",
  axisColor: "black",
  margins: { top: 20, bottom: 30, left: 40, right: 20 },
  enablePopup: false, // Toggle for dot value popup
  enableThreshold: true, // Toggle for movable threshold line
};

// Temporary test dataset embedded directly
const testData = [
  100, 100, 100, 100, 103, 105, 105, 110, 110, 90, 95, 115, 120, 150, 150, 150,
  150, 150, 155, 155, 80, 85, 160, 165, 170, 130, 130, 130, 130, 130, 130, 50,
  50, 300, 300,
];

// Improved collision-avoiding scatter data computation
const computeScatterData = (data, xScale, dotRadius) => {
  if (!data || !data.length) return [];

  // First get the stacked duplicates
  const counts = {};
  const basicScatter = data.map((value) => {
    counts[value] = (counts[value] || 0) + 1;
    return { value, index: counts[value] };
  });

  // Sort by x-position for collision detection
  const sortedDots = [...basicScatter].sort((a, b) => a.value - b.value);

  // Calculate minimum distance between dots to avoid collision
  const minDistance = dotRadius * 2;

  // Calculate adjusted levels to avoid collisions
  const adjustedDots = [];

  sortedDots.forEach((dot) => {
    const dotX = xScale(dot.value);
    let level = dot.index; // Start with the original stacking level

    // Check for collisions with previously positioned dots
    let collision = true;
    while (collision) {
      collision = false;

      // Check against all previously positioned dots
      for (let j = 0; j < adjustedDots.length; j++) {
        const placedDot = adjustedDots[j];
        const placedX = xScale(placedDot.value);

        // Check if the x distance is less than minimum required
        const xDistance = Math.abs(dotX - placedX);

        // If dots are too close horizontally and at the same level
        if (xDistance < minDistance && level === placedDot.level) {
          // Move this dot up one level
          level++;
          collision = true;
          break;
        }
      }
    }

    // Add the dot with its adjusted level
    adjustedDots.push({
      value: dot.value,
      index: dot.index,
      level: level,
    });
  });

  return adjustedDots;
};

function Minitool_2_chart(settings) {
  console.log("Received settings:", settings);
  // Merge provided settings with defaults
  const config = { ...defaultSettings, ...settings };
  const {
    width,
    height,
    data,
    dotRadius,
    dotColor,
    thresholdColor,
    axisColor,
    margins,
    enablePopup,
    enableThreshold,
  } = config;

  // Use provided data or fallback to test data
  const chartData = data || testData;

  // Dimensions
  const svgWidth = width;
  const chartHeight = height;
  const innerWidth = svgWidth - margins.left - margins.right;
  const baseline = chartHeight - margins.bottom;

  // X scale: continuous
  const minData = Math.min(...chartData);
  const maxData = Math.max(...chartData);
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([minData - 5, maxData + 5])
        .range([0, innerWidth]),
    [minData, maxData, innerWidth]
  );

  // Fixed dot radius and vertical gap
  const levelGap = dotRadius * 2 + 2;

  // Compute scatter with collision avoidance
  const scatterData = useMemo(
    () => computeScatterData(chartData, xScale, dotRadius),
    [chartData, xScale, dotRadius]
  );

  // Find the maximum level for ensuring proper chart height
  const maxLevel = Math.max(...scatterData.map((d) => d.level || 1));

  // Only calculate threshold-related values if threshold is enabled
  const [thresholdX, setThresholdX] = useState(innerWidth / 2);
  const thresholdValue = enableThreshold ? xScale.invert(thresholdX) : 0;

  // Counts on each side (only if threshold is enabled)
  const leftCount = enableThreshold
    ? chartData.filter((v) => v <= thresholdValue).length
    : 0;
  const rightCount = enableThreshold ? chartData.length - leftCount : 0;

  // Generate x-axis tick values - about 5-7 ticks
  const xAxisTicks = useMemo(() => {
    const range = maxData - minData;
    const tickCount = 5; // Aim for 5 ticks
    const step = Math.ceil(range / (tickCount - 1));
    const roundedStep = Math.ceil(step / 10) * 10; // Round to nearest 10

    const ticks = [];
    let current = Math.floor(minData / 10) * 10; // Round down to nearest 10

    while (current <= maxData + 5) {
      ticks.push(current);
      current += roundedStep;
    }

    return ticks;
  }, [minData, maxData]);

  // Pan gesture for threshold line (only create if enabled)
  const panGesture = enableThreshold
    ? Gesture.Pan()
        .activateAfterLongPress(0) // Start immediately on touch
        .minDistance(0) // No minimum distance required
        .onUpdate((e) => {
          let x = e.x - margins.left;
          x = Math.max(0, Math.min(x, innerWidth));
          setThresholdX(x);
        })
    : Gesture.Pan(); // Empty gesture if disabled

  // State for tracking hovered dot
  const [hoveredDot, setHoveredDot] = useState(null);

  return (
    <Animated.View style={styles.wrapper}>
      {/* Only show counts if threshold is enabled */}
      {enableThreshold && (
        <View style={[styles.countsRow, { width: innerWidth }]}>
          <Text style={styles.countText}>Left: {leftCount}</Text>
          <Text style={styles.countText}>Right: {rightCount}</Text>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <Svg width={svgWidth} height={chartHeight + margins.top + 20}>
          <G x={margins.left}>
            {/* X-axis ticks and labels */}
            {xAxisTicks.map((tick, i) => (
              <G key={`tick-${i}`}>
                <Line
                  x1={xScale(tick)}
                  y1={baseline}
                  x2={xScale(tick)}
                  y2={baseline + 5}
                  stroke={axisColor}
                  strokeWidth={1}
                />
                <SvgText
                  x={xScale(tick)}
                  y={baseline + 15}
                  fontSize={10}
                  fill={axisColor}
                  textAnchor="middle"
                >
                  {tick}
                </SvgText>
              </G>
            ))}

            {/* Dots with collision avoidance */}
            {scatterData.map((d, i) => (
              <Circle
                key={i}
                cx={xScale(d.value)}
                cy={baseline - (d.level - 1) * levelGap}
                r={dotRadius}
                fill={dotColor}
                onPress={enablePopup ? () => setHoveredDot(d) : undefined}
              />
            ))}

            {/* Popup for hovered dot - only if enabled */}
            {enablePopup && hoveredDot && (
              <G>
                <Rect
                  x={xScale(hoveredDot.value) - 25}
                  y={baseline - (hoveredDot.level - 1) * levelGap - 30}
                  width={50}
                  height={20}
                  fill="rgba(0,0,0,0.7)"
                  rx={5}
                  ry={5}
                />
                <SvgText
                  x={xScale(hoveredDot.value)}
                  y={baseline - (hoveredDot.level - 1) * levelGap - 16}
                  fontSize={12}
                  fill="white"
                  textAnchor="middle"
                >
                  {hoveredDot.value}
                </SvgText>
              </G>
            )}

            {/* Threshold Line & Label - only if enabled */}
            {enableThreshold && (
              <>
                {/* Invisible touch target - place this first */}
                <Line
                  x1={thresholdX}
                  y1={margins.top}
                  x2={thresholdX}
                  y2={baseline}
                  stroke="transparent"
                  strokeWidth={20} // Wider touch area
                />
                {/* Visible line */}
                <Line
                  x1={thresholdX}
                  y1={margins.top}
                  x2={thresholdX}
                  y2={baseline}
                  stroke={thresholdColor}
                  strokeWidth={2}
                />
                <SvgText
                  x={thresholdX + 4}
                  y={margins.top + 12}
                  fontSize={12}
                  fill={thresholdColor}
                >
                  {thresholdValue.toFixed(1)}
                </SvgText>
              </>
            )}

            {/* X-axis line */}
            <Line
              x1={0}
              y1={baseline}
              x2={innerWidth}
              y2={baseline}
              stroke={axisColor}
              strokeWidth={1}
            />
          </G>
        </Svg>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    padding: 16,
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  popupText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
});

export { Minitool_2_chart };
