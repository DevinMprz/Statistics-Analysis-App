import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Switch,
  TouchableOpacity,
} from "react-native"; // Added TouchableOpacity
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  // GestureHandlerRootView, // Not strictly needed here if used in parent
} from "react-native-gesture-handler";

// Default settings with toggle options
const defaultSettings = {
  width: 300, // Width for each individual chart when stacked
  height: 100, // Base height, will adjust dynamically
  dataBefore: null,
  dataAfter: null,
  dotRadius: 4,
  thresholdColor: "red",
  axisColor: "black",
  separatorColor: "purple", // For box plot separators
  margins: { top: 40, bottom: 40, left: 40, right: 20 }, // Increased bottom margin to 40
  enablePopup: false,
  xAxisStep: null,
  chartName: "Cholesterol Levels", // Updated default chart name
};

// Temporary test dataset embedded directly (can be removed if always passing data)
const testDataBefore = [
  100, 100, 100, 100, 103, 105, 105, 110, 110, 90, 95, 115, 120, 150, 150, 150,
  150, 150, 155, 155, 80, 85, 160, 165, 170, 130, 130, 130, 130, 130, 130, 50,
  50, 300, 300,
];
const testDataAfter = [
  110, 110, 110, 110, 113, 115, 115, 120, 120, 100, 105, 125, 130, 160, 160,
  160, 160, 160, 165, 165, 90, 95, 170, 175, 180, 140, 140, 140, 140, 140, 140,
  60, 60, 310, 310,
];

// Improved collision-avoiding scatter data computation
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

// Helper to calculate quartiles
const getQuartiles = (arr) => {
  if (!arr || arr.length === 0)
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const q1 = sorted[Math.floor(mid / 2)];
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  // Corrected Q3 calculation
  const q3Offset = Math.ceil(sorted.length * 0.75) - 1;
  const q3 = sorted[q3Offset];
  return {
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[sorted.length - 1],
  };
};

