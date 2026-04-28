import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  StatusBar,
  Modal,
  Button,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, { useAnimatedReaction } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Svg, { Line, Circle, G, Text as SvgText } from "react-native-svg";
import axios from "axios";
import RNPickerSelect from "react-native-picker-select";
import initialBatteryData from "../../data/batteryScenario_set.json";
import BatteryBar from "./minitool_one_components/BatteryBar";
import useValueTool from "./tools/ValueTool";
import useRangeTool from "./tools/RangeTool";
import useChartControls from "./controls/ChartControls";
import useDataGenerationModal from "./modals/DataGenerationModal";
import useBarGenerationModal from "./modals/BarGenerationModal";
import BarInfoModal from "./modals/BarInfoModal";
import useDimensions from "../hooks/useDimensions";
import UniverseButton from "../../components/universeButton";
import Dropdown from "../../components/dropDown";

// --- Configuration ---
const MIN_BATTERY_COUNT_VALUE = 1;
const MAX_BATTERY_COUNT_VALUE = 10;
const MAX_BAR_COUNT = 20;
const MAX_LIFESPAN = 120;
const MIN_LIFESPAN = 1;
const TOUGH_CELL_COLOR = "#33cc33";
const ALWAYS_READY_COLOR = "#cc00ff";
const AXIS_COLOR = "#333";
const TOOL_COLOR = "red";

const RANGE_TOOL_COLOR = "#0000FF";
const RANGE_HANDLE_SIZE = 15;

// --- Chart Layout Constants ---
const PLATFORM = Platform.OS;
const MOBILE_TICKS = 4;
const TABLET_TICKS = 6;
const WEB_TICKS = 10;
const MOBILE_VALUE_STEP = 26;
const TABLET_VALUE_STEP = 26;
const WEB_VALUE_STEP = 13;
const PADDING = 10;
const Y_AXIS_WIDTH = 40;
const BAR_HEIGHT = 6;
const BAR_SPACING = 4;
const X_AXIS_HEIGHT = 20;
const TOOL_LABEL_OFFSET_Y = 25;
const RANGE_LABEL_OFFSET_Y = 15;
const TOP_BUFFER = RANGE_LABEL_OFFSET_Y + 10;

const SIDEBAR_WIDTH = 120;

// API Configuration
const API_URL = "http://localhost:5000/api/scenarios";

