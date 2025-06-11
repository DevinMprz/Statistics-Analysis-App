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
    const minData = Math.min(...dataset);
    const maxData = Math.max(...dataset);

    // Use config.height directly for chart area calculation consistency
    const fixedChartHeight = height; // height from config

    // Adjust domain to ensure it covers min and max data points adequately
    const domainMin = minData - (intervalWidth > 0 ? intervalWidth * 0.5 : 5);
    const domainMax = maxData + (intervalWidth > 0 ? intervalWidth * 0.5 : 5);

    const xScale = scaleLinear()
      .domain([domainMin, domainMax])
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
      setIntervalWidth(defaultSettings.initialIntervalWidth); // Or some other default
    }
  };

  return (
    <Animated.View style={styles.container}>
      {/* Legend Toggle and Content */}
      <TouchableOpacity
        onPress={() => setIsLegendOpen(!isLegendOpen)}
        style={styles.legendToggle}
      >
        <Text style={styles.legendToggleText}>
          {isLegendOpen ? "▼" : "►"} What is this module about?
        </Text>
      </TouchableOpacity>
      {isLegendOpen && (
        <View style={styles.legendContent}>
          <Text style={styles.legendTitle}>Speed Trap Analysis</Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>What is this?</Text> This chart
            shows how many cars were recorded at different speeds. The green
            dots/bars represent speeds before a traffic calming measure (like a
            new speed sign), and the pink dots/bars show speeds two months
            later.
          </Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>Why is it useful?</Text> By
            comparing the "before" and "after" charts, you can see if the
            traffic calming measure was effective in reducing vehicle speeds.
            Look for shifts in where most of the dots are clustered.
          </Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>What can you do?</Text>
            {"\n"}- Adjust the{" "}
            <Text style={styles.legendTextBold}>'Interval Width'</Text> to group
            speeds into wider or narrower bins. This can help you see different
            patterns in the data.
            {"\n"}- Toggle{" "}
            <Text style={styles.legendTextBold}>'Show Dots'</Text> to see each
            individual car's speed or hide them to focus on the interval counts.
            {"\n"}- Toggle{" "}
            <Text style={styles.legendTextBold}>'Show Intervals'</Text> to see
            the vertical lines marking the speed groups and the count of cars in
            each group.
          </Text>
        </View>
      )}

      {/* Render two charts */}
      {renderChart(
        chartDataBefore,
        "green",
        "before",
        "Vehicle Speeds - April 2002"
      )}
      {renderChart(
        chartDataAfter,
        "pink",
        "after",
        "Vehicle Speeds - Two months later"
      )}

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
  legendToggle: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    width: "90%",
  },
  legendToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "navy",
  },
  legendContent: {
    width: "90%",
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "navy",
    textAlign: "center",
  },
  legendText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: "#333",
  },
  legendTextBold: {
    fontWeight: "bold",
  },
});

export { DotHistogramView };
