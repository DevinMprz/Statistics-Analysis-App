import React, { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Button, Switch } from "react-native";
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
  margins: { top: 40, bottom: 30, left: 40, right: 20 }, // Increased top for name/counts
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
    const xScale = scaleLinear()
      .domain([minData - 5, maxData + 5])
      .range([0, innerWidth]);

    const levelGap = dotRadius * 2 + 2;
    const scatterPlotData = computeScatterData(chartData, xScale, dotRadius);
    const maxLevel = Math.max(1, ...scatterPlotData.map((d) => d.level || 1));

    const minChartHeight = height;
    const requiredChartHeight =
      maxLevel * levelGap + margins.top + margins.bottom;
    const currentChartHeight = Math.max(minChartHeight, requiredChartHeight);
    const baseline = currentChartHeight - margins.bottom;

    const [hoveredDot, setHoveredDot] = useState(null);

    const tapGesture = Gesture.Tap().onEnd((event) => {
      const tapXInG = event.x - margins.left;
      const clampedTapX = Math.max(0, Math.min(tapXInG, innerWidth));
      handleAddLineGlobal(clampedTapX);
    });

    const getSeparatorsForBoxPlot = () => {
      if (!boxPlotMode) return [];
      const stats = getQuartiles(chartData);
      if (boxPlotMode === "two") return [stats.min, stats.median, stats.max];
      if (boxPlotMode === "four")
        return [stats.min, stats.q1, stats.median, stats.q3, stats.max];
      return [];
    };
    const boxPlotSeparators = getSeparatorsForBoxPlot();

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

    const xAxisTicksData = useMemo(() => {
      const ticksArr = [];
      if (xAxisStep !== null && xAxisStep > 0) {
        let current = Math.floor(minData / xAxisStep) * xAxisStep;
        while (current <= maxData + 5) {
          ticksArr.push(current);
          current += xAxisStep;
        }
      } else {
        return xScale.ticks(Math.max(2, Math.floor(innerWidth / 60))); // Auto ticks
      }
      return ticksArr;
    }, [minData, maxData, xAxisStep, xScale, innerWidth]);

    return (
      <View style={styles.chartInstanceContainer} key={datasetKey}>
        <Text style={styles.chartInstanceName}>
          {chartName} - {datasetKey === "before" ? "Before Diet" : "After Diet"}
        </Text>
        <GestureDetector gesture={tapGesture}>
          <Svg width={svgWidth} height={currentChartHeight + margins.top + 20}>
            <G x={margins.left} y={margins.top}>
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
                    cy={baseline - (d.level - 1) * levelGap}
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
                    .onBegin(() => {
                      setDraggingLineId(line.id);
                      dragInitialXRef.current = line.x; // Store initial X of the line
                    })
                    .onUpdate((event) => {
                      let newDragX =
                        dragInitialXRef.current + event.translationX; // Calculate new X based on translation
                      newDragX = Math.max(0, Math.min(newDragX, innerWidth));
                      handleDragLineUpdateGlobal(line.id, newDragX); // Call non-sorting update
                    })
                    .onEnd(() => {
                      setDraggingLineId(null);
                      // Sort all lines after dragging one has finished
                      setThresholdLines((prevLines) =>
                        [...prevLines].sort((a, b) => a.x - b.x)
                      );
                    });

                  const handleSize = 12;
                  const handleY = baseline - handleSize / 2;

                  return (
                    <G key={`threshold-line-group-${line.id}-${datasetKey}`}>
                      <Line
                        x1={line.x}
                        y1={margins.top - 10} // Extend line slightly above counts
                        x2={line.x}
                        y2={baseline}
                        stroke={thresholdColor}
                        strokeWidth={2}
                      />
                      <GestureDetector gesture={lineDragGesture}>
                        <Rect // Draggable Handle
                          x={line.x - handleSize / 2}
                          y={handleY}
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
              {boxCreationMode && calculateAndRenderCountsInGaps()}

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
      </View>
    );
  };

  return (
    <Animated.View style={styles.wrapper}>
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
});

export { CholesterolLevelChart, defaultSettings };
export { defaultSettings as CholesterolLevelChartDefaultSettings };
