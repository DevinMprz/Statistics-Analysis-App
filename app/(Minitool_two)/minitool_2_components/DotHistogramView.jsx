import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Switch,
  TouchableOpacity, // Added for legend
} from "react-native";
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated from "react-native-reanimated";
// Gesture handler imports might not be needed if all gestures are removed
// import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

// Default settings
const defaultSettings = {
  width: 300,
  height: 300,
  data: null,
  dotRadius: 4,
  // dotColor: "green", // Will be set per chart
  axisColor: "black",
  intervalLineColor: "gray",
  margins: { top: 40, bottom: 70, left: 40, right: 20 }, // Increased top margin for counts
  xAxisStep: null,
  initialIntervalWidth: 5,
};

// Temporary test dataset (replace with prop or imported data)
const testData = [
  100, 100, 103, 105, 110, 90, 95, 115, 120, 150, 150, 155, 80, 85, 160, 165,
  170, 130, 50, 300, 102, 108, 101, 107, 112, 92, 98, 118, 122, 152, 158, 151,
  82, 88, 162, 168, 172, 132, 52, 290,
];

// Collision-avoiding scatter data computation (from Minitool_2_chart)
const computeScatterData = (data, xScale, dotRadius) => {
  if (!data || !data.length) return [];
  const counts = {};
  const basicScatter = data.map((value) => {
    counts[value] = (counts[value] || 0) + 1;
    return { value, index: counts[value] };
  });

  const sortedDots = [...basicScatter].sort((a, b) => a.value - b.value);
  const minDistance = dotRadius * 2;
  const adjustedDots = [];

  sortedDots.forEach((dot) => {
    const dotX = xScale(dot.value);
    let level = dot.index;
    let collision = true;
    while (collision) {
      collision = false;
      for (let j = 0; j < adjustedDots.length; j++) {
        const placedDot = adjustedDots[j];
        const placedX = xScale(placedDot.value);
        if (
          Math.abs(dotX - placedX) < minDistance &&
          level === placedDot.level
        ) {
          level++;
          collision = true;
          break;
        }
      }
    }
    adjustedDots.push({ value: dot.value, index: dot.index, level: level });
  });
  return adjustedDots;
};

// Function to compute interval bins and counts
const computeIntervalBins = (data, intervalWidth, minData, maxData) => {
  if (!data || !data.length || intervalWidth <= 0) return [];

  const bins = [];
  // Ensure the first bin starts at or before the minData
  const startValue = Math.floor(minData / intervalWidth) * intervalWidth;

  let currentMin = startValue;
  // Ensure bins cover the entire data range, including maxData
  while (currentMin <= maxData) {
    const currentMax = currentMin + intervalWidth;
    const count = data.filter(
      (value) => value >= currentMin && value < currentMax
    ).length;
    bins.push({
      valueMin: currentMin,
      valueMax: currentMax,
      count: count,
    });
    currentMin += intervalWidth;
  }
  // If the last bin's max is less than maxData, add one more bin if needed (edge case)
  if (bins.length > 0) {
    const lastBin = bins[bins.length - 1];
    if (lastBin.valueMax <= maxData && lastBin.valueMax > lastBin.valueMin) {
      // ensure valueMax is greater
      // Check if maxData falls into the next interval
      if (maxData >= lastBin.valueMax) {
        const nextMin = lastBin.valueMax;
        const nextMax = nextMin + intervalWidth;
        const count = data.filter(
          (value) => value >= nextMin && value < nextMax
        ).length;
        // Only add if there's data or if it's the first interval extending beyond maxData
        if (count > 0 || (bins.length === 1 && nextMin === maxData)) {
          bins.push({ valueMin: nextMin, valueMax: nextMax, count });
        } else if (dataset.some((d) => d === maxData) && maxData === nextMin) {
          // handles if maxData is exactly at the start of a new bin
          bins.push({ valueMin: nextMin, valueMax: nextMax, count });
        }
      }
    }
  }

  return bins;
};

