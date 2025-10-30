import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Platform,
  ScrollView,
  StatusBar,
  Modal,
  Button,
  Dimensions,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  clamp,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect, Circle, Line, G, Text as SvgText } from "react-native-svg";
import initialBatteryData from "../../data/batteryScenario_set.json";
import BatteryBar from "./minitool_one_components/BatteryBar";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Configuration ---
const MIN_BATTERY_COUNT_VALUE = 1;
const MAX_BATTERY_COUNT_VALUE = 10;
const MAX_BAR_COUNT = 20;
const MAX_LIFESPAN = 130;
const MIN_LIFESPAN = 1;
const TOUGH_CELL_COLOR = "#33cc33";
const ALWAYS_READY_COLOR = "#cc00ff";
const AXIS_COLOR = "#333";
const TOOL_COLOR = "red";

const RANGE_TOOL_COLOR = "#0000FF";
const RANGE_HANDLE_SIZE = 15;

// --- Chart Layout Constants ---
const PLATFORM = Platform.OS;
const MOBILE_TICKS = 6;
const WEB_TICKS = 10;
const MOBILE_VALUE_STEP = 26;
const WEB_VALUE_STEP = 14;
const PADDING = 0;
const Y_AXIS_WIDTH = 30;
const BAR_HEIGHT = 8;
const BAR_SPACING = 7;
const X_AXIS_HEIGHT = 20;
const TOOL_LABEL_OFFSET_Y = 25;
const RANGE_LABEL_OFFSET_Y = 15;
const TOP_BUFFER = RANGE_LABEL_OFFSET_Y + 10;

const { width, height } = Dimensions.get("window");

