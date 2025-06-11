import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Switch,
} from "react-native";
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated from "react-native-reanimated";
// Gesture handler imports might not be needed if all gestures are removed
// import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

// Default settings
const defaultSettings = {
  width: 300,
  height: 300, // Adjusted height for controls and chart
  data: null,
  dotRadius: 4,
  dotColor: "green", // Changed default dot color for distinction
  axisColor: "black",
  intervalLineColor: "gray",
  margins: { top: 20, bottom: 70, left: 40, right: 20 }, // Increased bottom margin for controls
  xAxisStep: null, // Custom step size for x-axis ticks (can be kept for general axis)
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
  const startValue = Math.floor(minData / intervalWidth) * intervalWidth;

  for (
    let currentMin = startValue;
    currentMin < maxData + intervalWidth;
    currentMin += intervalWidth
  ) {
    const currentMax = currentMin + intervalWidth;
    const count = data.filter(
      (value) => value >= currentMin && value < currentMax
    ).length;
    bins.push({
      valueMin: currentMin,
      valueMax: currentMax,
      count: count,
    });
    if (
      currentMin >= maxData &&
      count === 0 &&
      bins.length > 1 &&
      bins[bins.length - 2].count === 0
    ) {
      // Avoid adding too many empty bins at the end if maxData is a multiple of intervalWidth
      if (currentMin > maxData) bins.pop();
      break;
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

  const svgWidth = width;
  const innerWidth = svgWidth - margins.left - margins.right;

  // Helper function to create chart elements for a given dataset
  const renderChart = (dataset, color, keyPrefix) => {
    const minData = Math.min(...dataset);
    const maxData = Math.max(...dataset);

    const xScale = scaleLinear()
      .domain([minData - 5, maxData + 5])
      .range([0, innerWidth]);

    const scatterData = computeScatterData(dataset, xScale, dotRadius);
    const maxLevel = Math.max(1, ...scatterData.map((d) => d.level || 1));
    const minChartHeight = height || defaultSettings.height;
    const levelGap = dotRadius * 2 + 2;
    const requiredHeight = maxLevel * levelGap + margins.top + margins.bottom;
    const chartHeight = Math.max(minChartHeight, requiredHeight);
    const baseline = chartHeight - margins.bottom;

    const intervalBins = computeIntervalBins(
      dataset,
      intervalWidth,
      minData,
      maxData
    );

    const xAxisTicks =
      xAxisStep !== null && xAxisStep > 0
        ? (() => {
            const ticks = [];
            let current = Math.floor(minData / xAxisStep) * xAxisStep;
            while (current <= maxData + 5) {
              ticks.push(current);
              current += xAxisStep;
            }
            return ticks;
          })()
        : xScale.ticks(Math.max(2, Math.floor(innerWidth / 60)));

    return (
      <View key={keyPrefix} style={styles.chartInstanceContainer}>
        {chartName && (
          <Text style={styles.chartInstanceName}>
            {chartName} - {keyPrefix === "before" ? "Before" : "After"}
          </Text>
        )}
        <Svg width={svgWidth} height={chartHeight + margins.top + 20}>
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
                  cy={baseline - (d.level - 1) * levelGap}
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
                    y1={margins.top / 2}
                    x2={xScale(bin.valueMin)}
                    y2={baseline}
                    stroke={intervalLineColor}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  {bin.count > 0 && (
                    <SvgText
                      x={xScale(bin.valueMin + intervalWidth / 2)}
                      y={margins.top / 2 + 5}
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
                x1={xScale(intervalBins[intervalBins.length - 1].valueMax)}
                y1={margins.top / 2}
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
      setIntervalWidth(defaultSettings.initialIntervalWidth); // Or some other default
    }
  };

  return (
    <Animated.View style={styles.container}>
      {/* Render two charts */}
      {renderChart(chartDataBefore, "blue", "before")}
      {renderChart(chartDataAfter, "orange", "after")}

      {/* Controls moved under the charts */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRowInput}>
          <Text style={styles.controlLabel}>Interval Width: </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={handleIntervalWidthChange}
            placeholder={defaultSettings.initialIntervalWidth.toString()}
          />
        </View>
        <View style={styles.controlRow}>
          <Text>Show Dots: </Text>
          <Switch value={showDots} onValueChange={setShowDots} />
        </View>
        <View style={styles.controlRow}>
          <Text>Show Intervals: </Text>
          <Switch value={showIntervals} onValueChange={setShowIntervals} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 10,
  },
  chartInstanceContainer: {
    // Style for each chart instance (SVG + Name)
    marginBottom: 20,
    alignItems: "center",
  },
  chartInstanceName: {
    // Style for the name above each chart
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  controlsContainer: {
    marginTop: 15, // Ensure controls are below the charts
    width: "100%",
    paddingHorizontal: 10,
    alignItems: "center", // Center the control rows
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "80%", // Make control rows take a certain width to center them
  },
  controlRowInput: {
    // Specific style for the input row for better alignment
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "80%",
    justifyContent: "center", // Center the label and input
  },
  controlLabel: {
    // Style for labels in control rows
    marginRight: 5, // Space between label and input/switch
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 70,
    marginLeft: 10,
  },
});

export { DotHistogramView };