const Minitool_1 = () => {
  // Get current dimensions and listen to resize events
  const { width, height } = useDimensions();
  const [currentBatteryData, setCurrentBatteryData] =
    useState(initialBatteryData);
  const [displayedData, setDisplayedData] = useState(initialBatteryData);

  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [toolValue, setToolValue] = useState(80.0);
  const [rangeCount, setRangeCount] = useState(0);

  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // --- Responsive Layout (memoized) ---
  const { isMobile, isTablet, isDesktop, EFFECTIVE_SIDEBAR_WIDTH } =
    useMemo(() => {
      const mobile = width <= 480;
      const tablet = width > 480 && width < 850;
      const desktop = width >= 850;
      let sidebarWidth = SIDEBAR_WIDTH; // Desktop default (120px)
      if (mobile) {
        sidebarWidth = 0;
      } else if (tablet) {
        sidebarWidth = 100;
      }
      return {
        isMobile: mobile,
        isTablet: tablet,
        isDesktop: desktop,
        EFFECTIVE_SIDEBAR_WIDTH: sidebarWidth,
      };
    }, [width]);

  // Database-related state
  const [scenarios, setScenarios] = useState([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  // State for dropdown scenario loader
  const [loadedScenarioId, setLoadedScenarioId] = useState(null);
  const [loadedScenarioName, setLoadedScenarioName] = useState(null);
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const dropdownRef = useRef(null);
  const [scenarioSelectedFeedback, setScenarioSelectedFeedback] =
    useState(false);

  // State for Bar Info Modal
  const [selectedBar, setSelectedBar] = useState(null);
  const [isBarInfoModalVisible, setIsBarInfoModalVisible] = useState(false);

  // --- Chart Controls Hook (extracted to useChartControls hook) ---
  const chartControls = useChartControls(width);

  // --- Calculate stats for displayed data (memoized) ---
  const { visibleBars, minLifespan, maxLifespan } = useMemo(() => {
    const visible = displayedData.filter((item) => item.visible);
    const min =
      visible.length > 0
        ? Math.min(...visible.map((item) => item.lifespan))
        : 0;
    const max =
      visible.length > 0
        ? Math.max(...visible.map((item) => item.lifespan))
        : 0;
    return { visibleBars: visible, minLifespan: min, maxLifespan: max };
  }, [displayedData]);
  const barCount = displayedData.filter((item) => item.visible).length;

  // --- Chart dimensions and tick configuration (memoized) ---
  const {
    chartHeight,
    SVG_HEIGHT,
    SVG_WIDTH,
    chartWidth,
    dynamicMax,
    TICKS_COUNT,
    VALUE_STEP,
    TICK_FONT_SIZE,
  } = useMemo(() => {
    const height = Math.max(10, 20 * (BAR_HEIGHT + 2 * BAR_SPACING));
    const svgHeight = height + X_AXIS_HEIGHT + TOP_BUFFER;

    const maxValInData =
      displayedData.length > 0
        ? Math.max(...displayedData.map((d) => d.lifespan))
        : 100;
    const dynamicMax = maxValInData * 1.01;

    const sidebarMargins = isDesktop ? 20 : 0;

    const available =
      width - PADDING * 2 - EFFECTIVE_SIDEBAR_WIDTH - sidebarMargins;

    const svgWidth =
      isMobile || isTablet ? Math.max(available, 500) : available;
    // The chartWidth is the actual length of the X-Axis line
    const cWidth = svgWidth - 80;
    // Determine ticks based on device type
    let ticksCount = WEB_TICKS;
    let valueStep = WEB_VALUE_STEP;
    let tickFontSize = "12";
    if (isMobile) {
      ticksCount = MOBILE_TICKS;
      valueStep = MOBILE_VALUE_STEP;
      tickFontSize = "10";
    } else if (isTablet) {
      ticksCount = TABLET_TICKS;
      valueStep = TABLET_VALUE_STEP;
      tickFontSize = "11";
    }

    return {
      chartHeight: height,
      SVG_HEIGHT: svgHeight,
      SVG_WIDTH: svgWidth,
      chartWidth: cWidth,
      dynamicMax: dynamicMax,
      TICKS_COUNT: ticksCount,
      VALUE_STEP: valueStep,
      TICK_FONT_SIZE: tickFontSize,
    };
  }, [
    width,
    isDesktop,
    isTablet,
    isMobile,
    EFFECTIVE_SIDEBAR_WIDTH,
    barCount,
    displayedData,
  ]);

  // --- Initial values for tools (memoized) ---
  const { initialTranslateX, initialRangeStartX, initialRangeEndX } = useMemo(
    () => ({
      initialTranslateX: (80.0 / dynamicMax) * chartWidth,
      initialRangeStartX: (52 / dynamicMax) * chartWidth,
      initialRangeEndX: (56 / dynamicMax) * chartWidth,
    }),
    [chartWidth, dynamicMax],
  );

  // --- Value Tool Gesture Logic (extracted to useValueTool hook) ---
  const valueTool = useValueTool({
    isActive: chartControls.valueToolActive,
    onActiveChange: chartControls.setValueToolActive,
    onValueChange: setToolValue,
    chartWidth,
    chartHeight,
    maxLifespan: dynamicMax,
    toolValue,
    toolColor: TOOL_COLOR,
    X_AXIS_HEIGHT: X_AXIS_HEIGHT,
    TOP_BUFFER: TOP_BUFFER,
  });

  // --- Range Tool Gesture Logic (extracted to useRangeTool hook) ---
  const rangeTool = useRangeTool({
    isActive: chartControls.rangeToolActive,
    onActiveChange: chartControls.setRangeToolActive,
    onCountChange: setRangeCount,
    chartWidth,
    chartHeight,
    maxLifespan: dynamicMax,
    initialStartValue: 52,
    initialEndValue: 56,
    rangeHandleSize: RANGE_HANDLE_SIZE,
    rangeToolColor: RANGE_TOOL_COLOR,
    displayedData,
    X_AXIS_HEIGHT: X_AXIS_HEIGHT,
    TOP_BUFFER: TOP_BUFFER,
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
    () => {},
    [chartWidth],
  );
  // --- Function to handle range tool (moved to RangeTool component) ---

  useEffect(() => {
    fetchScenarios();
  }, []);

  // --- Sorting and filtering handlers (optimized to avoid unnecessary re-renders) ---
  useEffect(() => {
    setDisplayedData((prevData) => {
      // Check if we need to update at all
      let dataToDisplay = [...currentBatteryData];

      // Apply sorting
      if (chartControls.isSortedBySize) {
        dataToDisplay.sort((a, b) => b.lifespan - a.lifespan);
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

      return dataToDisplay;
    });
  }, [
    currentBatteryData,
    chartControls.isSortedBySize,
    chartControls.isSortedByColor,
    chartControls.hideGreenBars,
    chartControls.hidePurpleBars,
  ]);

  // --- Handlers for Modal(Pop up window which allows to generate random data) ---

  // --- Reset data to the initial one(which was diaplayed first) ---
  const handleResetData = useCallback(() => {
    setCurrentBatteryData(initialBatteryData);
    chartControls.setIsSortedByColor(false);
    chartControls.setIsSortedBySize(false);
  }, [chartControls]);

  // --- Handlers for Adding/Removing single bars ---
  const handleAddBarButtonPress = useCallback(() => {
    chartControls.setRangeToolActive(false);
    chartControls.setValueToolActive(false);
    barGenerationModal.handleOpenModal();
  }, [chartControls, barGenerationModal]);

  const handleRemoveLastBar = useCallback(() => {
    if (currentBatteryData.length === 0) {
      alert(`Empty Chart.There are no batteries to remove.`);
      return;
    }
    const newData = currentBatteryData.slice(0, -1);
    setCurrentBatteryData(newData);
  }, [currentBatteryData]);

  // --- Handlers for Bar Info Modal ---
  const handleBarPress = useCallback((index, item) => {
    setSelectedBar({
      brand: item.brand,
      lifespan: item.lifespan,
    });
    setIsBarInfoModalVisible(true);
  }, []);

  const handleDeleteBar = useCallback(() => {
    if (selectedBar) {
      // Find and remove the bar by matching brand and lifespan
      // If multiple bars have the same brand/lifespan, remove the first match
      const actualIndex = currentBatteryData.findIndex(
        (item) =>
          item.brand === selectedBar.brand &&
          item.lifespan === selectedBar.lifespan,
      );

      if (actualIndex !== -1) {
        const newData = currentBatteryData.filter(
          (_, idx) => idx !== actualIndex,
        );
        setCurrentBatteryData(newData);
      }

      setIsBarInfoModalVisible(false);
      setSelectedBar(null);
    }
  }, [selectedBar, currentBatteryData]);

  const handleCloseBarInfoModal = useCallback(() => {
    setIsBarInfoModalVisible(false);
    setSelectedBar(null);
  }, []);

  // --- Database Functions ---
  const fetchScenarios = async () => {
    try {
      setIsLoadingScenarios(true);
      const response = await axios.get(API_URL);
      if (response.data.success) {
        // Filter scenarios to only show those for this tool
        const filteredScenarios = response.data.data.filter(
          (scenario) => scenario.toolType === "minitool1",
        );
        setScenarios(filteredScenarios);
      }
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      if (error.code === "ERR_NETWORK") {
        alert(
          "Connection Error. Unable to connect to database. Make sure the backend server is running on port 5000.",
        );
      } else {
        alert("Error.Failed to fetch scenarios from database");
      }
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const saveScenario = async () => {
    if (!scenarioName.trim()) {
      alert(`Input Error.Please enter a scenario name`);
      return;
    }

    try {
      setIsSavingScenario(true);
      const response = await axios.post(API_URL, {
        name: scenarioName,
        description: "Battery lifespan scenario",
        toolType: "minitool1",
        data: {
          bars: currentBatteryData,
          minLifespan:
            displayedData.length > 0
              ? Math.min(...displayedData.map((item) => item.lifespan))
              : null,
          maxLifespan:
            displayedData.length > 0
              ? Math.max(...displayedData.map((item) => item.lifespan))
              : null,
        },
      });

      if (response.data.success) {
        alert(`Success.Scenario saved successfully`);
        setScenarios([...scenarios, response.data.data]);
        setScenarioName("");
        setShowScenariosModal(false);
      }
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert(`Error.Failed to save scenario to database`);
    } finally {
      setIsSavingScenario(false);
    }
  };

  const loadScenario = async (scenarioId) => {
    try {
      const response = await axios.get(`${API_URL}/${scenarioId}`);
      if (response.data.success) {
        const scenarioData = response.data.data;
        setCurrentBatteryData(scenarioData.data.bars);
        setLoadedScenarioId(scenarioId);
        setLoadedScenarioName(scenarioData.name);
        setSelectedScenarioId(scenarioId);
        chartControls.setIsSortedByColor(false);
        chartControls.setIsSortedBySize(false);
        setShowScenarioDropdown(false);
        alert(`Success.Loaded scenario: ${scenarioData.name}`);
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert(`Error.Failed to load scenario from database`);
    }
  };

  const handleLoadScenarioFromDropdown = useCallback(async (scenarioId) => {
    if (!scenarioId) return;
    try {
      const response = await axios.get(`${API_URL}/${scenarioId}`);
      if (response.data.success) {
        const scenarioData = response.data.data.data;
        setCurrentBatteryData(scenarioData.bars);
        setLoadedScenarioName(response.data.data.name);
        setSelectedScenarioId(scenarioId);

        // Visual feedback for selection
        setScenarioSelectedFeedback(true);
        setTimeout(() => setScenarioSelectedFeedback(false), 600);
      } else {
        alert("Failed to load scenario: " + response.data.error);
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert("Error loading scenario: " + error.message);
    }
  }, []);

  const router = useRouter();

  // --- Memoized tick labels rendering ---
  const tickLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < TICKS_COUNT; i++) {
      const val = i * VALUE_STEP;
      if (val >= dynamicMax.toFixed(0)) break;
      const xPos = (val / dynamicMax) * chartWidth;
      labels.push({
        key: `label-${i}`,
        x: xPos,
        y: chartHeight + X_AXIS_HEIGHT + TOP_BUFFER / 2,
        value: val,
      });
    }
    labels.push({
      key: `label-${labels.length}`,
      x: chartWidth,
      y: chartHeight + X_AXIS_HEIGHT + TOP_BUFFER / 2,
      value: dynamicMax.toFixed(0),
    });
    return labels;
  }, [TICKS_COUNT, VALUE_STEP, dynamicMax, chartWidth, chartHeight]);

  // --- Memoized visible bars rendering ---
  const visibleBarsToRender = useMemo(() => {
    return displayedData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.visible);
  }, [displayedData]);

  const deleteScenario = async (scenarioId) => {
    const executeDeletion = async () => {
      try {
        if (selectedScenarioId === scenarioId) {
          router.replace("/minitool_1");
        }

        const response = await axios.delete(`${API_URL}/${scenarioId}`);

        if (response.data.success) {
          // Update the list state
          setScenarios((prev) => prev.filter((s) => s._id !== scenarioId));

          if (selectedScenarioId === scenarioId) {
            setSelectedScenarioId(null);
          }

          // Platform-specific Success Alert
          if (Platform.OS === "web") {
            window.alert("Success: Scenario deleted successfully");
          } else {
            Alert.alert("Success", "Scenario deleted successfully");
          }
        }
      } catch (error) {
        console.error("Error deleting scenario:", error);

        if (Platform.OS === "web") {
          window.alert("Error: Failed to delete scenario");
        } else {
          Alert.alert("Error", "Failed to delete scenario");
        }
      }
    };

    // --- 2. PLATFORM-SPECIFIC CONFIRMATION ---
    if (Platform.OS === "web") {
      // Use the native browser confirmation dialog
      const confirmed = window.confirm(
        "Are you sure you want to delete this scenario?",
      );
      if (confirmed) {
        await executeDeletion();
      }
    } else {
      // Use the React Native Mobile Alert
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this scenario?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: executeDeletion,
            style: "destructive",
          },
        ],
      );
    }
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

        <View
          style={[
            styles.scenarioLoaderContainer,
            isMobile && styles.scenarioLoaderMobile,
            isTablet && styles.scenarioLoaderTablet,
          ]}
        >
          {/* --- Scenario Picker Dropdown --- */}
          <View
            style={[
              styles.scenarioPickerContainer,
              isMobile && styles.scenarioPickerMobile,
              isTablet && styles.scenarioPickerTablet,
            ]}
          >
            {/* <Text style={styles.pickerLabel}>Select Scenario:</Text> */}
            <Dropdown
              data={scenarios.map((scenario) => ({
                label: scenario.name,
                value: scenario._id,
              }))}
              onChange={handleLoadScenarioFromDropdown}
              placeholder="Select scenario"
            />
            {/* <RNPickerSelect
              placeholder={{
                label: "Choose a scenario to load",
                value: null,
              }}
              items={scenarios.map((scenario) => ({
                label: scenario.name,
                value: scenario._id,
              }))}
              onValueChange={handleLoadScenarioFromDropdown}
              style={pickerSelectStyles}
              value={selectedScenarioId}
              useNativeAndroidPickerStyle={false}
            /> */}
            {/* Selection Feedback Effect */}
            {/* {scenarioSelectedFeedback && (
              <View
                style={{
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "#E0F4FF",
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: "#2563EB",
                }}
              >
                <Text
                  style={{
                    color: "#1e40af",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  ✓ Scenario "{loadedScenarioName}" loaded successfully!
                </Text>
              </View>
            )} */}
          </View>

          {/* Buttons Layout */}
          <View
            style={[
              styles.topButtonsContainer,
              isMobile && styles.topButtonsContainerMobile,
              isTablet && styles.topButtonsContainerTablet,
            ]}
          >
            <UniverseButton
              title={isMobile ? "Upload" : "Mock for Upload"}
              onPress={() =>
                alert("This is a mock button for the upload functionality.")
              }
              colorScheme="primary"
              containerStyles={
                isMobile ? styles.topButtonMobile : styles.topButton
              }
            />
            <UniverseButton
              title="ADD BAR"
              onPress={handleAddBarButtonPress}
              colorScheme="primary"
              containerStyles={
                isMobile ? styles.topButtonMobile : styles.topButton
              }
            />
            <UniverseButton
              title={"Generate"}
              onPress={() => {
                chartControls.setRangeToolActive(false);
                chartControls.setValueToolActive(false);
                dataGenerationModal.handleOpenModal();
              }}
              colorScheme="primary"
              containerStyles={
                isMobile ? styles.topButtonMobile : styles.topButton
              }
            />
          </View>
        </View>

        {/* Bar chart with tools*/}
        {!dataGenerationModal.isModalVisible &&
          !barGenerationModal.isModalVisible && (
            <View
              style={[
                {
                  width: "95%",
                  alignItems: "flex-start",
                  flexDirection: "row",
                },
                isMobile && styles.chartAndStatsMobile,
              ]}
            >
              <ScrollView
                horizontal={true}
                // Only allow scrolling if the SVG is actually wider than the screen
                scrollEnabled={
                  SVG_WIDTH > width - EFFECTIVE_SIDEBAR_WIDTH && isScrollEnabled
                }
                style={[styles.chartContainer, { flex: 1, width: "100%" }]}
                contentContainerStyle={{
                  width: SVG_WIDTH + Y_AXIS_WIDTH, // Use exact width to stop "infinite scrolling"
                  paddingRight: 0, // Ensure no extra padding is added here
                }}
              >
                <View
                  style={{
                    width: SVG_WIDTH + Y_AXIS_WIDTH,
                    height: SVG_HEIGHT + X_AXIS_HEIGHT,
                  }}
                >
                  {/* --- Render the label of value tool --- */}
                  <Animated.View
                    style={[
                      styles.toolLabelContainer,
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
                    width={SVG_WIDTH + Y_AXIS_WIDTH}
                    height={SVG_HEIGHT + X_AXIS_HEIGHT}
                    style={{ zIndex: 1 }}
                  >
                    <G>
                      {/* X-Axis */}
                      <Line
                        x1="0"
                        y1={chartHeight + X_AXIS_HEIGHT + TOP_BUFFER}
                        x2={chartWidth}
                        y2={chartHeight + X_AXIS_HEIGHT + TOP_BUFFER}
                        stroke={AXIS_COLOR}
                        strokeWidth="1"
                      />
                      {tickLabels.map(({ key, x, y, value }) => (
                        <SvgText
                          key={key}
                          x={x + 5}
                          y={y + TOP_BUFFER}
                          fill={AXIS_COLOR}
                          fontSize={TICK_FONT_SIZE}
                          textAnchor="middle"
                        >
                          {value}
                        </SvgText>
                      ))}

                      {/* Data Bars */}
                      {visibleBarsToRender.map(({ item, index }) => (
                        <BatteryBar
                          key={`bar-${index}-${item.lifespan}`}
                          item={item}
                          index={index}
                          chartWidth={chartWidth}
                          rangeStartX={rangeTool.rangeStartX}
                          rangeEndX={rangeTool.rangeEndX}
                          tool={chartControls.rangeToolActive}
                          dotsOnly={chartControls.showDotsOnly}
                          MAX_LIFESPAN={dynamicMax}
                          onBarPress={handleBarPress}
                          TOP_BUFFER={TOP_BUFFER}
                        />
                      ))}

                      {/* --- Range tool (3 Line, 3 rectangles) - rendered by RangeTool hook --- */}
                      {rangeTool.renderRangeTool()}

                      {/* --- Value tool(1 line, 1 rectangle) - rendered by ValueTool hook --- */}
                      {valueTool.renderValueTool()}

                      {/* Y-Axis */}
                      <Line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={chartHeight + X_AXIS_HEIGHT + TOP_BUFFER}
                        stroke={AXIS_COLOR}
                        strokeWidth="1"
                      />
                    </G>
                  </Svg>
                </View>
              </ScrollView>

              {/* --- Stats Section --- */}
              {isMobile ? (
                // Mobile: Horizontal stats bar below chart
                <View testID="mobile-stats-bar" style={styles.statsBarMobile}>
                  <View style={styles.statItemMobile}>
                    <Text style={styles.statLabelMobile}>Amount</Text>
                    <Text
                      testID="mobile-stat-amount"
                      style={styles.statValueMobile}
                    >
                      {barCount}
                    </Text>
                  </View>
                  <View style={[styles.statItemMobile, styles.statItemBorder]}>
                    <Text style={styles.statLabelMobile}>Min</Text>
                    <Text
                      testID="mobile-stat-min"
                      style={styles.statValueMobile}
                    >
                      {minLifespan}
                    </Text>
                  </View>
                  <View style={styles.statItemMobile}>
                    <Text style={styles.statLabelMobile}>Max</Text>
                    <Text
                      testID="mobile-stat-max"
                      style={styles.statValueMobile}
                    >
                      {maxLifespan}
                    </Text>
                  </View>
                </View>
              ) : (
                // Tablet & Desktop: Vertical sidebar (width changes based on device)
                <View
                  testID="stats-bar"
                  style={{
                    width: EFFECTIVE_SIDEBAR_WIDTH,
                    height: Math.max(SVG_HEIGHT, 250),
                    backgroundColor: "#f0f0f0",
                    padding: isTablet ? 10 : 15,
                    justifyContent: "space-between",
                    borderRadius: 12,
                    marginLeft: 10,
                    marginTop: X_AXIS_HEIGHT / 2,
                  }}
                >
                  {/* Center Section - Amount */}
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isTablet ? 10 : 12,
                        fontWeight: "bold",
                        marginBottom: 6,
                        color: "#333",
                      }}
                    >
                      Amount
                    </Text>
                    <Text
                      testID="stat-amount"
                      style={{
                        fontSize: isTablet ? 24 : 32,
                        fontWeight: "bold",
                        color: "#2563eb",
                      }}
                    >
                      {barCount}
                    </Text>
                  </View>

                  {/* Bottom Section - Min and Max */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#ccc",
                      paddingTop: 10,
                    }}
                  >
                    <View style={{ marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: isTablet ? 9 : 11,
                          fontWeight: "bold",
                          marginBottom: 3,
                          color: "#666",
                        }}
                      >
                        Min
                      </Text>
                      <Text
                        testID="stat-min"
                        style={{
                          fontSize: isTablet ? 14 : 16,
                          fontWeight: "600",
                          color: "#1e40af",
                        }}
                      >
                        {minLifespan}
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: isTablet ? 9 : 11,
                          fontWeight: "bold",
                          marginBottom: 3,
                          color: "#666",
                        }}
                      >
                        Max
                      </Text>
                      <Text
                        testID="stat-max"
                        style={{
                          fontSize: isTablet ? 14 : 16,
                          fontWeight: "600",
                          color: "#dc2626",
                        }}
                      >
                        {maxLifespan}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        <Text style={styles.xAxisTitle}>Life Span (hours)</Text>

        {/* --- Chart Controls (rendered by useChartControls hook) --- */}
        {chartControls.renderControls()}

        {/* --- Database Scenario Management Buttons --- */}
        <View style={styles.databaseButtonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Save Current Scenario"
              onPress={() => setShowScenariosModal(true)}
              color="#0066cc"
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Load Scenario"
              onPress={() => {
                fetchScenarios();
                setShowScenariosModal(true);
              }}
              color="#009900"
            />
          </View>
        </View>

        {/* --- Pop-up window for generating data set --- */}
        {dataGenerationModal.renderModal()}

        {/* --- Pop-up window for adding a single bar --- */}
        {barGenerationModal.renderModal()}

        {/* --- Bar Info Modal --- */}
        <BarInfoModal
          visible={isBarInfoModalVisible}
          barData={selectedBar}
          onClose={handleCloseBarInfoModal}
          onDelete={handleDeleteBar}
        />

        {/* --- Scenarios Management Modal --- */}
        <Modal
          visible={showScenariosModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowScenariosModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manage Scenarios</Text>

              {/* Save Scenario Section */}
              <View style={styles.saveScenarioSection}>
                <Text style={styles.sectionTitle}>Save Current Scenario</Text>
                <TextInput
                  style={styles.scenarioInput}
                  placeholder="Enter scenario name..."
                  value={scenarioName}
                  onChangeText={setScenarioName}
                  editable={!isSavingScenario}
                />
                <Button
                  title={isSavingScenario ? "Saving..." : "Save Scenario"}
                  onPress={saveScenario}
                  disabled={isSavingScenario}
                  color="#0066cc"
                />
              </View>

              {/* Load Scenario Section */}
              <View style={styles.loadScenarioSection}>
                <Text style={styles.sectionTitle}>Load Saved Scenario</Text>
                {isLoadingScenarios ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text>Loading scenarios...</Text>
                  </View>
                ) : scenarios.length > 0 ? (
                  <FlatList
                    data={scenarios}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <View style={styles.scenarioItem}>
                        <View style={styles.scenarioInfo}>
                          <Text style={styles.scenarioItemName}>
                            {item.name}
                          </Text>
                          <Text style={styles.scenarioItemDetails}>
                            {item.data.length} batteries | Created:{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.scenarioActions}>
                          <TouchableOpacity
                            onPress={() => loadScenario(item._id)}
                            style={styles.loadButton}
                          >
                            <Text style={styles.buttonText}>Load</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteScenario(item._id)}
                            style={styles.deleteButton}
                          >
                            <Text style={styles.buttonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    scrollEnabled={true}
                    style={styles.scenariosList}
                  />
                ) : (
                  <Text style={styles.noScenariosText}>
                    No scenarios saved yet
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowScenariosModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
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
  // Scenario Loader Styles
  scenarioLoaderContainer: {
    width: "95%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noScenariosText: {
    color: "#999",
    fontSize: 13,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    flexWrap: "wrap",
    width: "95%",
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
    position: "relative",
    minHeight: 100,
    zIndex: 10,
  },
  xAxisTitle: {
    fontSize: 12,
    color: AXIS_COLOR,
    marginTop: 10,
  },
  toolLabelContainer: {
    left: -Y_AXIS_WIDTH / 2,
    top: 0,
    position: "absolute",
    height: TOOL_LABEL_OFFSET_Y,
    alignItems: "center",
    justifyContent: "center",
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
    left: Y_AXIS_WIDTH / 2,
    top: -X_AXIS_HEIGHT / 2,
    position: "absolute",
    height: RANGE_LABEL_OFFSET_Y + TOP_BUFFER,
    alignItems: "center",
    justifyContent: "center",
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
  },
  topButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginLeft: 15,
    flex: 1,
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 6,
  },
  topButtonsContainerMobile: {
    gap: 4,
    flex: 1,
    flexWrap: "wrap",
    width: "95%",
    alignSelf: "center",
    marginLeft: 0,
  },
  topButton: {
    minWidth: 140,
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 30,
  },
  topButtonMobile: {
    minWidth: 100,
    flex: 1,
    minHeight: 30,
    paddingHorizontal: 15,
  },
  // --- Mobile Responsive Styles ---
  scenarioLoaderMobile: {
    flexDirection: "column",
    gap: 15,
  },
  scenarioPickerMobile: {
    width: "95%",
    alignSelf: "center",
    marginBottom: 0,
  },
  chartAndStatsMobile: {
    flexDirection: "column",
    marginTop: 20,
    width: "95%",
  },
  statsBarMobile: {
    width: "95%",
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 12,
    justifyContent: "space-around",
  },
  statItemMobile: {
    alignItems: "center",
    flex: 1,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  statLabelMobile: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  statValueMobile: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  // --- Tablet Responsive Styles ---
  scenarioLoaderTablet: {
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 10,
  },
  scenarioPickerTablet: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 0,
  },
  topButtonsContainerTablet: {
    width: "100%",
    alignSelf: "center",
    marginLeft: 0,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  // Database/Scenarios styles
  databaseButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    marginTop: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  saveScenarioSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  scenarioInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  loadScenarioSection: {
    maxHeight: 300,
    marginBottom: 20,
  },
  scenariosList: {
    maxHeight: 250,
  },
  scenarioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
    borderRadius: 8,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioItemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  scenarioItemDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  scenarioActions: {
    flexDirection: "row",
    gap: 8,
  },
  loadButton: {
    backgroundColor: "#009900",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: "#cc0000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noScenariosText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  closeButton: {
    backgroundColor: "#666",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  scenarioPickerContainer: {
    flex: 1,
    minWidth: 200,
  },
  pickerLabel: {
    fontSize: 14,
    color: "navy",
    marginBottom: 5,
    textAlign: "center",
  },
});

// Styles for RNPickerSelect (can be customized)
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: "#ADD8E6",
    borderRadius: 12,
    color: "black",
    paddingRight: 50,
    backgroundColor: "white",
    marginBottom: 10,
    shadowColor: "#87CEEB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#ADD8E6",
    borderRadius: 12,
    color: "black",
    paddingRight: 50,
    backgroundColor: "white",
    marginBottom: 10,
    shadowColor: "#87CEEB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWeb: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#ADD8E6",
    borderRadius: 12,
    color: "black",
    paddingRight: 50,
    backgroundColor: "white",
    marginBottom: 10,
    shadowColor: "#87CEEB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholder: {
    color: "#999",
  },
});

export default Minitool_1;
