import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { View, Text, StyleSheet, Button, Switch, TextInput } from "react-native"; // Added TouchableOpacity
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated, { runOnJS } from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  // GestureHandlerRootView, // Not strictly needed here if used in parent
} from "react-native-gesture-handler";
import RNPickerSelect from "react-native-picker-select";

// Default settings with toggle options
const defaultSettings = {
  width: 300, // Width for each individual chart when stacked
  height: 100, // Base height, will adjust dynamically
  dataBefore: null,
  dataAfter: null,
  dotRadius: 4,
  thresholdColor: "blue",
  axisColor: "black",
  separatorColor: "purple", // For box plot separators
  margins: { top: 40, bottom: 40, left: 40, right: 20 }, // Increased bottom margin to 40
  enablePopup: false,
  xAxisStep: null,
  chartName: "Cholesterol Levels", // Updated default chart name
};

const ChartContent = ({
    datasetKey,
    chartData,
    dotColorProp,
    width,
    height,
    margins,
    dotRadius,
    axisColor,
    thresholdColor,
    xDomain,
    xAxisStep,
    groupMode,
    intervalWidth,
    showData,
    boxCreationMode,
    thresholdLines,
    onAddLine,
    onDragLine,
    onDragEnd,
    draggingLineId,
    chartName,
    isCombined,
    valueToolEnabled,
    valueToolLine,
    onValueToolDrag,
    onValueToolDragEnd,
    fixedGroupSize,
}) => {
    const svgWidth = width;
    const innerWidth = svgWidth - margins.left - margins.right;
    const horizontalPadding = 10;
    const chartRenderWidth = innerWidth - 2 * horizontalPadding;

    const dataValues = isCombined ? chartData.map(d => d.value) : chartData;
    const minData = Math.min(...dataValues);
    const maxData = Math.max(...dataValues);

    const xScale = useMemo(() =>
        scaleLinear()
            .domain(xDomain ? [xDomain.min, xDomain.max] : [minData, maxData])
            .range([0, chartRenderWidth]),
        [xDomain, chartRenderWidth, minData, maxData]
    );

    const guideLines = useMemo(() => {
        const sortedData = [...dataValues].sort((a, b) => a - b);
        let lines = [];
        switch (groupMode) {
            case 'median': {
                const { median } = getQuartiles(sortedData);
                lines = [xScale(median)];
                break;
            }
            case 'quartiles': {
                const { q1, median, q3 } = getQuartiles(sortedData);
                lines = [xScale(q1), xScale(median), xScale(q3)];
                break;
            }
            case 'fixed-interval': {
                if (intervalWidth > 0) {
                    const startValue = Math.floor(minData / intervalWidth) * intervalWidth;
                    for (let val = startValue; val <= maxData; val += intervalWidth) {
                        lines.push(xScale(val));
                    }
                }
                break;
            }
            case 'fixed-group-size': {
                if (fixedGroupSize > 0) {
                    const sortedForGroups = [...dataValues].sort((a, b) => a - b);
                    for (let i = fixedGroupSize; i < sortedForGroups.length; i += fixedGroupSize) {
                        const boundaryValue = (sortedForGroups[i - 1] + sortedForGroups[i]) / 2;
                        lines.push(xScale(boundaryValue));
                    }
                }
                break;
            }
            default: break;
        }
        return lines.map((x, index) => ({
            id: `guide-${datasetKey}-${groupMode}-${index}`,
            x,
            isDraggable: false,
        }));
    }, [groupMode, dataValues, xScale, intervalWidth, fixedGroupSize, minData, maxData, datasetKey]);

    const levelGap = dotRadius * 2 + 2;
    const scatterPlotData = useMemo(() => {
        const dataToProcess = isCombined ? chartData : chartData.map(value => ({ value }));
        return computeScatterData(dataToProcess, xScale, dotRadius);
    }, [chartData, isCombined, xScale, dotRadius]);

    const maxLevel = Math.max(1, ...scatterPlotData.map(d => d.level || 1));
    const requiredChartHeight = maxLevel * levelGap + margins.top + margins.bottom;
    const currentChartHeight = Math.max(height, requiredChartHeight);
    const baseline = currentChartHeight - margins.bottom;

    const tapGesture = Gesture.Tap().onEnd(event => {
        if (boxCreationMode) {
            const tapXInG = event.x - margins.left - horizontalPadding;
            const clampedTapX = Math.max(0, Math.min(tapXInG, chartRenderWidth));
            runOnJS(onAddLine)(clampedTapX, datasetKey);
        }
    });

    const allLines = [...guideLines, ...thresholdLines];

    const calculateAndRenderCountsInGaps = useMemo(() => {
        if (allLines.length === 0) return null;
        const sortedUniqueLineXs = [...new Set(allLines.map(l => l.x))].sort((a, b) => a - b);
        const allBoundariesX = [0, ...sortedUniqueLineXs, chartRenderWidth].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

        return allBoundariesX.slice(0, -1).map((startX, idx) => {
            const endX = allBoundariesX[idx + 1];
            if (startX >= endX) return null;
            const valueStart = xScale.invert(startX);
            const valueEnd = xScale.invert(endX);
            const isLastBucket = idx === allBoundariesX.length - 2;
            const count = dataValues.filter(v => v >= valueStart && (isLastBucket ? v <= valueEnd : v < valueEnd)).length;
            if (count > 0) {
                const midX = (startX + endX) / 2;
                return (
                    <SvgText key={`count-${datasetKey}-${idx}`} x={midX} y={margins.top - 15} fontSize={12} fill={axisColor} textAnchor="middle">
                        {count}
                    </SvgText>
                );
            }
            return null;
        }).filter(Boolean);
    }, [allLines, dataValues, xScale, chartRenderWidth, axisColor, margins.top, datasetKey]);

    const xAxisTicksData = useMemo(() => {
        const [domainMin, domainMax] = xScale.domain();
        if (!isFinite(domainMin) || !isFinite(domainMax)) return [];
        let ticks = [];
        if (xAxisStep) {
            for (let i = Math.ceil(domainMin / xAxisStep) * xAxisStep; i <= domainMax; i += xAxisStep) {
                ticks.push(i);
            }
        } else {
            ticks = xScale.ticks(5);
        }
        if (!ticks.some(t => Math.abs(t - domainMin) < 1e-9)) ticks.unshift(domainMin);
        if (!ticks.some(t => Math.abs(t - domainMax) < 1e-9)) ticks.push(domainMax);
        return [...new Set(ticks)].sort((a, b) => a - b);
    }, [xScale, xAxisStep]);

    const dragInitialXRef = useRef(0);

    return (
        <View style={styles.chartInstanceContainer} key={datasetKey}>
            <Text style={styles.chartInstanceName}>{chartName} - {isCombined ? "Combined" : (datasetKey === "before" ? "Before" : "After")}</Text>
            <GestureDetector gesture={tapGesture}>
                <Svg width={svgWidth} height={currentChartHeight + margins.top + 20}>
                    <G x={margins.left + horizontalPadding} y={margins.top}>
                        <Line x1={0} y1={baseline} x2={chartRenderWidth} y2={baseline} stroke={axisColor} strokeWidth={1} />
                        {xAxisTicksData.map((tick, i) => (
                            <G key={`tick-${datasetKey}-${i}`}>
                                <Line x1={xScale(tick)} y1={baseline} x2={xScale(tick)} y2={baseline + 5} stroke={axisColor} strokeWidth={1} />
                                <SvgText x={xScale(tick)} y={baseline + 15} fontSize={10} fill={axisColor} textAnchor="middle">{Number.isInteger(tick) ? tick : tick.toFixed(1)}</SvgText>
                            </G>
                        ))}
                        {calculateAndRenderCountsInGaps}
                        {showData && scatterPlotData.map((d, i) => (
                            <Circle
                                key={`dot-${datasetKey}-${i}`}
                                cx={xScale(d.value)}
                                cy={baseline - dotRadius - 2 - (d.level - 1) * levelGap}
                                r={dotRadius}
                                fill={isCombined ? (d.type === 'before' ? 'blue' : 'orange') : dotColorProp}
                            />
                        ))}
                        {allLines.map(line => {
                            const isDraggable = line.isDraggable;
                            const lineDragGesture = Gesture.Pan().activeOffsetX([0, 0]).onBegin(() => {
                                if (isDraggable) {
                                    runOnJS(onDragEnd)(line.id, 'start', line.x, datasetKey);
                                    dragInitialXRef.current = line.x;
                                }
                            }).onUpdate(event => {
                                if (isDraggable) {
                                    let newDragX = dragInitialXRef.current + event.translationX;
                                    newDragX = Math.max(0, Math.min(newDragX, chartRenderWidth));
                                    runOnJS(onDragLine)(line.id, newDragX, datasetKey);
                                }
                            }).onEnd(() => {
                                if (isDraggable) {
                                    runOnJS(onDragEnd)(line.id, 'end', undefined, datasetKey);
                                }
                            });
                            const handleSize = 12;
                            const handleY = baseline + 17;
                            return (
                                <G key={`line-group-${line.id}-${datasetKey}`}>
                                    <Line x1={line.x} y1={margins.top - 10} x2={line.x} y2={isDraggable ? handleY + handleSize : baseline} stroke={thresholdColor} strokeWidth={isDraggable ? 2 : 1.5} strokeDasharray={isDraggable ? undefined : "3,3"} />
                                    {isDraggable && (
                                        <GestureDetector gesture={lineDragGesture}>
                                            <Rect x={line.x - handleSize / 2} y={handleY} width={handleSize} height={handleSize} fill={draggingLineId === line.id ? "orange" : thresholdColor} stroke="black" strokeWidth={1} rx={2} ry={2} />
                                        </GestureDetector>
                                    )}
                                    <SvgText x={line.x + 4} y={margins.top - 2} fontSize={10} fill={thresholdColor} textAnchor="start">{xScale.invert(line.x).toFixed(1)}</SvgText>
                                </G>
                            );
                        })}
                        {valueToolEnabled && valueToolLine != null && (() => {
                            const vtDragGesture = Gesture.Pan().activeOffsetX([0, 0]).onBegin(() => {
                                runOnJS(onValueToolDragEnd)(datasetKey, 'start', valueToolLine);
                                dragInitialXRef.current = valueToolLine;
                            }).onUpdate(event => {
                                let newX = dragInitialXRef.current + event.translationX;
                                newX = Math.max(0, Math.min(newX, chartRenderWidth));
                                runOnJS(onValueToolDrag)(datasetKey, newX);
                            }).onEnd(() => {
                                runOnJS(onValueToolDragEnd)(datasetKey, 'end');
                            });
                            const handleSize = 12;
                            const handleY = baseline + 17;
                            return (
                                <G key={`value-tool-${datasetKey}`}>
                                    <Line x1={valueToolLine} y1={margins.top - 10} x2={valueToolLine} y2={handleY + handleSize} stroke="red" strokeWidth={2} />
                                    <SvgText x={valueToolLine} y={margins.top - 18} fontSize={10} fill="red" textAnchor="middle" fontWeight="bold">Value</SvgText>
                                    <GestureDetector gesture={vtDragGesture}>
                                        <Rect x={valueToolLine - handleSize / 2} y={handleY} width={handleSize} height={handleSize} fill="red" stroke="black" strokeWidth={1} rx={2} ry={2} />
                                    </GestureDetector>
                                    <SvgText x={valueToolLine + 4} y={margins.top - 2} fontSize={10} fill="red" textAnchor="start">{xScale.invert(valueToolLine).toFixed(1)}</SvgText>
                                </G>
                            );
                        })()}
                    </G>
                </Svg>
            </GestureDetector>
        </View>
    );
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
  const basicScatter = data.map((d) => {
    counts[d.value] = (counts[d.value] || 0) + 1;
    return { ...d, index: counts[d.value] };
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
    adjustedDots.push({ ...dot, level: level });
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

// Function to compute interval bins and counts (from DotHistogramView)
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
		  } else if (data.some((d) => d === maxData) && maxData === nextMin) {
			// handles if maxData is exactly at the start of a new bin
			bins.push({ valueMin: nextMin, valueMax: nextMax, count });
		  }
		}
	  }
	}
  
	return bins;
  };

