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
import BatteryBar from "./chart_components/BatteryBar";
import useValueTool from "./tools/ValueTool";
import useRangeTool from "./tools/RangeTool";
import useChartControls from "./controls/ChartControls";
import useDataGenerationModal from "./modals/DataGenerationModal";
import useBarGenerationModal from "./modals/BarGenerationModal";

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
const BAR_HEIGHT = 6;
const BAR_SPACING = 4;
const X_AXIS_HEIGHT = 20;
const TOOL_LABEL_OFFSET_Y = 25;
const RANGE_LABEL_OFFSET_Y = 15;
const TOP_BUFFER = RANGE_LABEL_OFFSET_Y + 10;

const SIDEBAR_WIDTH = 120;

const { width, height } = Dimensions.get("window");

const Minitool_1 = () => {
  const [currentBatteryData, setCurrentBatteryData] =
    useState(initialBatteryData);
  const [displayedData, setDisplayedData] = useState(initialBatteryData);
  const [toolValue, setToolValue] = useState(80.0);
  const [rangeCount, setRangeCount] = useState(0);

  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // --- Chart Controls Hook (extracted to useChartControls hook) ---
  const chartControls = useChartControls();

  // --- Calculate stats for displayed data ---
  const visibleBars = displayedData.filter((item) => item.visible);
  const minLifespan =
    visibleBars.length > 0
      ? Math.min(...visibleBars.map((item) => item.lifespan))
      : 0;
  const maxLifespan =
    visibleBars.length > 0
      ? Math.max(...visibleBars.map((item) => item.lifespan))
      : 0;
  const barCount = 20;

  const chartHeight = Math.max(10, barCount * (BAR_HEIGHT + 2 * BAR_SPACING));
  console.log("Chart Height:", chartHeight);
  const SVG_HEIGHT = chartHeight + X_AXIS_HEIGHT + TOP_BUFFER;
  const SVG_WIDTH = width - PADDING * 2 - SIDEBAR_WIDTH;
  const chartWidth =
    SVG_WIDTH - Y_AXIS_WIDTH > 0 ? SVG_WIDTH - Y_AXIS_WIDTH : 1;

  // --- Initial values for tools ---
  const initialTranslateX = (80.0 / MAX_LIFESPAN) * chartWidth;
  const initialRangeStartX = (102 / MAX_LIFESPAN) * chartWidth;
  const initialRangeEndX = (126 / MAX_LIFESPAN) * chartWidth;

  // --- Value Tool Gesture Logic (extracted to useValueTool hook) ---
  const valueTool = useValueTool({
    isActive: chartControls.valueToolActive,
    onActiveChange: chartControls.setValueToolActive,
    onValueChange: setToolValue,
    chartWidth,
    chartHeight,
    maxLifespan: MAX_LIFESPAN,
    toolValue,
    toolColor: TOOL_COLOR,
    X_AXIS_HEIGHT: X_AXIS_HEIGHT,
  });

  // --- Range Tool Gesture Logic (extracted to useRangeTool hook) ---
  const rangeTool = useRangeTool({
    isActive: chartControls.rangeToolActive,
    onActiveChange: chartControls.setRangeToolActive,
    onCountChange: setRangeCount,
    chartWidth,
    chartHeight,
    maxLifespan: MAX_LIFESPAN,
    initialStartValue: 102,
    initialEndValue: 126,
    rangeHandleSize: RANGE_HANDLE_SIZE,
    rangeToolColor: RANGE_TOOL_COLOR,
    displayedData,
    X_AXIS_HEIGHT: X_AXIS_HEIGHT,
  });

  // --- Data Generation Modal Hook (initialized after tools) ---
  const dataGenerationModal = useDataGenerationModal({
    onDataGenerated: (data) => {
      setCurrentBatteryData(data);
      chartControls.setIsSortedByColor(false);
      chartControls.setIsSortedBySize(false);
    },
    onClose: () => {
      valueTool.translateX.value = initialTranslateX;
      rangeTool.rangeStartX.value = initialRangeStartX;
      rangeTool.rangeEndX.value = initialRangeEndX;
    },
  });

  // --- Bar Generation Modal Hook ---
  const barGenerationModal = useBarGenerationModal({
    onBarAdded: (newBar) => {
      setCurrentBatteryData([...currentBatteryData, newBar]);
    },
    onClose: () => {
      valueTool.translateX.value = initialTranslateX;
      rangeTool.rangeStartX.value = initialRangeStartX;
      rangeTool.rangeEndX.value = initialRangeEndX;
    },
    currentBarCount: currentBatteryData.length,
    MAX_BAR_COUNT: MAX_BAR_COUNT,
  });

  // --- Animated Props for lines of the tools (range tool moved to RangeTool component) ---

  // --- Animations for the labels (moved to RangeTool component) ---

  // --- Function to handle value tool ---
  useAnimatedReaction(
    () => valueTool.translateX.value,
    () => {
      // Value update is handled inside ValueTool component
    },
    [chartWidth]
  );
  // --- Function to handle range tool (moved to RangeTool component) ---

  // --- Sorting and filtering handlers ---
  useEffect(() => {
    let dataToDisplay = [...currentBatteryData];

    // Apply sorting
    if (chartControls.isSortedBySize) {
      dataToDisplay.sort((a, b) => a.lifespan - b.lifespan);
    } else if (chartControls.isSortedByColor) {
      dataToDisplay.sort((a, b) => a.brand.localeCompare(b.brand));
    }

    // Mark which items should be visible (keep them in array with visibility flag)
    dataToDisplay = dataToDisplay.map((item) => ({
      ...item,
      visible:
        !(chartControls.hideGreenBars && item.brand === "Tough Cell") &&
        !(chartControls.hidePurpleBars && item.brand === "Always Ready"),
    }));

    setDisplayedData(dataToDisplay);
  }, [
    currentBatteryData,
    chartControls.isSortedBySize,
    chartControls.isSortedByColor,
    chartControls.hideGreenBars,
    chartControls.hidePurpleBars,
  ]);

  // --- Handlers for Modal(Pop up window which allows to generate random data) ---
  // Now handled by useDataGenerationModal hook - open via dataGenerationModal.handleOpenModal()

  // --- Reset data to the initial one(which was diaplayed first) ---
  const handleResetData = () => {
    setCurrentBatteryData(initialBatteryData);
    chartControls.setIsSortedByColor(false);
    chartControls.setIsSortedBySize(false);
  };

  // --- Handlers for Adding/Removing single bars ---
  const handleAddBarButtonPress = () => {
    chartControls.setRangeToolActive(false);
    chartControls.setValueToolActive(false);
    barGenerationModal.handleOpenModal();
  };

  const handleRemoveLastBar = () => {
    if (currentBatteryData.length === 0) {
      Alert.alert("Empty Chart", "There are no batteries to remove.");
      return;
    }
    const newData = currentBatteryData.slice(0, -1);
    setCurrentBatteryData(newData);
  };

  // Handlers for add bar modal are now in useBarGenerationModal hook

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

        {/* Bar chart with tools*/}
        {!dataGenerationModal.isModalVisible &&
          !barGenerationModal.isModalVisible && (
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                maxHeight: 600,
                marginTop: 20,
              }}
            >
              <ScrollView
                horizontal={false}
                scrollEnabled={SVG_HEIGHT > 500}
                style={[styles.chartContainer, { flex: 1 }]}
              >
                <View>
                  {/* --- Render the label of value tool --- */}
                  <Animated.View
                    style={[
                      styles.toolLabelContainer,
                      { left: Y_AXIS_WIDTH, top: TOP_BUFFER },
                      valueTool.animatedLabelStyle,
                    ]}
                  >
                    <Text style={styles.toolLabelText}>
                      {toolValue.toFixed(1)}
                    </Text>
                  </Animated.View>

                  {/* --- Render the label of range tool --- */}
                  <Animated.View
                    style={[
                      styles.rangeLabelContainer,
                      rangeTool.animatedRangeLabelStyle,
                    ]}
                  >
                    <Text style={styles.rangeLabelText}>
                      count: {rangeCount}
                    </Text>
                  </Animated.View>

                  {/* --- Whole bar chart --- */}
                  <Svg
                    width={SVG_WIDTH - Y_AXIS_WIDTH}
                    height={SVG_HEIGHT + X_AXIS_HEIGHT}
                    style={{ zIndex: 1 }}
                  >
                    <G x={Y_AXIS_WIDTH} y={TOP_BUFFER}>
                      {/* X-Axis */}
                      <Line
                        x1="0"
                        y1={chartHeight + X_AXIS_HEIGHT}
                        x2={chartWidth}
                        y2={chartHeight + X_AXIS_HEIGHT}
                        stroke={AXIS_COLOR}
                        strokeWidth="1"
                      />
                      {Array.from({
                        length: PLATFORM === "web" ? WEB_TICKS : MOBILE_TICKS,
                      }).map((_, i) => {
                        const val =
                          i *
                          (PLATFORM === "web"
                            ? WEB_VALUE_STEP
                            : MOBILE_VALUE_STEP);
                        const xPos = (val / MAX_LIFESPAN) * chartWidth;
                        return (
                          <SvgText
                            key={`label-${i}`}
                            x={xPos}
                            y={chartHeight + X_AXIS_HEIGHT + 15}
                            fill={AXIS_COLOR}
                            fontSize="12"
                            textAnchor="middle"
                          >
                            {val}
                          </SvgText>
                        );
                      })}

                      {/* Data Bars */}
                      {displayedData.map(
                        (item, index) =>
                          item.visible && (
                            <BatteryBar
                              key={`bar-${index}-${item.lifespan}`}
                              item={item}
                              index={index}
                              chartWidth={chartWidth}
                              rangeStartX={rangeTool.rangeStartX}
                              rangeEndX={rangeTool.rangeEndX}
                              tool={chartControls.rangeToolActive}
                              dotsOnly={chartControls.showDotsOnly}
                              maxLifespan={MAX_LIFESPAN}
                            />
                          )
                      )}

                      {/* --- Range tool (3 Line, 3 rectangles) - rendered by RangeTool hook --- */}
                      {rangeTool.renderRangeTool()}

                      {/* --- Value tool(1 line, 1 rectangle) - rendered by ValueTool hook --- */}
                      {valueTool.renderValueTool()}
                    </G>
                    {/* Y-Axis */}
                    <Line
                      x1={Y_AXIS_WIDTH}
                      y1={TOP_BUFFER}
                      x2={Y_AXIS_WIDTH}
                      y2={chartHeight + X_AXIS_HEIGHT + TOP_BUFFER}
                      stroke={AXIS_COLOR}
                      strokeWidth="1"
                    />
                  </Svg>
                </View>
              </ScrollView>
              {/* --- Stats Sidebar --- */}
              <View
                style={{
                  width: SIDEBAR_WIDTH,
                  backgroundColor: "#f0f0f0",
                  padding: 15,
                  justifyContent: "flex-start",
                  borderLeftWidth: 1,
                  borderLeftColor: "#ccc",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  Min:
                </Text>
                <Text style={{ fontSize: 14, marginBottom: 15 }}>
                  {minLifespan}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  Max:
                </Text>
                <Text style={{ fontSize: 14, marginBottom: 15 }}>
                  {maxLifespan}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  Amount:
                </Text>
                <Text style={{ fontSize: 14 }}>{barCount}</Text>
              </View>
            </View>
          )}
        <Text style={styles.xAxisTitle}>Life Span (hours)</Text>

        {/* --- Chart Controls (rendered by useChartControls hook) --- */}
        {chartControls.renderControls()}

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
              onPress={() => {
                chartControls.setRangeToolActive(false);
                chartControls.setValueToolActive(false);
                dataGenerationModal.handleOpenModal();
              }}
              color="#47d147"
            />
          </View>
        </View>

        {/* --- Pop-up window for generating data set (now via hook) --- */}
        {dataGenerationModal.renderModal()}

        {/* --- Pop-up window for adding a single bar (now via hook) --- */}
        {barGenerationModal.renderModal()}
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
