import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { View, Text, StyleSheet, Button, Switch } from "react-native";
import Svg, { G, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { scaleLinear } from "d3-scale";
import Animated, { runOnJS } from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

const defaultSettings = {
  width: 300,
  height: 100,
  dataBefore: [],
  dataAfter: [],
  dotRadius: 4,
  thresholdColor: "red",
  axisColor: "black",
  separatorColor: "purple",
  margins: { top: 40, bottom: 40, left: 40, right: 20 },
  enablePopup: false,
  xAxisStep: null,
  chartName: "Chart",
  xDomain: { min: 0, max: 100 },
  isSplit: false,
};

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

const getQuartiles = (arr) => {
  if (!arr || arr.length === 0)
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const q1 = sorted[Math.floor(mid / 2)];
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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

export default function Minitool2Chart(settings) {
  const config = { ...defaultSettings, ...settings };
  const {
    width,
    height,
    dataBefore,
    dataAfter,
    dotRadius,
    thresholdColor,
    axisColor,
    separatorColor,
    margins,
    enablePopup,
    xAxisStep,
    chartName,
    xDomain,
    isSplit,
  } = config;
  const [showData, setShowData] = useState(true);
  const [boxCreationMode, setBoxCreationMode] = useState(false);
  const [thresholdLines, setThresholdLines] = useState([]);
  const [draggingLineId, setDraggingLineId] = useState(null);
  const dragInitialXRef = useRef(0);
  const [groupingType, setGroupingType] = useState("none");
  const [showGroupsAsStaticBoxes, setShowGroupsAsStaticBoxes] = useState(false);

  const getGlobalXScale = useCallback(() => {
    const svgChartWidth = width;
    const innerChartWidth = svgChartWidth - margins.left - margins.right;
    return scaleLinear()
      .domain(xDomain ? [xDomain.min, xDomain.max] : [0, 100])
      .range([0, innerChartWidth]);
  }, [xDomain, width, margins]);

  useEffect(() => {
    const currentXScale = getGlobalXScale();
    const [domainMin, domainMax] = currentXScale.domain();

    let manualLines = thresholdLines.filter((l) => l.isDraggable === true);
    let newLinesContent = [...manualLines];

    if (groupingType !== "none" && showGroupsAsStaticBoxes) {
      if (isFinite(domainMin) && isFinite(domainMax) && domainMin <= domainMax) {
        let guidesDataValues = [];
        if (groupingType === "median") {
          guidesDataValues = [
            domainMin,
            domainMin + 0.5 * (domainMax - domainMin),
            domainMax,
          ];
        } else if (groupingType === "quartiles") {
          guidesDataValues = [
            domainMin,
            domainMin + 0.25 * (domainMax - domainMin),
            domainMin + 0.5 * (domainMax - domainMin),
            domainMin + 0.75 * (domainMax - domainMin),
            domainMax,
          ];
        }
        const staticGuideLines = guidesDataValues.map((val, index) => ({
          id: `static-${groupingType}-${index}-${Date.now()}`,
          x: currentXScale(val),
          isDraggable: false,
        }));
        newLinesContent = [...manualLines, ...staticGuideLines];
      } else {
        newLinesContent = [...manualLines];
      }
    }
    setThresholdLines(newLinesContent.sort((a, b) => a.x - b.x));
  }, [groupingType, showGroupsAsStaticBoxes, getGlobalXScale]);

  const handleAddLineGlobal = useCallback(
    (tapXPosition) => {
      if (boxCreationMode) {
        const newId = Date.now();
        const newLine = { id: newId, x: tapXPosition, isDraggable: true };
        setThresholdLines((prevLines) => [...prevLines, newLine].sort((a, b) => a.x - b.x));
      }
    },
    [boxCreationMode]
  );

  const handleDragLineUpdateGlobal = useCallback((lineId, newXPosition) => {
    setThresholdLines((prevLines) =>
      prevLines.map((line) =>
        line.id === lineId ? { ...line, x: newXPosition } : line
      )
    );
  }, []);

  const renderChartInternal = (
    dataset,
    datasetKey,
    dotColorProp,
    isCombined = false
  ) => {
    const chartData = dataset;

    if (!chartData || chartData.length === 0) {
      return (
        <Text key={datasetKey}>
          No data for {datasetKey}
        </Text>
      );
    }

    const svgWidth = width;
    const innerWidth = svgWidth - margins.left - margins.right;

    const xScale = useMemo(
      () =>
        scaleLinear()
          .domain(xDomain ? [xDomain.min, xDomain.max] : [0, 100])
          .range([0, innerWidth]),
      [xDomain, innerWidth]
    );

    const levelGap = dotRadius * 2 + 2;
    const scatterPlotData = useMemo(() => {
      return computeScatterData(chartData, xScale, dotRadius);
    }, [chartData, xScale, dotRadius]);

    const maxLevel = Math.max(1, ...scatterPlotData.map((d) => d.level || 1));
    const minChartHeight = height;
    const requiredChartHeight = maxLevel * levelGap + margins.top + margins.bottom;
    const currentChartHeight = Math.max(minChartHeight, requiredChartHeight);
    const baseline = currentChartHeight - margins.bottom;

    if (innerWidth <= 0 || !isFinite(innerWidth) || baseline <= 0 || !isFinite(baseline)) {
      return <Text key={`${datasetKey}-loading`}>Calculating chart dimensions...</Text>;
    }

    const [hoveredDot, setHoveredDot] = useState(null);

    const tapGesture = Gesture.Tap().onEnd((event) => {
      const tapXInG = event.x - margins.left;
      const clampedTapX = Math.max(0, Math.min(tapXInG, innerWidth));
      runOnJS(handleAddLineGlobal)(clampedTapX);
    });

    const boxPlotSeparators = useMemo(() => {
      if (showGroupsAsStaticBoxes || groupingType === "none") return [];
      const stats = getQuartiles(chartData);
      if (groupingType === "median") return [stats.min, stats.median, stats.max];
      if (groupingType === "quartiles") return [stats.min, stats.q1, stats.median, stats.q3, stats.max];
      return [];
    }, [groupingType, showGroupsAsStaticBoxes, chartData]);

    const calculateAndRenderCountsInGaps = () => {
      if (thresholdLines.length === 0) return null;

      const sortedUniqueLineXs = [...new Set(thresholdLines.map((l) => l.x))].sort((a, b) => a - b);
      const allBoundariesX = [0, ...sortedUniqueLineXs, innerWidth].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

      return allBoundariesX.slice(0, -1).map((startX, idx) => {
        const endX = allBoundariesX[idx + 1];
        if (startX >= endX) return null;
        const valueStart = xScale.invert(startX);
        const valueEnd = xScale.invert(endX);
        const count = chartData.filter((v) => v >= valueStart && v < valueEnd).length;
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
    };

    const memoizedGapCounts = useMemo(() => calculateAndRenderCountsInGaps(), [thresholdLines, chartData, xScale, innerWidth, axisColor, margins.top, datasetKey]);

    const xAxisTicksData = useMemo(() => {
      const [domainMin, domainMax] = xScale.domain();
      let generatedTicks = [];
      const tolerance = 1e-9;
      if (!isFinite(domainMin) || !isFinite(domainMax) || domainMin > domainMax + tolerance) return [];
      const effectiveDomainMin = domainMin;
      const effectiveDomainMax = domainMax;
      if (Math.abs(effectiveDomainMin - effectiveDomainMax) < tolerance) return [effectiveDomainMin];

      if (xAxisStep !== null && xAxisStep > 0 && isFinite(xAxisStep)) {
        for (let i = 0; ; ++i) {
          const currentStep = Math.max(xAxisStep, tolerance);
          const tickValue = effectiveDomainMin + i * currentStep;
          if (tickValue > effectiveDomainMax + tolerance) break;
          generatedTicks.push(tickValue);
          if (i > Math.abs(effectiveDomainMax - effectiveDomainMin) / Math.max(currentStep, tolerance) + 2 && i > 200) break;
        }
      } else {
        if (effectiveDomainMin <= effectiveDomainMax) generatedTicks = xScale.ticks(5);
        else generatedTicks = [];
      }

      let finalTicks = [...generatedTicks];
      if (isFinite(effectiveDomainMin) && !finalTicks.some((t) => Math.abs(t - effectiveDomainMin) < tolerance)) finalTicks.push(effectiveDomainMin);
      if (isFinite(effectiveDomainMax) && !finalTicks.some((t) => Math.abs(t - effectiveDomainMax) < tolerance)) finalTicks.push(effectiveDomainMax);

      finalTicks = [...new Set(finalTicks)].filter((tick) => isFinite(tick) && tick >= effectiveDomainMin - tolerance && tick <= effectiveDomainMax + tolerance).sort((a, b) => a - b).map((tick) => {
        if (Math.abs(tick - effectiveDomainMin) < tolerance) return effectiveDomainMin;
        if (Math.abs(tick - effectiveDomainMax) < tolerance) return effectiveDomainMax;
        return tick;
      });

      if (finalTicks.length === 0 && isFinite(effectiveDomainMin) && isFinite(effectiveDomainMax) && effectiveDomainMin <= effectiveDomainMax) {
        return [...new Set([effectiveDomainMin, effectiveDomainMax])].sort((a, b) => a - b);
      }
      return finalTicks;
    }, [xScale, xAxisStep]);

    const renderDots = (data, color) => {
        const scatterData = computeScatterData(data, xScale, dotRadius);
        return scatterData.map((d, i) => (
            <Circle
                key={`dot-${color}-${i}`}
                cx={xScale(d.value)}
                cy={baseline - dotRadius - 2 - (d.level - 1) * levelGap}
                r={dotRadius}
                fill={color}
                onPress={enablePopup ? () => setHoveredDot(d) : undefined}
            />
        ));
    }

    return (
      <View style={styles.chartInstanceContainer} key={datasetKey}>
        <Text style={styles.chartInstanceName}>
          {chartName} - {isCombined ? "Combined" : (datasetKey === "before" ? "Before" : "After")}
        </Text>
        <GestureDetector gesture={tapGesture}>
          <Svg width={svgWidth} height={currentChartHeight + margins.top + 20}>
            <G x={margins.left} y={margins.top}>
              <Line x1={0} y1={baseline} x2={innerWidth} y2={baseline} stroke={axisColor} strokeWidth={1} />
              {xAxisTicksData.map((tick, i) => (
                <G key={`tick-${datasetKey}-${i}`}>
                  <Line x1={xScale(tick)} y1={baseline} x2={xScale(tick)} y2={baseline + 5} stroke={axisColor} strokeWidth={1} />
                  <SvgText x={xScale(tick)} y={baseline + 15} fontSize={10} fill={axisColor} textAnchor="middle">
                    {Math.round(tick)}
                  </SvgText>
                </G>
              ))}
              {memoizedGapCounts}
              {showData && (isCombined ? (
                  <>
                    {renderDots(dataBefore, "blue")}
                    {renderDots(dataAfter, "orange")}
                  </>
              ) : (
                renderDots(chartData, dotColorProp)
              ))}
              {enablePopup && hoveredDot && (
                <G>
                  <Rect x={xScale(hoveredDot.value) - 25} y={baseline - (hoveredDot.level - 1) * levelGap - 30} width={50} height={20} fill="rgba(0,0,0,0.7)" rx={5} ry={5} />
                  <SvgText x={xScale(hoveredDot.value)} y={baseline - (hoveredDot.level - 1) * levelGap - 16} fontSize={12} fill="white" textAnchor="middle">
                    {hoveredDot.value}
                  </SvgText>
                </G>
              )}
              {thresholdLines.map((line) => {
                const isStaticGuide = line.isDraggable === false;
                const isManualLine = line.isDraggable === true;
                const showThisStaticGuide = isStaticGuide && showGroupsAsStaticBoxes;
                const showThisManualLine = isManualLine && boxCreationMode;
                if (!showThisStaticGuide && !showThisManualLine) return null;

                const lineDragGesture = Gesture.Pan().activeOffsetX([0, 0]).onBegin(() => {
                  runOnJS(setDraggingLineId)(line.id);
                  dragInitialXRef.current = line.x;
                }).onUpdate((event) => {
                  let newDragX = dragInitialXRef.current + event.translationX;
                  newDragX = Math.max(0, Math.min(newDragX, innerWidth));
                  runOnJS(handleDragLineUpdateGlobal)(line.id, newDragX);
                }).onEnd(() => {
                  runOnJS(setDraggingLineId)(null);
                  runOnJS(setThresholdLines)((prevLines) => [...prevLines].sort((a, b) => a.x - b.x));
                });

                const handleSize = 12;
                const handleY = baseline + 17;
                let lineY2Value;
                let renderHandle = false;

                if (showThisStaticGuide) {
                  lineY2Value = baseline;
                  renderHandle = false;
                } else {
                  lineY2Value = handleY + handleSize;
                  renderHandle = true;
                }

                return (
                  <G key={`threshold-line-group-${line.id}-${datasetKey}`}>
                    <Line x1={line.x} y1={margins.top - 10} x2={line.x} y2={lineY2Value} stroke={thresholdColor} strokeWidth={2} />
                    {renderHandle && (
                      <GestureDetector gesture={lineDragGesture}>
                        <Rect x={line.x - handleSize / 2} y={handleY} width={handleSize} height={handleSize} fill={draggingLineId === line.id ? "orange" : thresholdColor} stroke="black" strokeWidth={1} rx={2} ry={2} />
                      </GestureDetector>
                    )}
                    <SvgText x={line.x + 4} y={margins.top - 2} fontSize={10} fill={thresholdColor} textAnchor="start">
                      {xScale.invert(line.x).toFixed(1)}
                    </SvgText>
                  </G>
                );
              })}
              {boxPlotSeparators.map((sepValue, i) => (
                <G key={`sep-${datasetKey}-${i}`}>
                  <Line x1={xScale(sepValue)} y1={margins.top - 10} x2={xScale(sepValue)} y2={baseline} stroke={separatorColor} strokeWidth={1.5} strokeDasharray="3,3" />
                  <SvgText x={xScale(sepValue)} y={margins.top - 15} fontSize={10} fill={separatorColor} textAnchor="middle">
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
      <View style={styles.chartsContainer}>
        {isSplit ? (
          <>
            {renderChartInternal(dataBefore, "before", "blue")}
            {renderChartInternal(dataAfter, "after", "orange")}
          </>
        ) : (
          renderChartInternal([...dataBefore, ...dataAfter], "combined", null, true)
        )}
      </View>

      <View style={styles.controlsContainerUnderChart}>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Show Data: </Text>
          <Switch value={showData} onValueChange={setShowData} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Create Boxes: </Text>
          <Switch value={boxCreationMode} onValueChange={setBoxCreationMode} />
        </View>
        <View style={styles.controlRow}>
          <Button title="Clear All Lines" onPress={() => {
            setThresholdLines([]);
            setGroupingType("none");
            setShowGroupsAsStaticBoxes(false);
          }} disabled={thresholdLines.length === 0} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Guides Type: </Text>
          <Button title="None" onPress={() => setGroupingType("none")} />
          <Button title="Median" onPress={() => setGroupingType("median")} />
          <Button title="Quartiles" onPress={() => setGroupingType("quartiles")} />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.controlTextItem}>Show Guides as Boxes: </Text>
          <Switch value={showGroupsAsStaticBoxes} onValueChange={setShowGroupsAsStaticBoxes} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 16,
    width: "100%",
  },
  chartsContainer: {
    flexDirection: "column",
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
  },
  controlsContainerUnderChart: {
    width: "95%",
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
    marginRight: 8,
  },
  popupText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
});
