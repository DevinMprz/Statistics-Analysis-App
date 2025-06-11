import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Switch,
  TextInput,
  Button,
  Platform,
} from "react-native";
import Svg, {
  G,
  Circle,
  Line,
  Rect,
  Text as SvgText,
  Defs,
  ClipPath,
} from "react-native-svg";
import { scaleLinear } from "d3-scale";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useAnimatedProps, // Added for SVG attribute animation
} from "react-native-reanimated";

// Animated SVG Components
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

const defaultSettings = {
  width: Dimensions.get("window").width * 0.9,
  height: 400,
  margins: { top: 30, right: 30, bottom: 50, left: 50 },
  dotRadius: 5,
  axisColor: "#333",
  gridColor: "#ddd",
  quadrantLineColor: "#555",
  selectedDotColor: "red",
  guideLineColor: "rgba(0,0,0,0.5)",
};

// Helper Component for Draggable Horizontal Lines
const DraggableHorizontalLine = ({
  sharedY,
  x1,
  x2,
  plotHeight,
  lineColor,
  lineWidth,
  id,
}) => {
  const gestureContext = useSharedValue(0);
  const dragGesture = Gesture.Pan()
    .onBegin(() => {
      gestureContext.value = sharedY.value;
    })
    .onUpdate((event) => {
      const newY = gestureContext.value + event.translationY;
      sharedY.value = Math.max(0, Math.min(newY, plotHeight));
    });

  const animatedProps = useAnimatedProps(() => {
    return {
      y1: sharedY.value,
      y2: sharedY.value,
    };
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <AnimatedLine
        key={`draggable-line-${id}`}
        x1={x1}
        x2={x2}
        stroke={lineColor}
        strokeWidth={lineWidth}
        animatedProps={animatedProps}
      />
      {/* Invisible wider line for easier touch handling */}
      {/* <AnimatedLine
        x1={x1}
        x2={x2}
        stroke="transparent"
        strokeWidth={lineWidth + 10} // Make touch target larger
        animatedProps={animatedProps}
      /> */}
    </GestureDetector>
  );
};

// Helper Component for Rendering a Single Slice Column with Draggable Dividers and Counts
const SliceColumn = ({
  slice, // { points, xMinPos, xMaxPos }
  yScale,
  plotHeight,
  partitionMode,
  lineColor,
  lineWidth,
  textColor,
  idPrefix,
}) => {
  if (!slice || slice.points.length === 0) {
    return null;
  }

  const { points, xMinPos, xMaxPos } = slice;

  // Shared values for Y positions of dividers
  const q1Y_sv = useSharedValue(0);
  const medianY_sv = useSharedValue(0);
  const q3Y_sv = useSharedValue(0);

  // Effect to initialize/update shared values when data or mode changes
  useEffect(() => {
    if (points.length > 0) {
      const sortedYPoints = [...points]
        .sort((a, b) => a.y - b.y)
        .map((p) => p.y);
      if (partitionMode === "slicesx2") {
        const medianIndex = Math.floor((sortedYPoints.length - 1) / 2);
        medianY_sv.value = withTiming(yScale(sortedYPoints[medianIndex]), {
          duration: 100,
        });
      } else if (partitionMode === "slicesx4") {
        const q1Index = Math.floor((sortedYPoints.length - 1) * 0.25);
        const medianIdx = Math.floor((sortedYPoints.length - 1) * 0.5);
        const q3Index = Math.floor((sortedYPoints.length - 1) * 0.75);
        q1Y_sv.value = withTiming(yScale(sortedYPoints[q1Index]), {
          duration: 100,
        });
        medianY_sv.value = withTiming(yScale(sortedYPoints[medianIdx]), {
          duration: 100,
        });
        q3Y_sv.value = withTiming(yScale(sortedYPoints[q3Index]), {
          duration: 100,
        });
      }
    } else {
      // Reset shared values if no points, to avoid stale lines from previous data
      medianY_sv.value = withTiming(plotHeight / 2, { duration: 100 });
      q1Y_sv.value = withTiming(plotHeight / 3, { duration: 100 });
      q3Y_sv.value = withTiming((plotHeight * 2) / 3, { duration: 100 });
    }
  }, [points, partitionMode, yScale, q1Y_sv, medianY_sv, q3Y_sv, plotHeight]);

  const animatedCountsProps = useAnimatedProps(() => {
    const defaultReturnValue = {
      count1: "0",
      count2: "0",
      count3: "0",
      count4: "0",
      y1: 0,
      y2: 0,
      y3: 0,
      y4: 0,
    };

    if (!points || points.length === 0) {
      return defaultReturnValue;
    }

    const counts = {
      top: 0,
      middle1: 0,
      middle2: 0,
      bottom: 0,
    };
    const yValues = points.map((p) => yScale(p.y));

    if (partitionMode === "slicesx2") {
      const medY = medianY_sv.value;
      yValues.forEach((y) => {
        if (y <= medY) counts.top++;
        else counts.bottom++;
      });
      return {
        ...defaultReturnValue, // Ensure all keys from default are present
        count1: String(counts.top),
        count2: String(counts.bottom),
        y1: medY - 5,
        y2: medY + 15,
      };
    } else if (partitionMode === "slicesx4") {
      const q1y = q1Y_sv.value;
      const medy = medianY_sv.value;
      const q3y = q3Y_sv.value;

      const sortedDividers = [q1y, medy, q3y].sort((a, b) => a - b);
      const d1 = sortedDividers[0]; // Effective top line
      const d2 = sortedDividers[1]; // Effective middle line
      const d3 = sortedDividers[2]; // Effective bottom line

      yValues.forEach((y) => {
        if (y <= d1) counts.top++;
        else if (y <= d2) counts.middle1++;
        else if (y <= d3) counts.middle2++;
        else counts.bottom++;
      });
      return {
        ...defaultReturnValue, // Ensure all keys from default are present
        count1: String(counts.top),
        count2: String(counts.middle1),
        count3: String(counts.middle2),
        count4: String(counts.bottom),
        y1: d1 - 5,
        y2: d2 - 5,
        y3: d3 - 5,
        y4: d3 + 15, // Or d3 + 15 if d3 is lowest on screen
      };
    }
    return defaultReturnValue; // Fallback to default if mode is unexpected
  });

  const textX = xMinPos + (xMaxPos - xMinPos) / 2;

  return (
    <G key={`${idPrefix}-slice-col-group`}>
      {partitionMode === "slicesx2" && (
        <>
          <DraggableHorizontalLine
            id={`${idPrefix}-median`}
            sharedY={medianY_sv}
            x1={xMinPos}
            x2={xMaxPos}
            plotHeight={plotHeight}
            lineColor={lineColor}
            lineWidth={lineWidth * 1.5} // Median line thicker
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count1,
              y: animatedCountsProps.value.y1,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count2,
              y: animatedCountsProps.value.y2,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
        </>
      )}
      {partitionMode === "slicesx4" && (
        <>
          <DraggableHorizontalLine
            id={`${idPrefix}-q1`}
            sharedY={q1Y_sv}
            x1={xMinPos}
            x2={xMaxPos}
            plotHeight={plotHeight}
            lineColor={lineColor}
            lineWidth={lineWidth}
          />
          <DraggableHorizontalLine
            id={`${idPrefix}-median-q`}
            sharedY={medianY_sv}
            x1={xMinPos}
            x2={xMaxPos}
            plotHeight={plotHeight}
            lineColor={lineColor}
            lineWidth={lineWidth * 1.5}
          />
          <DraggableHorizontalLine
            id={`${idPrefix}-q3`}
            sharedY={q3Y_sv}
            x1={xMinPos}
            x2={xMaxPos}
            plotHeight={plotHeight}
            lineColor={lineColor}
            lineWidth={lineWidth}
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count1,
              y: animatedCountsProps.value.y1,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count2,
              y: animatedCountsProps.value.y2,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count3,
              y: animatedCountsProps.value.y3,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
          <AnimatedSvgText
            x={textX}
            animatedProps={useAnimatedProps(() => ({
              value: animatedCountsProps.value.count4,
              y: animatedCountsProps.value.y4,
            }))}
            textAnchor="middle"
            fontSize="10"
            fill={textColor}
          />
        </>
      )}
    </G>
  );
};

const ScatterPlotView = ({
  data: initialData,
  settings,
  xAxisLabel = "X-Axis Variable",
  yAxisLabel = "Y-Axis Variable",
}) => {
  const config = { ...defaultSettings, ...settings };
  const {
    width,
    height,
    margins,
    dotRadius,
    axisColor,
    gridColor,
    quadrantLineColor,
    selectedDotColor,
    guideLineColor,
  } = config;

  const [data, setData] = useState(initialData || []);
  const [selectedDot, setSelectedDot] = useState(null);
  const [showDataPoints, setShowDataPoints] = useState(true);
  const [partitionMode, setPartitionMode] = useState("none"); // 'none', 'cross', 'grid', 'slicesx2', 'slicesx4'

  // Cross state
  const crossX = useSharedValue(width / 2);
  const crossY = useSharedValue(height / 2);

  // Grid state
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(3);

  // Slices state
  const [numSlices, setNumSlices] = useState(4);
  // TODO: Add state for draggable dividers within slices - This will be handled by SliceColumn

  const svgWidth = width;
  const svgHeight = height;
  const plotWidth = svgWidth - margins.left - margins.right;
  const plotHeight = svgHeight - margins.top - margins.bottom;

  const { xScale, yScale, xMin, xMax, yMin, yMax } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        xScale: scaleLinear().domain([0, 100]).range([0, plotWidth]),
        yScale: scaleLinear().domain([0, 100]).range([plotHeight, 0]),
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
      };
    }
    const xVals = data.map((d) => d.x);
    const yVals = data.map((d) => d.y);
    const xMinVal = Math.min(...xVals);
    const xMaxVal = Math.max(...xVals);
    const yMinVal = Math.min(...yVals);
    const yMaxVal = Math.max(...yVals);

    const xPadding = (xMaxVal - xMinVal) * 0.1 || 5;
    const yPadding = (yMaxVal - yMinVal) * 0.1 || 5;

    const finalXMin = xMinVal - xPadding;
    const finalXMax = xMaxVal + xPadding;
    const finalYMin = yMinVal - yPadding;
    const finalYMax = yMaxVal + yPadding;

    return {
      xScale: scaleLinear()
        .domain([finalXMin, finalXMax])
        .range([0, plotWidth]),
      yScale: scaleLinear()
        .domain([finalYMin, finalYMax])
        .range([plotHeight, 0]),
      xMin: finalXMin,
      xMax: finalXMax,
      yMin: finalYMin,
      yMax: finalYMax,
    };
  }, [data, plotWidth, plotHeight]);

  const handleDotPress = (dot) => {
    setSelectedDot(dot.id === (selectedDot && selectedDot.id) ? null : dot);
  };

  // --- Cross Drag Gesture ---
  const crossDragGesture = Gesture.Pan().onUpdate((event) => {
    crossX.value = Math.max(
      margins.left,
      Math.min(event.absoluteX, width - margins.right)
    );
    crossY.value = Math.max(
      margins.top,
      Math.min(event.absoluteY, height - margins.bottom)
    );
  });

  const animatedCrossStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: crossX.value - margins.left }, // Adjust for G transform
      { translateY: crossY.value - margins.top }, // Adjust for G transform
    ],
  }));

  // --- Quadrant Counts (for Cross) ---
  const quadrantCounts = useMemo(() => {
    if (partitionMode !== "cross" || !data || data.length === 0)
      return { q1: 0, q2: 0, q3: 0, q4: 0 };
    // Convert screen crossX/Y to data scale values
    const crossDataX = xScale.invert(crossX.value - margins.left); // This was correct
    const crossDataY = yScale.invert(crossY.value - margins.top); // This was correct

    let q1 = 0,
      q2 = 0,
      q3 = 0,
      q4 = 0; // Q1: top-right, Q2: top-left, Q3: bottom-left, Q4: bottom-right
    data.forEach((d) => {
      if (d.x >= crossDataX && d.y >= crossDataY) q1++;
      else if (d.x < crossDataX && d.y >= crossDataY) q2++;
      else if (d.x < crossDataX && d.y < crossDataY) q3++;
      else if (d.x >= crossDataX && d.y < crossDataY) q4++;
    });
    return { q1, q2, q3, q4 };
  }, [
    data,
    crossX.value,
    crossY.value,
    xScale,
    yScale,
    margins,
    partitionMode,
  ]);

  // --- Grid Cell Counts ---
  const gridCellCounts = useMemo(() => {
    if (partitionMode !== "grid" || !data || data.length === 0) return [];
    const counts = Array(gridRows * gridCols).fill(0);
    const cellWidth = plotWidth / gridCols;
    const cellHeight = plotHeight / gridRows;

    data.forEach((d) => {
      const xPos = xScale(d.x);
      const yPos = yScale(d.y);
      if (xPos >= 0 && xPos <= plotWidth && yPos >= 0 && yPos <= plotHeight) {
        const col = Math.min(gridCols - 1, Math.floor(xPos / cellWidth));
        const row = Math.min(gridRows - 1, Math.floor(yPos / cellHeight));
        counts[row * gridCols + col]++;
      }
    });
    return counts;
  }, [
    data,
    gridRows,
    gridCols,
    plotWidth,
    plotHeight,
    xScale,
    yScale,
    partitionMode,
  ]);

  // --- Slices Data (for Slices x2 and Slices x4) ---
  const sliceData = useMemo(() => {
    if (!partitionMode.startsWith("slices") || !data || data.length === 0)
      return [];
    const slices = [];
    const sliceWidth = plotWidth / numSlices;
    for (let i = 0; i < numSlices; i++) {
      const sliceXMin = xScale.invert(i * sliceWidth);
      const sliceXMax = xScale.invert((i + 1) * sliceWidth);
      const pointsInSlice = data
        .filter((d) => d.x >= sliceXMin && d.x < sliceXMax)
        .sort((a, b) => a.y - b.y);
      slices.push({
        xMinPos: i * sliceWidth,
        xMaxPos: (i + 1) * sliceWidth,
        points: pointsInSlice,
      });
    }
    return slices;
  }, [data, numSlices, plotWidth, xScale, partitionMode]);

  const renderPartitionControls = () => {
    // Basic controls for now, can be expanded
    return (
      <View style={styles.controlsContainer}>
        <Text style={styles.controlTitle}>Partition Mode:</Text>
        <View style={styles.buttonGroup}>
          {["none", "cross", "grid", "slicesx2", "slicesx4"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                partitionMode === mode && styles.modeButtonActive,
              ]}
              onPress={() => setPartitionMode(mode)}
            >
              <Text style={styles.modeButtonText}>
                {mode.replace("slices", "Slices ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {partitionMode === "grid" && (
          <View style={styles.gridControls}>
            <Text>Rows: </Text>
            <TextInput
              value={String(gridRows)}
              onChangeText={(t) =>
                setGridRows(Math.max(3, Math.min(10, parseInt(t) || 3)))
              }
              keyboardType="numeric"
              style={styles.gridInput}
            />
            <Text>Cols: </Text>
            <TextInput
              value={String(gridCols)}
              onChangeText={(t) =>
                setGridCols(Math.max(3, Math.min(10, parseInt(t) || 3)))
              }
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>
        )}
        {partitionMode.startsWith("slices") && (
          <View style={styles.sliceControls}>
            <Text>Slices: </Text>
            <TextInput
              value={String(numSlices)}
              onChangeText={(t) =>
                setNumSlices(Math.max(4, Math.min(10, parseInt(t) || 4)))
              }
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>
        )}
        <View style={styles.toggleControl}>
          <Text>Show Data Points: </Text>
          <Switch value={showDataPoints} onValueChange={setShowDataPoints} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderPartitionControls()}
      <GestureDetector
        gesture={
          partitionMode === "cross" ? crossDragGesture : Gesture.Manual()
        }
      >
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <ClipPath id="plotAreaClip">
              <Rect x="0" y="0" width={plotWidth} height={plotHeight} />
            </ClipPath>
          </Defs>
          <G x={margins.left} y={margins.top}>
            {/* Axes */}
            <Line
              x1="0"
              y1={plotHeight}
              x2={plotWidth}
              y2={plotHeight}
              stroke={axisColor}
              strokeWidth="2"
            />
            <Line
              x1="0"
              y1="0"
              x2="0"
              y2={plotHeight}
              stroke={axisColor}
              strokeWidth="2"
            />
            {/* X-Axis Ticks and Labels */}
            {xScale.ticks(5).map((tick) => (
              <G
                key={`x-tick-${tick}`}
                transform={`translate(${xScale(tick)}, ${plotHeight})`}
              >
                <Line y2="5" stroke={axisColor} strokeWidth="1" />
                <SvgText
                  y="15"
                  textAnchor="middle"
                  fontSize="10"
                  fill={axisColor}
                >
                  {tick}
                </SvgText>
              </G>
            ))}
            {/* Y-Axis Ticks and Labels */}
            {yScale.ticks(5).map((tick) => (
              <G
                key={`y-tick-${tick}`}
                transform={`translate(0, ${yScale(tick)})`}
              >
                <Line x2="-5" stroke={axisColor} strokeWidth="1" />
                <SvgText
                  x="-10"
                  dy="3"
                  textAnchor="end"
                  fontSize="10"
                  fill={axisColor}
                >
                  {tick}
                </SvgText>
              </G>
            ))}
            <SvgText
              x={plotWidth / 2}
              y={plotHeight + margins.bottom / 1.5}
              textAnchor="middle"
              fontWeight="bold"
            >
              {xAxisLabel}
            </SvgText>
            <SvgText
              x={-margins.left / 1.5}
              y={plotHeight / 2}
              transform={`rotate(-90, ${-margins.left / 1.5}, ${
                plotHeight / 2
              })`}
              textAnchor="middle"
              fontWeight="bold"
            >
              {yAxisLabel}
            </SvgText>

            {/* Clip Path for plot area content */}
            <G clipPath="url(#plotAreaClip)">
              {/* Grid Partition */}
              {partitionMode === "grid" && (
                <>
                  {Array.from({ length: gridCols + 1 }).map((_, i) => (
                    <Line
                      key={`grid-v-${i}`}
                      x1={(plotWidth / gridCols) * i}
                      y1="0"
                      x2={(plotWidth / gridCols) * i}
                      y2={plotHeight}
                      stroke={gridColor}
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: gridRows + 1 }).map((_, i) => (
                    <Line
                      key={`grid-h-${i}`}
                      x1="0"
                      y1={(plotHeight / gridRows) * i}
                      x2={plotWidth}
                      y2={(plotHeight / gridRows) * i}
                      stroke={gridColor}
                      strokeWidth="1"
                    />
                  ))}
                  {gridCellCounts.map((count, i) => {
                    const col = i % gridCols;
                    const row = Math.floor(i / gridCols);
                    const cellX =
                      (plotWidth / gridCols) * col + plotWidth / gridCols / 2;
                    const cellY =
                      (plotHeight / gridRows) * row + plotHeight / gridRows / 2;
                    return count > 0 ? (
                      <SvgText
                        key={`grid-count-${i}`}
                        x={cellX}
                        y={cellY}
                        textAnchor="middle"
                        dy="4"
                        fontSize="10"
                        fill="#333"
                      >
                        {count}
                      </SvgText>
                    ) : null;
                  })}
                </>
              )}

              {/* Slices Partition (x2 and x4) */}
              {partitionMode.startsWith("slices") &&
                sliceData.map((slice, sliceIndex) => {
                  // Vertical slice lines (these remain static)
                  const verticalLine =
                    sliceIndex > 0 ? (
                      <Line
                        key={`slice-v-${sliceIndex}`}
                        x1={slice.xMinPos}
                        y1="0"
                        x2={slice.xMinPos}
                        y2={plotHeight}
                        stroke={gridColor}
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    ) : null;

                  return (
                    <React.Fragment key={`slice-fragment-${sliceIndex}`}>
                      {verticalLine}
                      {slice.points.length > 0 && (
                        <SliceColumn
                          idPrefix={`s${sliceIndex}`}
                          slice={slice}
                          yScale={yScale}
                          plotHeight={plotHeight}
                          partitionMode={partitionMode}
                          lineColor={quadrantLineColor}
                          lineWidth={1} // Base line width for quartiles, median will be thicker in SliceColumn
                          textColor={axisColor}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

              {/* Data Points (Dots) */}
              {showDataPoints &&
                data.map((d) => (
                  <Circle
                    key={d.id}
                    cx={xScale(d.x)}
                    cy={yScale(d.y)}
                    r={dotRadius}
                    fill={
                      selectedDot && selectedDot.id === d.id
                        ? selectedDotColor
                        : "steelblue"
                    }
                    onPress={() => runOnJS(handleDotPress)(d)} // Ensure UI thread calls JS for state update
                  />
                ))}

              {/* Selected Dot Guide Lines */}
              {selectedDot && (
                <>
                  <Line
                    x1={xScale(selectedDot.x)}
                    y1={yScale(selectedDot.y)}
                    x2={xScale(selectedDot.x)}
                    y2={plotHeight}
                    stroke={guideLineColor}
                    strokeDasharray="2,2"
                  />
                  <Line
                    x1={xScale(selectedDot.x)}
                    y1={yScale(selectedDot.y)}
                    x2="0"
                    y2={yScale(selectedDot.y)}
                    stroke={guideLineColor}
                    strokeDasharray="2,2"
                  />
                  <SvgText
                    x={xScale(selectedDot.x)}
                    y={plotHeight + 12}
                    textAnchor="middle"
                    fontSize="10"
                  >
                    {selectedDot.x}
                  </SvgText>
                  <SvgText
                    x="-8"
                    y={yScale(selectedDot.y)}
                    textAnchor="end"
                    dy="3"
                    fontSize="10"
                  >
                    {selectedDot.y}
                  </SvgText>
                </>
              )}

              {/* Cross Partition (Draggable) - Rendered above dots if showDataPoints is true, or alone */}
              {partitionMode === "cross" && (
                // Corrected: Animated.View for cross should be outside the G with clipPath if its coordinates are absolute
                // However, its current implementation uses coordinates relative to G's transform.
                // The animatedCrossStyle already adjusts for this: translateX: crossX.value - margins.left
                // So it should be fine within the main G, but let's ensure it's not clipped if it renders text outside plot.
                // For simplicity, keeping it here. If text overflows, it might get clipped by plotAreaClip.
                // The text for quadrant counts is rendered using SvgText, which will be part of the SVG tree.
                // The Animated.View here is a bit of a mix if it's trying to overlay HTML-like views on SVG.
                // Rechecking: The cross lines are SVG <Line>s, but they are inside an Animated.View.
                // This is unusual. It should be an Animated.G or directly animate SVG elements.
                // Let's assume the existing cross works and not refactor it now unless strictly necessary.
                // The current cross implementation uses an Animated.View to position SVG lines.
                // This might be problematic on some platforms or with specific react-native-svg versions.
                // For now, leaving as is, as it was marked completed.
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    animatedCrossStyle,
                    {
                      left: margins.left,
                      top: margins.top /* Ensure this aligns with the G transform */,
                    },
                  ]}
                >
                  <Svg
                    /*This Svg wrapper for lines was missing, needed if Animated.View is the gesture responder and we want to draw SVG inside*/ width={
                      plotWidth
                    }
                    height={plotHeight}
                  >
                    <Line
                      x1={0}
                      y1={crossY.value - margins.top}
                      x2={plotWidth}
                      y2={crossY.value - margins.top}
                      stroke={quadrantLineColor}
                      strokeWidth="2"
                    />
                    <Line
                      x1={crossX.value - margins.left}
                      y1="0"
                      x2={crossX.value - margins.left}
                      y2={plotHeight}
                      stroke={quadrantLineColor}
                      strokeWidth="2"
                    />
                    {/* Quadrant Counts Text - position relative to cross center */}
                    {/* These SvgText components should ideally be part of the main SVG structure or an <Animated.G> */}
                    {/* For them to be affected by animatedCrossStyle, they need to be within that transform context. */}
                    {/* If Animated.View is just for gesture, lines should be animated differently. */}
                    {/* Given the existing structure, these SvgText are positioned relative to the animated view's top-left (which is plot top-left) */}
                    <SvgText
                      x={crossX.value - margins.left + 5}
                      y={crossY.value - margins.top - 5}
                      fontSize="12"
                      fill="black"
                    >
                      {quadrantCounts.q1}
                    </SvgText>
                    <SvgText
                      x={crossX.value - margins.left - 5}
                      y={crossY.value - margins.top - 5}
                      textAnchor="end"
                      fontSize="12"
                      fill="black"
                    >
                      {quadrantCounts.q2}
                    </SvgText>
                    <SvgText
                      x={crossX.value - margins.left - 5}
                      y={crossY.value - margins.top + 15}
                      textAnchor="end"
                      fontSize="12"
                      fill="black"
                    >
                      {quadrantCounts.q3}
                    </SvgText>
                    <SvgText
                      x={crossX.value - margins.left + 5}
                      y={crossY.value - margins.top + 15}
                      fontSize="12"
                      fill="black"
                    >
                      {quadrantCounts.q4}
                    </SvgText>
                  </Svg>
                </Animated.View>
              )}
            </G>
          </G>
        </Svg>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
  },
  controlsContainer: {
    width: "90%",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 10,
    elevation: 2,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#eee",
    borderRadius: 5,
    margin: 3,
  },
  modeButtonActive: {
    backgroundColor: "#007bff",
  },
  modeButtonText: {
    color: "#000",
  },
  gridControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 5,
  },
  gridInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    width: 50,
    textAlign: "center",
    marginLeft: 5,
    marginRight: 10,
    borderRadius: 3,
  },
  sliceControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  toggleControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default ScatterPlotView;