const Minitool_1 = () => {
  const [currentBatteryData, setCurrentBatteryData] =
    useState(initialBatteryData);
  const [displayedData, setDisplayedData] = useState(initialBatteryData);
  const [isSortedBySize, setIsSortedBySize] = useState(false);
  const [isSortedByColor, setIsSortedByColor] = useState(false);
  const [toolValue, setToolValue] = useState(80.0);
  const [rangeCount, setRangeCount] = useState(0);

  const [valueToolActive, setValueToolActive] = useState(false);
  const [rangeToolActive, setRangeToolActive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [minLifespanInput, setMinLifespanInput] = useState("40");
  const [maxLifespanInput, setMaxLifespanInput] = useState("120");
  const [toughCellCountInput, setToughCellCountInput] = useState("10");
  const [alwaysReadyCountInput, setAlwaysReadyCountInput] = useState("10");
  const [isAddBarModalVisible, setIsAddBarModalVisible] = useState(false);
  const [newBarLifespan, setNewBarLifespan] = useState("100");
  const [newBarBrand, setNewBarBrand] = useState("Tough Cell");
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  const chartHeight = 20 * (BAR_HEIGHT + BAR_SPACING);
  const SVG_HEIGHT = chartHeight + X_AXIS_HEIGHT + TOP_BUFFER;
  const SVG_WIDTH = width - PADDING * 2;
  const chartWidth =
    SVG_WIDTH - Y_AXIS_WIDTH > 0 ? SVG_WIDTH - Y_AXIS_WIDTH : 1;

  // --- Value Tool Gesture Logic ---
  const initialTranslateX = (80.0 / MAX_LIFESPAN) * chartWidth;
  const translateX = useSharedValue(initialTranslateX);
  const context = useSharedValue({ x: 0 });
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = clamp(
        event.translationX + context.value.x,
        0,
        chartWidth
      );
    });

  // --- Range Tool Gesture Logic ---
  const initialRangeStartX = (102 / MAX_LIFESPAN) * chartWidth;
  const initialRangeEndX = (126 / MAX_LIFESPAN) * chartWidth;
  const rangeStartX = useSharedValue(initialRangeStartX);
  const rangeEndX = useSharedValue(initialRangeEndX);
  const rangeContext = useSharedValue({ start: 0, end: 0 });

  const movePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      const rangeWidth = rangeContext.value.end - rangeContext.value.start;
      const newStart = clamp(
        rangeContext.value.start + event.translationX,
        0,
        chartWidth - rangeWidth
      );
      rangeStartX.value = newStart;
      rangeEndX.value = newStart + rangeWidth;
    });

  const leftHandlePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      rangeStartX.value = clamp(
        rangeContext.value.start + event.translationX,
        0,
        rangeEndX.value - RANGE_HANDLE_SIZE
      );
    });

  const rightHandlePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      rangeEndX.value = clamp(
        rangeContext.value.end + event.translationX,
        rangeStartX.value + RANGE_HANDLE_SIZE,
        chartWidth
      );
    });

  // --- Animated Props for lines of the tools ---
  const animatedToolProps = useAnimatedProps(() => ({
    x: translateX.value - 7.5,
  }));
  const animatedValueLineProps = useAnimatedProps(() => ({
    x1: translateX.value,
    x2: translateX.value,
  }));
  const animatedRangeRectProps = useAnimatedProps(() => ({
    x: rangeStartX.value,
    width: rangeEndX.value - rangeStartX.value,
  }));
  const animatedRangeLeftLineProps = useAnimatedProps(() => ({
    x1: rangeStartX.value,
    x2: rangeStartX.value,
  }));
  const animatedRangeRightLineProps = useAnimatedProps(() => ({
    x1: rangeEndX.value,
    x2: rangeEndX.value,
  }));
  const animatedLeftHandleProps = useAnimatedProps(() => ({
    x: rangeStartX.value - RANGE_HANDLE_SIZE / 2,
  }));
  const animatedRightHandleProps = useAnimatedProps(() => ({
    x: rangeEndX.value - RANGE_HANDLE_SIZE / 2,
  }));
  const animatedMoveHandleProps = useAnimatedProps(() => ({
    x: rangeStartX.value,
    width: Math.abs(rangeStartX.value - rangeEndX.value),
  }));

  // --- Animations for the labels ---
  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: withTiming(valueToolActive ? 1 : 0),
  }));

  const animatedRangeLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (rangeStartX.value + rangeEndX.value) / 2 }],
    opacity: withTiming(rangeToolActive ? 1 : 0),
  }));

  // --- Animations for disappearing and appearing tools ---
  const valueToolContainerAnimatedProps = useAnimatedProps(() => {
    return { opacity: withTiming(valueToolActive ? 1 : 0) };
  });

  const rangeToolContainerAnimatedProps = useAnimatedProps(() => {
    return { opacity: withTiming(rangeToolActive ? 1 : 0) };
  });

  // --- Function to handle value tool ---
  useAnimatedReaction(
    () => translateX.value,
    (currentValue) =>
      runOnJS(setToolValue)((currentValue / chartWidth) * MAX_LIFESPAN),
    [chartWidth]
  );
  // --- Function to handle range tool ---
  useAnimatedReaction(
    () => ({ start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange, previousRange) => {
      if (
        currentRange.start !== previousRange?.start ||
        currentRange.end !== previousRange?.end
      ) {
        const minLifespan = (currentRange.start / chartWidth) * MAX_LIFESPAN;
        const maxLifespan = (currentRange.end / chartWidth) * MAX_LIFESPAN;
        const count = displayedData.filter(
          (item) => item.lifespan >= minLifespan && item.lifespan <= maxLifespan
        ).length;
        runOnJS(setRangeCount)(count);
      }
    },
    [chartWidth, displayedData]
  );

  // --- Sorting handlers ---
  useEffect(() => {
    let dataToDisplay = [...currentBatteryData];
    if (isSortedBySize) {
      dataToDisplay.sort((a, b) => a.lifespan - b.lifespan);
    } else if (isSortedByColor) {
      dataToDisplay.sort((a, b) => a.brand.localeCompare(b.brand));
    }
    setDisplayedData(dataToDisplay);
  }, [currentBatteryData, isSortedBySize, isSortedByColor]);

  const handleSortBySize = (isActive) => {
    setIsSortedBySize(isActive);
    if (isActive) {
      setIsSortedByColor(false);
    }
  };

  const handleSortByColor = (isActive) => {
    setIsSortedByColor(isActive);
    if (isActive) {
      setIsSortedBySize(false);
    }
  };

  // --- Simplified toggle handlers ---
  const handleValueTool = (isActive) => {
    setValueToolActive(isActive);
  };
  const handleRangeTool = (isActive) => {
    setRangeToolActive(isActive);
  };

  // --- Handlers for Modal(Pop up window which allows to generate random data) ---
  const handleGenerateDataButton = () => {
    setRangeToolActive(false);
    setValueToolActive(false);
    setIsModalVisible(true);
  };

  const handleGenerateData = () => {
    translateX.value = initialTranslateX;
    rangeStartX.value = initialRangeStartX;
    rangeEndX.value = initialRangeEndX;
    const min = parseInt(minLifespanInput, 10);
    const max = parseInt(maxLifespanInput, 10);
    const toughCellCount = parseInt(toughCellCountInput, 10);
    const alwaysReadyCount = parseInt(alwaysReadyCountInput, 10);

    if (
      isNaN(min) ||
      isNaN(max) ||
      isNaN(toughCellCount) ||
      isNaN(alwaysReadyCount) ||
      min >= max ||
      min < 0 ||
      toughCellCount < 0 ||
      alwaysReadyCount < 0 ||
      max > MAX_LIFESPAN
    ) {
      if (Platform.OS === "web") {
        alert(
          `Invalid Input. Please check your values. Min Lifespan must be less than Max Lifespan, Max Lifespan must be less than ${MAX_LIFESPAN} `
        );
      } else {
        Alert.alert(
          "Invalid Input",
          `Please check your values. Min Lifespan must be less than Max Lifespan, Max Lifespan must be less than ${MAX_LIFESPAN}`
        );
      }
      return;
    }
    if (
      toughCellCount < MIN_BATTERY_COUNT_VALUE ||
      toughCellCount > MAX_BATTERY_COUNT_VALUE
    ) {
      if (Platform.OS === "web") {
        alert(
          `Invalid Input. Please check your values. The number of batteries of the company ToughCell must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`
        );
      } else {
        Alert.alert(
          "Invalid Input",
          `Please check your values. The number of batteries of the company ToughCell must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`
        );
      }
      return;
    }

    if (
      alwaysReadyCount < MIN_BATTERY_COUNT_VALUE ||
      alwaysReadyCount > MAX_BATTERY_COUNT_VALUE
    ) {
      if (Platform.OS == "web") {
        alert(
          `Invalid Input. Please check your values. The number of batteries of the company AlwaysReady must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`
        );
      } else {
        Alert.alert(
          "Invalid Input",
          `Please check your values. The number of batteries of the company AlwaysReady must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`
        );
      }
      return;
    }

    const newData = [];
    const getRandomLifespan = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 0; i < toughCellCount; i++) {
      newData.push({
        brand: "Tough Cell",
        lifespan: getRandomLifespan(min, max),
      });
    }
    for (let i = 0; i < alwaysReadyCount; i++) {
      newData.push({
        brand: "Always Ready",
        lifespan: getRandomLifespan(min, max),
      });
    }

    setCurrentBatteryData(newData);
    setIsSortedByColor(false);
    setIsSortedBySize(false);
    setIsModalVisible(false);
  };

  const handleCancelbutton = () => {
    translateX.value = initialTranslateX;
    rangeStartX.value = initialRangeStartX;
    rangeEndX.value = initialRangeEndX;
    setIsModalVisible(false);
  };

  // --- Reset data to the initial one(which was diaplayed first) ---
  const handleResetData = () => {
    setCurrentBatteryData(initialBatteryData);
    setIsSortedByColor(false);
    setIsSortedBySize(false);
  };

  // --- Handlers for Adding/Removing single bars ---
  const handleAddBarButtonPress = () => {
    translateX.value = initialTranslateX;
    rangeStartX.value = initialRangeStartX;
    rangeEndX.value = initialRangeEndX;
    setRangeToolActive(false);
    setValueToolActive(false);
    if (currentBatteryData.length >= MAX_BAR_COUNT) {
      Alert.alert(
        "Limit Reached",
        `You cannot add more than ${MAX_BAR_COUNT} batteries.`
      );
      return;
    }
    setNewBarLifespan("100");
    setNewBarBrand("Tough Cell");
    setIsAddBarModalVisible(true);
  };

  const handleRemoveLastBar = () => {
    if (currentBatteryData.length === 0) {
      Alert.alert("Empty Chart", "There are no batteries to remove.");
      return;
    }
    const newData = currentBatteryData.slice(0, -1);
    setCurrentBatteryData(newData);
  };

  const handleConfirmAddBar = () => {
    const lifespan = parseInt(newBarLifespan, 10);
    if (isNaN(lifespan) || lifespan < MIN_LIFESPAN || lifespan > MAX_LIFESPAN) {
      Alert.alert(
        "Invalid Lifespan",
        `Please enter a number between ${MIN_LIFESPAN} and ${MAX_LIFESPAN}.`
      );
      return;
    }

    const newBar = {
      brand: newBarBrand,
      lifespan: lifespan,
    };

    setCurrentBatteryData([...currentBatteryData, newBar]);
    setIsAddBarModalVisible(false);
  };

  const handleCancelAddBar = () => {
    setIsAddBarModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Battery Lifespan Comparison</Text>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColorBox,
                { backgroundColor: TOUGH_CELL_COLOR },
              ]}
            />
            <Text>Tough Cell</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColorBox,
                { backgroundColor: ALWAYS_READY_COLOR },
              ]}
            />
            <Text>Always Ready</Text>
          </View>
        </View>

        {/* --- Collapsible Help Section --- */}
        <View style={styles.collapsibleContainer}>
          <TouchableOpacity
            onPress={() => setIsHelpVisible(!isHelpVisible)}
            style={styles.collapsibleHeader}
          >
            <Text style={styles.collapsibleHeaderText}>
              {isHelpVisible ? "▼" : "►"} About This Battery Chart
            </Text>
          </TouchableOpacity>
          {isHelpVisible && (
            <View style={styles.collapsibleContent}>
              <Text style={[styles.helpSectionTitle, { marginTop: 0 }]}>
                What is this?
              </Text>
              <Text style={styles.helpText}>
                This chart displays the lifespans, in hours, for batteries from
                two different brands: Tough Cell{" "}
                <Text style={{ color: "#33cc33", fontSize: 15 }}>■</Text> and
                Always Ready{" "}
                <Text style={{ color: "#cc00ff", fontSize: 15 }}>■</Text>.
              </Text>

              <Text style={styles.helpSectionTitle}>Why is it useful?</Text>
              <Text style={styles.helpText}>
                Comparing the two sets of data helps to visually determine if
                one brand generally offers a longer lifespan than the other. You
                can see how the lifespans are distributed and identify outliers.
              </Text>

              <Text style={styles.helpSectionTitle}>What can you do?</Text>
              <View style={styles.helpList}>
                <Text style={styles.helpListItem}>
                  - Toggle the switches to{" "}
                  <Text style={styles.helpTextBold}>Sort</Text> the batteries by
                  lifespan (size) or by brand (color).
                </Text>
                <Text style={styles.helpListItem}>
                  - Enable the{" "}
                  <Text style={styles.helpTextBold}>'Value tool'</Text> and drag
                  the red line to see the exact lifespan value at any point.
                </Text>
                <Text style={styles.helpListItem}>
                  - Enable the{" "}
                  <Text style={styles.helpTextBold}>'Range tool'</Text> to
                  select a specific lifespan range. Drag the handles to resize
                  the range or drag the middle to move it. The count of
                  batteries within the range appears at the top.
                </Text>
                <Text style={styles.helpListItem}>
                  - Use the buttons at the bottom to{" "}
                  <Text style={styles.helpTextBold}>Add</Text> a new battery,{" "}
                  <Text style={styles.helpTextBold}>Remove</Text> the last one,
                  or <Text style={styles.helpTextBold}>Generate</Text> a whole
                  new set of random data.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* --- Sorting controllers --- */}
        <View style={styles.controlsContainer}>
          <View style={styles.switchControl}>
            <Text>Sort by Color</Text>
            <Switch value={isSortedByColor} onValueChange={handleSortByColor} />
          </View>
          <View style={styles.switchControl}>
            <Text>Sort by Size</Text>
            <Switch value={isSortedBySize} onValueChange={handleSortBySize} />
          </View>
        </View>

        {/* Bar chart with tools*/}
        {!isModalVisible && !isAddBarModalVisible && (
          <View style={[styles.chartContainer, { height: SVG_HEIGHT }]}>
            {/* --- Render the label of value tool --- */}
            <Animated.View
              style={[
                styles.toolLabelContainer,
                { left: Y_AXIS_WIDTH, top: TOP_BUFFER },
                animatedLabelStyle,
              ]}
            >
              <Text style={styles.toolLabelText}>{toolValue.toFixed(1)}</Text>
            </Animated.View>

            {/* --- Render the label of range tool --- */}
            <Animated.View
              style={[styles.rangeLabelContainer, animatedRangeLabelStyle]}
            >
              <Text style={styles.rangeLabelText}>count: {rangeCount}</Text>
            </Animated.View>

            {/* --- Whole bar chart */}
            <Svg
              width={SVG_WIDTH - Y_AXIS_WIDTH}
              height={SVG_HEIGHT}
              style={{ zIndex: 1 }}
            >
              <G x={Y_AXIS_WIDTH} y={TOP_BUFFER}>
                {/* X-Axis */}
                <Line
                  x1="0"
                  y1={chartHeight}
                  x2={chartWidth}
                  y2={chartHeight}
                  stroke={AXIS_COLOR}
                  strokeWidth="1"
                />
                {Array.from({
                  length: PLATFORM === "web" ? WEB_TICKS : MOBILE_TICKS,
                }).map((_, i) => {
                  const val =
                    i *
                    (PLATFORM === "web" ? WEB_VALUE_STEP : MOBILE_VALUE_STEP);
                  const xPos = (val / MAX_LIFESPAN) * chartWidth;
                  return (
                    <SvgText
                      key={`label-${i}`}
                      x={xPos}
                      y={chartHeight + 15}
                      fill={AXIS_COLOR}
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {val}
                    </SvgText>
                  );
                })}

                {/* Data Bars */}
                {displayedData.map((item, index) => (
                  <BatteryBar
                    key={`bar-${index}-${item.lifespan}`}
                    item={item}
                    index={index}
                    chartWidth={chartWidth}
                    rangeStartX={rangeStartX}
                    rangeEndX={rangeEndX}
                    tool={rangeToolActive}
                  />
                ))}

                {/* --- Range tool (3 Line, 3 ractangles ) --- */}
                <AnimatedG animatedProps={rangeToolContainerAnimatedProps}>
                  <AnimatedRect
                    y="0"
                    height={chartHeight}
                    fill={RANGE_TOOL_COLOR}
                    opacity="0.2"
                    animatedProps={animatedRangeRectProps}
                  />
                  <AnimatedLine
                    y1="0"
                    y2={chartHeight}
                    stroke={RANGE_TOOL_COLOR}
                    strokeWidth="2"
                    animatedProps={animatedRangeLeftLineProps}
                  />
                  <AnimatedLine
                    y1="0"
                    y2={chartHeight}
                    stroke={RANGE_TOOL_COLOR}
                    strokeWidth="2"
                    animatedProps={animatedRangeRightLineProps}
                  />

                  {/* --- Rectangles - gesture handlers --- */}
                  {Platform.OS === 'web' && rangeToolActive ? (
                    <>
                      <AnimatedRect
                        y={chartHeight}
                        width={RANGE_HANDLE_SIZE}
                        height={RANGE_HANDLE_SIZE}
                        fill={RANGE_TOOL_COLOR}
                        animatedProps={animatedLeftHandleProps}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.nativeEvent.pageX;
                          const initialStart = rangeStartX.value;
                          
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.pageX - startX;
                            rangeStartX.value = clamp(
                              initialStart + deltaX,
                              0,
                              rangeEndX.value - RANGE_HANDLE_SIZE
                            );
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                      <AnimatedRect
                        y={chartHeight}
                        width={RANGE_HANDLE_SIZE}
                        height={RANGE_HANDLE_SIZE}
                        fill={RANGE_TOOL_COLOR}
                        animatedProps={animatedRightHandleProps}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.nativeEvent.pageX;
                          const initialEnd = rangeEndX.value;
                          
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.pageX - startX;
                            rangeEndX.value = clamp(
                              initialEnd + deltaX,
                              rangeStartX.value + RANGE_HANDLE_SIZE,
                              chartWidth
                            );
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                      <AnimatedRect
                        y="0"
                        height={chartHeight}
                        fill="transparent"
                        animatedProps={animatedMoveHandleProps}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.nativeEvent.pageX;
                          const initialStart = rangeStartX.value;
                          const initialEnd = rangeEndX.value;
                          const rangeWidth = initialEnd - initialStart;
                          
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.pageX - startX;
                            const newStart = clamp(
                              initialStart + deltaX,
                              0,
                              chartWidth - rangeWidth
                            );
                            rangeStartX.value = newStart;
                            rangeEndX.value = newStart + rangeWidth;
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <GestureDetector
                        gesture={leftHandlePanGesture}
                        enabled={rangeToolActive}
                      >
                        <AnimatedRect
                          y={chartHeight}
                          width={RANGE_HANDLE_SIZE}
                          height={RANGE_HANDLE_SIZE}
                          fill={RANGE_TOOL_COLOR}
                          animatedProps={animatedLeftHandleProps}
                        />
                      </GestureDetector>
                      <GestureDetector
                        gesture={rightHandlePanGesture}
                        enabled={rangeToolActive}
                      >
                        <AnimatedRect
                          y={chartHeight}
                          width={RANGE_HANDLE_SIZE}
                          height={RANGE_HANDLE_SIZE}
                          fill={RANGE_TOOL_COLOR}
                          animatedProps={animatedRightHandleProps}
                        />
                      </GestureDetector>
                      <GestureDetector
                        gesture={movePanGesture}
                        enabled={rangeToolActive}
                      >
                        <AnimatedRect
                          y="0"
                          height={chartHeight}
                          fill="transparent"
                          animatedProps={animatedMoveHandleProps}
                        />
                      </GestureDetector>
                    </>
                  )}
                </AnimatedG>

                {/* --- Value tool(1 line, 1 rectangle) --- */}
                <AnimatedG animatedProps={valueToolContainerAnimatedProps}>
                  <AnimatedLine
                    y1={-5}
                    y2={chartHeight}
                    stroke={TOOL_COLOR}
                    strokeWidth="2"
                    animatedProps={animatedValueLineProps}
                  />
                  {Platform.OS === 'web' && valueToolActive ? (
                    <AnimatedRect
                      y={chartHeight}
                      height="15"
                      width="15"
                      fill={TOOL_COLOR}
                      animatedProps={animatedToolProps}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.nativeEvent.pageX;
                        const initialTranslate = translateX.value;
                        
                        const handleMouseMove = (moveEvent) => {
                          const deltaX = moveEvent.pageX - startX;
                          translateX.value = clamp(
                            initialTranslate + deltaX,
                            0,
                            chartWidth
                          );
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  ) : (
                    <GestureDetector
                      gesture={panGesture}
                      enabled={valueToolActive}
                    >
                      <AnimatedRect
                        y={chartHeight}
                        height="15"
                        width="15"
                        fill={TOOL_COLOR}
                        animatedProps={animatedToolProps}
                      />
                    </GestureDetector>
                  )}
                </AnimatedG>
              </G>
              {/* Y-Axis */}
              <Line
                x1={Y_AXIS_WIDTH}
                y1={TOP_BUFFER}
                x2={Y_AXIS_WIDTH}
                y2={chartHeight + TOP_BUFFER}
                stroke={AXIS_COLOR}
                strokeWidth="1"
              />
            </Svg>
          </View>
        )}
        <Text style={styles.xAxisTitle}>Life Span (hours)</Text>

        {/* --- Toogle controllers --- */}
        <View style={styles.controlsContainer}>
          <View style={styles.switchControl}>
            <Text>Value tool</Text>
            <Switch value={valueToolActive} onValueChange={handleValueTool} />
          </View>
          <View style={styles.switchControl}>
            <Text>Range tool</Text>
            <Switch value={rangeToolActive} onValueChange={handleRangeTool} />
          </View>
        </View>

        {/* --- Buttons for generating new DATA --- */}
        <View style={styles.bottomButtonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Add Bar" onPress={handleAddBarButtonPress} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Remove Last Bar"
              onPress={handleRemoveLastBar}
              color="#d9534f"
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Reset to Initial"
              onPress={handleResetData}
              color="#ff8533"
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Generate New Data"
              onPress={handleGenerateDataButton}
              color="#47d147"
            />
          </View>
        </View>

        {/* --- Pop-up window for generating data set --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(!isModalVisible)}
        >
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Generate New Data</Text>
              {/* --- Text inputs --- */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Min Lifespan:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setMinLifespanInput}
                  value={minLifespanInput}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Max Lifespan:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setMaxLifespanInput}
                  value={maxLifespanInput}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Tough Cell Count:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setToughCellCountInput}
                  value={toughCellCountInput}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Always Ready Count:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setAlwaysReadyCountInput}
                  value={alwaysReadyCountInput}
                  keyboardType="numeric"
                />
              </View>

              {/* --- Buttons Cancel(cancel generation of data) and Generate(generate new one) */}
              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  color="gray"
                  onPress={handleCancelbutton}
                />
                <Button title="Generate" onPress={handleGenerateData} />
              </View>
            </View>
          </View>
        </Modal>

        {/* --- NEW: Pop-up window for adding a single bar --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAddBarModalVisible}
          onRequestClose={() => setIsAddBarModalVisible(false)}
        >
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Add a New Battery</Text>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Lifespan (1-130):</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setNewBarLifespan}
                  value={newBarLifespan}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Brand:</Text>
              <View style={styles.brandSelectorContainer}>
                <TouchableOpacity
                  onPress={() => setNewBarBrand("Tough Cell")}
                  style={[
                    styles.brandButton,
                    newBarBrand === "Tough Cell" && styles.brandButtonSelected,
                  ]}
                >
                  <Text style={styles.brandButtonText}>Tough Cell</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewBarBrand("Always Ready")}
                  style={[
                    styles.brandButton,
                    newBarBrand === "Always Ready" &&
                      styles.brandButtonSelected,
                  ]}
                >
                  <Text style={styles.brandButtonText}>Always Ready</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  color="gray"
                  onPress={handleCancelAddBar}
                />
                <Button title="Add Bar" onPress={handleConfirmAddBar} />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#e5e7eb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    alignItems: "center",
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
  },
  legendColorBox: {
    width: 15,
    height: 15,
    marginRight: 8,
  },
  collapsibleContainer: {
    width: "95%",
    marginBottom: 15,
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
  },
  collapsibleHeader: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  collapsibleHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginLeft: 5,
  },
  collapsibleContent: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  helpSectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
    color: "#111827",
  },
  helpText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
  },
  helpList: {
    marginTop: 5,
  },
  helpListItem: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
    color: "#374151",
  },
  helpTextBold: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  switchControl: {
    alignItems: "center",
  },
  chartContainer: {
    width: "100%",
    marginTop: 20,
    position: "relative",
    minHeight: 100,
  },
  xAxisTitle: {
    fontSize: 12,
    color: AXIS_COLOR,
    marginTop: 10,
  },
  toolLabelContainer: {
    position: "absolute",
    height: TOOL_LABEL_OFFSET_Y,
    alignItems: "center",
    zIndex: 15,
  },
  toolLabelText: {
    color: TOOL_COLOR,
    fontWeight: "bold",
    fontSize: 14,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  rangeLabelContainer: {
    position: "absolute",
    top: 0,
    height: RANGE_LABEL_OFFSET_Y,
    alignItems: "center",
    zIndex: 10,
  },
  rangeLabelText: {
    color: RANGE_TOOL_COLOR,
    fontWeight: "bold",
    fontSize: 14,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  // --- Styles for buttons and modals ---
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 30,
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 100,
    margin: 5,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 400,
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  inputLabel: {
    flex: 2,
    fontSize: 14,
    marginRight: 10,
    fontWeight: "500",
  },
  input: {
    flex: 1.5,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  brandSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  brandButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  brandButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#e7f3ff",
  },
  brandButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Minitool_1;