function DotHistogramView(settings) {
  const config = { ...defaultSettings, ...settings };
  const {
    width,
    height,
    data, // This will be an array of two datasets: [dataBefore, dataAfter]
    dotRadius,
    // dotColor, // Will be set per chart
    axisColor,
    intervalLineColor,
    margins,
    xAxisStep,
    initialIntervalWidth,
    chartName, // New prop for chart name
    xDomain, // <--- Added xDomain to destructuring
  } = config;

  // Separate data for two charts
  const chartDataBefore =
    data && data.length > 0 && data[0] ? data[0] : testData;
  const chartDataAfter =
    data && data.length > 1 && data[1] ? data[1] : testData;

  const [intervalWidth, setIntervalWidth] = useState(initialIntervalWidth);
  const [inputValue, setInputValue] = useState(initialIntervalWidth.toString());
  const [showDots, setShowDots] = useState(true);
  const [showIntervals, setShowIntervals] = useState(true); // Default to true
  const [isLegendOpen, setIsLegendOpen] = useState(false); // Added for legend

  const svgWidth = width;
  const innerWidth = svgWidth - margins.left - margins.right;

  // Helper function to create chart elements for a given dataset
  const renderChart = (dataset, color, keyPrefix, chartTitle) => {
    if (!dataset || dataset.length === 0) {
      return <Text key={keyPrefix}>No data for {chartTitle}</Text>;
    }
    // const minData = Math.min(...dataset); // No longer needed here
    // const maxData = Math.max(...dataset); // No longer needed here

    // Use config.height directly for chart area calculation consistency
    const fixedChartHeight = height; // height from config

    // Adjust domain to ensure it covers min and max data points adequately
    // const domainMin = minData - (intervalWidth > 0 ? intervalWidth * 0.5 : 5); // No longer needed
    // const domainMax = maxData + (intervalWidth > 0 ? intervalWidth * 0.5 : 5); // No longer needed

    const xScale = scaleLinear()
      .domain(xDomain ? [xDomain.min, xDomain.max] : [0, 100]) // Use xDomain prop
      .range([0, innerWidth]);

    const scatterData = computeScatterData(dataset, xScale, dotRadius);
    const maxLevel = Math.max(1, ...scatterData.map((d) => d.level || 1));
    const minChartHeight = height || defaultSettings.height; // This is config.height
    const levelGap = dotRadius * 2 + 2;
    // requiredHeight calculation is kept for context but chartHeight is fixed
    // const requiredHeight = maxLevel * levelGap + margins.top + margins.bottom;
    const chartHeight = minChartHeight; // Use the fixed height from settings
    const baseline = chartHeight - margins.bottom;

    const intervalBins = computeIntervalBins(
      dataset,
      intervalWidth,
      xDomain ? xDomain.min : 0, // Use xDomain.min for interval calculation
      xDomain ? xDomain.max : 100 // Use xDomain.max for interval calculation
    );

    const xAxisTicks = useMemo(() => {
      const [currentMinData, currentMaxData] = xScale.domain(); // Get domain from shared scale

      if (xAxisStep !== null && xAxisStep > 0) {
        const ticksArray = [];
        let current = Math.floor(currentMinData / xAxisStep) * xAxisStep;
        if (current > currentMinData) {
          // Corrected condition
          current -= xAxisStep;
        }
        while (
          current <=
          currentMaxData + (currentMaxData % xAxisStep !== 0 ? xAxisStep : 0)
        ) {
          ticksArray.push(current);
          if (current + xAxisStep <= current && xAxisStep > 0) {
            console.warn(
              "Potential infinite loop in xAxisTicks generation due to xAxisStep value."
            );
            break;
          }
          current += xAxisStep;
          if (ticksArray.length > 200) break;
        }
        return ticksArray.length > 0 ? ticksArray : xScale.ticks(5);
      } else {
        const numTicks =
          // dataset.length > 0 // dataset.length is not relevant for shared domain ticks
          // For a shared domain, basing ticks on one dataset's length might be misleading.
          // Consider a fixed number or a calculation based on the domain range.
          // ? Math.max(3, Math.min(10, 5)) // Example: fixed 5 ticks
          // : 1;
          5; // Default to 5 ticks for shared domain if no step provided
        return xScale.ticks(numTicks);
      }
    }, [xScale, xAxisStep, innerWidth]); // Removed dataset.length as dependency for shared domain

    return (
      <View key={keyPrefix} style={styles.chartInstanceContainer}>
        {chartTitle && (
          <Text style={styles.chartInstanceName}>{chartTitle}</Text>
        )}
        <Svg width={svgWidth} height={chartHeight + margins.top + 20}>
          {/* SVG height is now based on the fixed chartHeight + top margin + padding.
              Consider if chartHeight should represent the total SVG area or just plot area.
              If chartHeight is plot area, SVG height = chartHeight + margins.top + margins.bottom.
              Current: SVG height uses chartHeight (from config) + margins.top + an arbitrary 20.
              Let's assume config.height is the main drawing area, and margins are handled by G transform and SVG sizing.
              To truly fix SVG size, height prop of Svg should be a constant value.
              Let's try: <Svg width={svgWidth} height={fixedChartHeight}> and adjust G transform and baseline.
              No, the existing structure with chartHeight + margins.top + 20 for SVG height
              and G transform y={margins.top} with baseline = chartHeight - margins.bottom
              should work if chartHeight itself is fixed (which it is now).
           */}
          <G x={margins.left} y={margins.top}>
            {/* X-axis Ticks and Labels */}
            {xAxisTicks.map((tick, i) => (
              <G key={`x-tick-${keyPrefix}-${i}`}>
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

            {/* Dots */}
            {showDots &&
              scatterData.map((d, i) => (
                <Circle
                  key={`dot-${keyPrefix}-${i}`}
                  cx={xScale(d.value)}
                  cy={baseline - (d.level - 1) * levelGap - dotRadius - 1} // Adjusted cy
                  r={dotRadius}
                  fill={color}
                />
              ))}

            {/* Interval Lines and Counts */}
            {showIntervals &&
              intervalBins.map((bin, i) => (
                <G key={`interval-${keyPrefix}-${i}`}>
                  <Line
                    x1={xScale(bin.valueMin)}
                    y1={margins.top / 2 - 5} // Adjusted y1 for count text visibility
                    x2={xScale(bin.valueMin)}
                    y2={baseline}
                    stroke={intervalLineColor}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  {bin.count > 0 && (
                    <SvgText
                      x={xScale(bin.valueMin + intervalWidth / 2)}
                      y={margins.top / 2 - 8} // Position count above the line
                      fontSize={10}
                      fill={axisColor}
                      textAnchor="middle"
                    >
                      {bin.count}
                    </SvgText>
                  )}
                </G>
              ))}
            {showIntervals && intervalBins.length > 0 && (
              <Line
                // Draw the last line at the end of the last interval
                x1={xScale(intervalBins[intervalBins.length - 1].valueMax)}
                y1={margins.top / 2 - 5} // Adjusted y1
                x2={xScale(intervalBins[intervalBins.length - 1].valueMax)}
                y2={baseline}
                stroke={intervalLineColor}
                strokeWidth={1}
                strokeDasharray="2,2"
              />
            )}

            {/* X-axis Line */}
            <Line
              x1={0}
              y1={baseline}
              x2={innerWidth}
              y2={baseline}
              stroke={axisColor}
              strokeWidth={1.5}
            />
          </G>
        </Svg>
      </View>
    );
  };

  const handleIntervalWidthChange = (text) => {
    setInputValue(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setIntervalWidth(numValue);
    } else if (text === "") {
      setIntervalWidth(0);
    }
  };

  return (
    <View style={styles.container}>
      {/* Individual chart rendering */}
      {renderChart(chartDataBefore, "blue", "chart-before", "Before")}
      {renderChart(chartDataAfter, "red", "chart-after", "After")}

      {/* Interval Width Control */}
      <View style={styles.controlContainer}>
        <Text style={styles.label}>Interval Width:</Text>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleIntervalWidthChange}
          keyboardType="numeric"
        />
        <Button
          title="Update Interval"
          onPress={() => {
            const numValue = parseInt(inputValue, 10);
            if (!isNaN(numValue) && numValue > 0) {
              setIntervalWidth(numValue);
            }
          }}
        />
      </View>

      {/* Legend Toggle - New Section */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <TouchableOpacity
          style={styles.legendToggle}
          onPress={() => setIsLegendOpen(!isLegendOpen)}
        >
          <Text style={styles.legendToggleText}>
            {isLegendOpen ? "Hide Legend" : "Show Legend"}
          </Text>
        </TouchableOpacity>
        {isLegendOpen && (
          <View style={styles.legendContent}>
            <Text style={styles.legendItem}>
              <Text style={styles.legendColor("blue")} /> Before
            </Text>
            <Text style={styles.legendItem}>
              <Text style={styles.legendColor("red")} /> After
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  chartInstanceContainer: {
    marginBottom: 20,
  },
  chartInstanceName: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  label: {
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 5,
    marginBottom: 10,
    width: 100,
  },
  controlContainer: {
    marginBottom: 20,
  },
  legendContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "gray",
    paddingTop: 10,
  },
  legendTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  legendToggle: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  legendToggleText: {
    color: "blue",
    fontWeight: "bold",
  },
  legendContent: {
    marginTop: 10,
  },
  legendItem: {
    marginBottom: 5,
  },
  legendColor: (color) => ({
    width: 10,
    height: 10,
    backgroundColor: color,
    borderRadius: 5,
    marginRight: 5,
    display: "inline-block",
  }),
});

export default DotHistogramView;