function CholesterolLevelChart(settings) {
  const config = { ...defaultSettings, ...settings };
  const {
    width, // This is width for EACH chart
    height, // Base height for EACH chart
    dataBefore: initialDataBefore,
    dataAfter: initialDataAfter,
    dotRadius,
    thresholdColor,
    axisColor,
    separatorColor,
    margins,
    enablePopup,
    xAxisStep,
    chartName,
  } = config;

  const [showData, setShowData] = useState(true);
  const [boxCreationMode, setBoxCreationMode] = useState(false);
  const [thresholdLines, setThresholdLines] = useState([]);
  const [draggingLineId, setDraggingLineId] = useState(null);
  const [boxPlotMode, setBoxPlotMode] = useState(null); // null, 'two', 'four'
  const dragInitialXRef = useRef(0);
  const [isLegendOpen, setIsLegendOpen] = useState(false); // Added for legend

  const handleAddLineGlobal = useCallback(
    (tapXPosition) => {
      if (boxCreationMode) {
        const newId = Date.now();
        // Add new line and sort immediately
        setThresholdLines((prev) =>
          [...prev, { id: newId, x: tapXPosition }].sort((a, b) => a.x - b.x)
        );
      }
    },
    [boxCreationMode]
  ); // setThresholdLines is stable, not needed as dep

  const handleDragLineUpdateGlobal = useCallback((lineId, newXPosition) => {
    // Update position without sorting
    setThresholdLines((prevLines) =>
      prevLines.map((line) =>
        line.id === lineId ? { ...line, x: newXPosition } : line
      )
    );
  }, []); // setThresholdLines is stable, not needed as dep

  const renderChartInternal = (
    dataset,
    datasetKey, // 'before' or 'after'
    dotColorProp
  ) => {
    const chartData =
      datasetKey === "before"
        ? dataset || testDataBefore
        : dataset || testDataAfter;

    if (!chartData || chartData.length === 0) {
      return (
        <Text key={datasetKey}>
          No data for {datasetKey === "before" ? "Before Diet" : "After Diet"}
        </Text>
      );
    }

    const svgWidth = width; // Use the width prop directly for the SVG
    const innerWidth = svgWidth - margins.left - margins.right;

    const minData = Math.min(...chartData);
    const maxData = Math.max(...chartData);
    const xScale = useMemo(
      () =>
        scaleLinear()
          .domain([minData - 5, maxData + 5])
          .range([0, innerWidth]),
      [minData, maxData, innerWidth]
    );

    const levelGap = dotRadius * 2 + 2;
    // Memoize scatterPlotData
    const scatterPlotData = useMemo(() => {
      return computeScatterData(chartData, xScale, dotRadius);
    }, [chartData, xScale, dotRadius]);

    const maxLevel = Math.max(1, ...scatterPlotData.map((d) => d.level || 1));

    const minChartHeight = height;
    const requiredChartHeight =
      maxLevel * levelGap + margins.top + margins.bottom;
    const currentChartHeight = Math.max(minChartHeight, requiredChartHeight);
    const baseline = currentChartHeight - margins.bottom;

    // X-Axis Synchronization Safeguard
    if (
      innerWidth <= 0 ||
      !isFinite(innerWidth) ||
      baseline <= 0 ||
      !isFinite(baseline)
    ) {
      return (
        <Text key={`${datasetKey}-loading`}>
          Calculating chart dimensions...
        </Text>
      );
    }

    const [hoveredDot, setHoveredDot] = useState(null);

    const tapGesture = Gesture.Tap()
      .onEnd((event) => {
        const tapXInG = event.x - margins.left;
        const clampedTapX = Math.max(0, Math.min(tapXInG, innerWidth));
        handleAddLineGlobal(clampedTapX);
      })
      .runOnJS(true); // <--- ADD THIS

    // Memoize boxPlotSeparators
    const boxPlotSeparators = useMemo(() => {
      if (!boxPlotMode) return [];
      const stats = getQuartiles(chartData);
      if (boxPlotMode === "two") return [stats.min, stats.median, stats.max];
      if (boxPlotMode === "four")
        return [stats.min, stats.q1, stats.median, stats.q3, stats.max];
      return [];
    }, [chartData, boxPlotMode]);

    // Original calculateAndRenderCountsInGaps function definition remains here
    const calculateAndRenderCountsInGaps = () => {
      if (!boxCreationMode && thresholdLines.length === 0) return null;

      const sortedUniqueLineXs = [
        ...new Set(thresholdLines.map((l) => l.x)),
      ].sort((a, b) => a - b);
      const allBoundariesX = [0, ...sortedUniqueLineXs, innerWidth]
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a - b);

      return allBoundariesX
        .slice(0, -1)
        .map((startX, idx) => {
          const endX = allBoundariesX[idx + 1];
          if (startX >= endX) return null;

          const valueStart = xScale.invert(startX);
          const valueEnd = xScale.invert(endX);
          const count = chartData.filter(
            (v) => v >= valueStart && v < valueEnd
          ).length;

          if (count > 0) {
            const midX = (startX + endX) / 2;
            return (
              <SvgText
                key={`count-${datasetKey}-${idx}`}
                x={midX}
                y={margins.top - 15} // Position counts above chart content area
                fontSize={12}
                fill={axisColor}
                textAnchor="middle"
              >
                {count}
              </SvgText>
            );
          }
          return null;
        })
        .filter(Boolean);
    };

    // Memoize the *result* of calling calculateAndRenderCountsInGaps
    const memoizedGapCounts = useMemo(() => {
      // Dependencies should match those that affect the output of calculateAndRenderCountsInGaps
      return calculateAndRenderCountsInGaps();
    }, [
      boxCreationMode,
      thresholdLines,
      chartData,
      xScale,
      innerWidth,
      axisColor,
      margins.top,
      datasetKey /*, other dependencies of calculateAndRenderCountsInGaps if any */,
    ]);

    const xAxisTicksData = useMemo(() => {
      const ticksArr = [];
      if (xAxisStep !== null && xAxisStep > 0) {
        let current = Math.floor(minData / xAxisStep) * xAxisStep;
        while (current <= maxData + 5) {
          // Ensure the last tick covers maxData if it's a step multiple
          ticksArr.push(current);
          if (
            current + xAxisStep > maxData + 5 &&
            current < maxData + 5 &&
            !ticksArr.includes(maxData + 5)
          ) {
            // Heuristic: if the next step goes beyond maxData, but maxData is not yet included,
            // consider adding a tick closer to maxData or ensure range covers it.
            // For simplicity, the loop condition handles most cases.
            // Consider if specific handling for the last tick is needed if it doesn't align.
          }
          current += xAxisStep;
          // Safety break for very small xAxisStep to prevent infinite loops with floating point issues
          if (ticksArr.length > 1000) break;
        }
        // Ensure the domain end is considered for a tick if not covered
        if (
          ticksArr.length > 0 &&
          ticksArr[ticksArr.length - 1] < maxData &&
          maxData - ticksArr[ticksArr.length - 1] > xAxisStep / 2
        ) {
          // This logic can be complex; d3.ticks is generally better for auto-generation.
          // For manual step, ensure the range is well-covered or stick to simpler step logic.
        }
      } else {
        // Dynamic calculation based on chartData.length
        const numTicks = Math.max(
          3,
          Math.min(10, Math.ceil(chartData.length / 5) || 1)
        );
        return xScale.ticks(numTicks); // Auto ticks based on data length
      }
      return ticksArr;
    }, [minData, maxData, xAxisStep, xScale, chartData.length]); // Added chartData.length

    return (
      <View style={styles.chartInstanceContainer} key={datasetKey}>
        <Text style={styles.chartInstanceName}>
          {chartName} - {datasetKey === "before" ? "Before Diet" : "After Diet"}
        </Text>
        <GestureDetector gesture={tapGesture}>
          <Svg width={svgWidth} height={currentChartHeight + margins.top + 20}>
            <G x={margins.left} y={margins.top}>
              {/* X-axis line - MOVED EARLIER */}
              <Line
                x1={0}
                y1={baseline}
                x2={innerWidth}
                y2={baseline}
                stroke={axisColor}
                strokeWidth={1}
              />

              {/* X-axis ticks and labels */}
              {xAxisTicksData.map((tick, i) => (
                <G key={`tick-${datasetKey}-${i}`}>
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
              {showData &&
                scatterPlotData.map((d, i) => (
                  <Circle
                    key={`dot-${datasetKey}-${i}`}
                    cx={xScale(d.value)}
                    cy={baseline - dotRadius - 2 - (d.level - 1) * levelGap} // Adjusted cy for dots to be slightly above x-axis
                    r={dotRadius}
                    fill={dotColorProp}
                    onPress={enablePopup ? () => setHoveredDot(d) : undefined}
                  />
                ))}

              {/* Popup for hovered dot */}
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

              {/* Render global threshold lines and their drag handles */}
              {boxCreationMode &&
                thresholdLines.map((line) => {
                  const lineDragGesture = Gesture.Pan()
                    .activeOffsetX([0, 0]) // Make drag activate with smaller horizontal movement
                    .onBegin(() => {
                      setDraggingLineId(line.id);
                      dragInitialXRef.current = line.x;
                    })
                    .onUpdate((event) => {
                      let newDragX =
                        dragInitialXRef.current + event.translationX;
                      newDragX = Math.max(0, Math.min(newDragX, innerWidth));
                      handleDragLineUpdateGlobal(line.id, newDragX);
                    })
                    .onEnd(() => {
                      setDraggingLineId(null);
                      setThresholdLines((prevLines) =>
                        [...prevLines].sort((a, b) => a.x - b.x)
                      );
                    })
                    .runOnJS(true); // <--- ADD THIS

                  const handleSize = 12;
                  // Position handleY so the square is below the x-axis tick labels.
                  // X-axis labels are at y={baseline + 15}, fontSize={10}.
                  // Top of square will be at baseline + 17.
                  const handleY = baseline + 17;

                  return (
                    <G key={`threshold-line-group-${line.id}-${datasetKey}`}>
                      <Line
                        x1={line.x}
                        y1={margins.top - 10} // Extend line slightly above counts
                        x2={line.x}
                        // Extend line down to the bottom of the handle
                        y2={handleY + handleSize}
                        stroke={thresholdColor}
                        strokeWidth={2}
                      />
                      <GestureDetector gesture={lineDragGesture}>
                        <Rect // Draggable Handle
                          x={line.x - handleSize / 2}
                          y={handleY} // Use the new handleY
                          width={handleSize}
                          height={handleSize}
                          fill={
                            draggingLineId === line.id
                              ? "orange"
                              : thresholdColor
                          }
                          stroke="black"
                          strokeWidth={1}
                          rx={2}
                          ry={2}
                        />
                      </GestureDetector>
                      {/* Value label for the line on this specific chart */}
                      <SvgText
                        x={line.x + 4}
                        y={margins.top - 2}
                        fontSize={10}
                        fill={thresholdColor}
                        textAnchor="start"
                      >
                        {xScale.invert(line.x).toFixed(1)}
                      </SvgText>
                    </G>
                  );
                })}

              {/* Counts in Gaps */}
              {/* Use the memoized result here */}
              {boxCreationMode && memoizedGapCounts}

              {/* Box Plot Separators */}
              {boxPlotSeparators.map((sepValue, i) => (
                <G key={`sep-${datasetKey}-${i}`}>
                  <Line
                    x1={xScale(sepValue)}
                    y1={margins.top - 10}
                    x2={xScale(sepValue)}
                    y2={baseline}
                    stroke={separatorColor}
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />
                  {/* X-axis line was here, moved earlier */}
                  <SvgText
                    x={xScale(sepValue)}
                    y={margins.top - 15}
                    fontSize={10}
                    fill={separatorColor}
                    textAnchor="middle"
                  >
                    {sepValue.toFixed(1)}
                  </SvgText>
                </G>
              ))}
            </G>
          </Svg>
        </GestureDetector>
      </View>
    );
  };

  return (
    <Animated.View style={styles.wrapper}>
      {/* Legend Toggle and Content */}
      <TouchableOpacity
        onPress={() => setIsLegendOpen(!isLegendOpen)}
        style={styles.legendToggle}
      >
        <Text style={styles.legendToggleText}>
          {isLegendOpen ? "▼" : "►"} About This Cholesterol Chart
        </Text>
      </TouchableOpacity>
      {isLegendOpen && (
        <View style={styles.legendContent}>
          <Text style={styles.legendTitle}>Cholesterol Level Analysis</Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>What is this?</Text> These
            charts display cholesterol levels for a group of individuals. The{" "}
            <Text style={{ color: "green", fontWeight: "bold" }}>GREEN</Text>{" "}
            chart shows levels <Text style={styles.legendTextBold}>before</Text>{" "}
            a dietary change, and the{" "}
            <Text style={{ color: "pink", fontWeight: "bold" }}>PINK</Text>{" "}
            chart shows levels <Text style={styles.legendTextBold}>after</Text>{" "}
            the diet.
          </Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>Why is it useful?</Text>{" "}
            Comparing the two charts helps to see if the diet had a positive
            effect on lowering cholesterol. You can look for changes in how the
            dots are spread out or grouped.
          </Text>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>What can you do?</Text>
            {"\n"}- Toggle{" "}
            <Text style={styles.legendTextBold}>'Show Data'</Text> to view or
            hide the individual data points (dots).
            {"\n"}- Enable{" "}
            <Text style={styles.legendTextBold}>'Create Boxes'</Text>: Then, tap
            directly on the chart area to add vertical lines. Small squares will
            appear on these lines near the x-axis.
            {"\n"}- <Text style={styles.legendTextBold}>Drag the squares</Text>{" "}
            left or right to reposition the lines. The numbers appearing between
            the lines (or between a line and the chart edge) show how many data
            points fall into that specific cholesterol range.
            {"\n"}- Use the{" "}
            <Text style={styles.legendTextBold}>'Clear All Boxes'</Text> button
            to remove all lines you've added.
            {"\n"}- Select{" "}
            <Text style={styles.legendTextBold}>'Groups: Two (Median)'</Text> or{" "}
            <Text style={styles.legendTextBold}>'Four (Quartiles)'</Text> to
            automatically divide the data into sections based on statistical
            values (median or quartiles). This will replace any lines you've
            manually created.
          </Text>
        </View>
      )}

      <View style={styles.chartsContainer}>
        {renderChartInternal(initialDataBefore, "before", "green")}
        {renderChartInternal(initialDataAfter, "after", "pink")}
      </View>

      <View style={styles.controlsContainerUnderChart}>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Show Data: </Text>
          <Switch value={showData} onValueChange={setShowData} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Create Boxes: </Text>
          <Switch
            value={boxCreationMode}
            onValueChange={(val) => {
              setBoxCreationMode(val);
              if (val) setBoxPlotMode(null); // Turn off box plot if creating boxes
              // Do not clear lines here, allow them to persist unless "Clear Boxes" is pressed
            }}
          />
        </View>
        <View style={styles.controlRow}>
          <Button
            title="Clear All Boxes"
            onPress={() => setThresholdLines([])}
            disabled={thresholdLines.length === 0}
          />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Groups: </Text>
          <Button
            title="None"
            onPress={() => {
              setBoxPlotMode(null);
              if (boxCreationMode)
                setThresholdLines(
                  []
                ); /* Clear lines if switching from active box mode */
            }}
          />
          <Button
            title="Two (Median)"
            onPress={() => {
              setBoxPlotMode("two");
              setBoxCreationMode(false);
              setThresholdLines([]);
            }}
          />
          <Button
            title="Four (Quartiles)"
            onPress={() => {
              setBoxPlotMode("four");
              setBoxCreationMode(false);
              setThresholdLines([]);
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 16, // Only vertical padding for wrapper
    width: "100%",
  },
  chartsContainer: {
    flexDirection: "column", // Stack charts vertically
    width: "100%",
    alignItems: "center",
  },
  chartInstanceContainer: {
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  chartInstanceName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    // marginTop: 10, // Removed, top margin handled by margins.top in G element
  },
  controlsContainerUnderChart: {
    width: "95%", // Take most of the parent wrapper width
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
    width: "100%",
    paddingHorizontal: 5,
  },
  controlTextItem: {
    fontSize: 14,
    // fontWeight: "bold", // Optional: if labels should be bold
    marginRight: 8,
  },
  // popupText style can be kept if enablePopup is used
  popupText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  legendToggle: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    width: "95%", // Match controlsContainerUnderChart width
    alignSelf: "center",
  },
  legendToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "navy",
  },
  legendContent: {
    width: "95%", // Match controlsContainerUnderChart width
    alignSelf: "center",
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

export { CholesterolLevelChart, defaultSettings };
export { defaultSettings as CholesterolLevelChartDefaultSettings };