function CholesterolLevelChart(settings) {
  const config = { ...defaultSettings, ...settings };
  const {
    width, // This is width for EACH chart
    height, // Base height for EACH chart
    data,
    dotRadius,
    thresholdColor,
    axisColor,
    separatorColor,
    margins,
    enablePopup,
    xAxisStep,
    chartName,
    xDomain,
	initialIntervalWidth,
  } = config;

  const initialDataBefore = data.before;
  const initialDataAfter = data.after;

  const [splitCharts, setSplitCharts] = useState(false);
  const [showData, setShowData] = useState(true);
  const [thresholdLines, setThresholdLines] = useState([]); // For combined mode
  const [thresholdLinesBefore, setThresholdLinesBefore] = useState([]); // For split mode - before chart
  const [thresholdLinesAfter, setThresholdLinesAfter] = useState([]); // For split mode - after chart
  const [draggingLineId, setDraggingLineId] = useState(null);
  const dragInitialXRef = useRef(0);
  const isDraggingRef = useRef(false); // Track if a drag operation is in progress

  // Consolidated grouping feature
  const [groupMode, setGroupMode] = useState("none"); // 'none', 'median', 'quartiles', 'fixed-interval', 'fixed-group-size', 'custom'
  const [intervalWidth, setIntervalWidth] = useState(initialIntervalWidth || 5);
  const [inputValue, setInputValue] = useState((initialIntervalWidth || 5).toString());
  const [fixedGroupSize, setFixedGroupSize] = useState(5);
  const [fixedGroupSizeInput, setFixedGroupSizeInput] = useState("5");

  // Value tool state
  const [valueToolEnabled, setValueToolEnabled] = useState(false);
  const [valueToolLinePos, setValueToolLinePos] = useState(null);
  const [valueToolLinePosBefore, setValueToolLinePosBefore] = useState(null);
  const [valueToolLinePosAfter, setValueToolLinePosAfter] = useState(null);

  const boxCreationMode = groupMode === 'custom';

  useEffect(() => {
    // Clear custom lines when group mode changes
    setThresholdLines([]);
    setThresholdLinesBefore([]);
    setThresholdLinesAfter([]);
  }, [groupMode]);


  const handleAddLine = useCallback(
    (tapXPosition, datasetKey) => {
        const newId = Date.now();
        const newLine = { id: newId, x: tapXPosition, isDraggable: true };
        const setter = datasetKey === 'before' ? setThresholdLinesBefore :
                       datasetKey === 'after' ? setThresholdLinesAfter :
                       setThresholdLines;
        setter((prevLines) => [...prevLines, newLine].sort((a, b) => a.x - b.x));
    },
    []
  );

  const handleDragLineUpdate = useCallback((lineId, newXPosition, datasetKey) => {
    const setter = datasetKey === 'before' ? setThresholdLinesBefore :
                   datasetKey === 'after' ? setThresholdLinesAfter :
                   setThresholdLines;
    setter((prevLines) =>
      prevLines.map((line) =>
        line.id === lineId ? { ...line, x: newXPosition } : line
      )
    );
  }, []);

  const handleDragEnd = useCallback((lineId, type, initialX, datasetKey) => {
      if (type === 'start') {
          setDraggingLineId(lineId);
      } else if (type === 'end') {
          setDraggingLineId(null);
          const setter = datasetKey === 'before' ? setThresholdLinesBefore :
                         datasetKey === 'after' ? setThresholdLinesAfter :
                         setThresholdLines;
          setter(prevLines => [...prevLines].sort((a, b) => a.x - b.x));
      }
  }, []);

  // Value tool drag handlers
  const handleValueToolDrag = useCallback((datasetKey, newX) => {
    if (datasetKey === 'before') setValueToolLinePosBefore(newX);
    else if (datasetKey === 'after') setValueToolLinePosAfter(newX);
    else setValueToolLinePos(newX);
  }, []);

  const handleValueToolDragEnd = useCallback((datasetKey, type, initialX) => {
    // No special action needed for value tool drag end
  }, []);

  const handleIntervalWidthChange = (text) => {
    setInputValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      setIntervalWidth(numValue);
    } else if (text === "") {
      setIntervalWidth(initialIntervalWidth || 5);
    }
  };

  const handleFixedGroupSizeChange = (text) => {
    setFixedGroupSizeInput(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setFixedGroupSize(numValue);
    }
  };

  const commonChartProps = {
      width,
      height,
      margins,
      dotRadius,
      axisColor,
      thresholdColor,
      xDomain,
      xAxisStep,
      groupMode,
      intervalWidth,
      showData,
      boxCreationMode,
      onAddLine: handleAddLine,
      onDragLine: handleDragLineUpdate,
      onDragEnd: handleDragEnd,
      draggingLineId,
      chartName,
      fixedGroupSize,
      valueToolEnabled,
      onValueToolDrag: handleValueToolDrag,
      onValueToolDragEnd: handleValueToolDragEnd,
  };

  return (
    <Animated.View style={styles.wrapper}>
      <View style={styles.chartsContainer}>
        {splitCharts ? (
          <>
            <ChartContent
                {...commonChartProps}
                datasetKey="before"
                chartData={initialDataBefore}
                dotColorProp="blue"
                isCombined={false}
                thresholdLines={thresholdLinesBefore}
                valueToolLine={valueToolLinePosBefore}
            />
            <ChartContent
                {...commonChartProps}
                datasetKey="after"
                chartData={initialDataAfter}
                dotColorProp="orange"
                isCombined={false}
                thresholdLines={thresholdLinesAfter}
                valueToolLine={valueToolLinePosAfter}
            />
          </>
        ) : (
          <ChartContent
              {...commonChartProps}
              datasetKey="combined"
              chartData={[
                  ...initialDataBefore.map(value => ({ value, type: 'before' })),
                  ...initialDataAfter.map(value => ({ value, type: 'after' }))
              ]}
              isCombined={true}
              thresholdLines={thresholdLines}
              valueToolLine={valueToolLinePos}
          />
        )}
      </View>

      <View style={styles.controlsContainerUnderChart}>
        <View style={styles.controlRow}>
            <Text style={styles.controlTextItem}>Groups:</Text>
            <RNPickerSelect
                onValueChange={(value) => {
                    if (value) {
                        setGroupMode(value);
                        if (value !== 'fixed-interval' && value !== 'fixed-group-size') {
                            setInputValue((initialIntervalWidth || 5).toString());
                            setIntervalWidth(initialIntervalWidth || 5);
                        }
                    }
                }}
                items={[
                    { label: 'None', value: 'none' },
                    { label: 'Two equal groups', value: 'median' },
                    { label: 'Four equal groups', value: 'quartiles' },
                    { label: 'Fixed Interval', value: 'fixed-interval' },
                    { label: 'Fixed group size', value: 'fixed-group-size' },
                    { label: 'Create your own groups', value: 'custom' },
                ]}
                style={pickerSelectStyles}
                value={groupMode}
                placeholder={{}}
            />
        </View>
        {groupMode === 'fixed-interval' && (
            <View style={styles.controlRow}>
                <Text style={styles.controlTextItem}>Interval width:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={inputValue}
                    onChangeText={handleIntervalWidthChange}
                />
            </View>
        )}
        {groupMode === 'fixed-group-size' && (
            <View style={styles.controlRow}>
                <Text style={styles.controlTextItem}>Elements per group:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={fixedGroupSizeInput}
                    onChangeText={handleFixedGroupSizeChange}
                />
            </View>
        )}
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Show Data: </Text>
          <Switch value={showData} onValueChange={setShowData} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Value tool: </Text>
          <Switch value={valueToolEnabled} onValueChange={(val) => {
            setValueToolEnabled(val);
            if (val) {
              const innerChartWidth = width - margins.left - margins.right - 20;
              const centerX = innerChartWidth / 2;
              setValueToolLinePos(centerX);
              setValueToolLinePosBefore(centerX);
              setValueToolLinePosAfter(centerX);
            }
          }} />
        </View>
        <View style={styles.controlRow}>
            <Text style={styles.controlTextItem}>Split Colors: </Text>
            <Switch value={splitCharts} onValueChange={setSplitCharts} />
        </View>
        <View style={styles.controlRow}>
          <Button
            title="Clear All Lines"
            onPress={() => {
              setThresholdLines([]);
              setThresholdLinesBefore([]);
              setThresholdLinesAfter([]);
              setGroupMode("none");
            }}
            disabled={thresholdLines.length === 0 && thresholdLinesBefore.length === 0 && thresholdLinesAfter.length === 0 && groupMode === 'none'}
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
  input: {
    borderWidth: 1,
    borderColor: "gray",
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 70,
    marginLeft: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30, // to ensure the text is never behind the icon
      backgroundColor: 'white',
      marginRight: 10,
    },
    inputAndroid: {
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30,
      backgroundColor: 'white',
      marginRight: 10,
    },
  });

export { CholesterolLevelChart, defaultSettings };
export { defaultSettings as CholesterolLevelChartDefaultSettings };
