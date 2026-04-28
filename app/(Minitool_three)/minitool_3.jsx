import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Text,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import axios from "axios";
import ScatterPlot from "./chart_components/ScatterPlot";
import ScatterControls from "./controls/ScatterControls";
import DataInfo from "./modals/InfoModal";
import bivariateData from "../../data/bivariate_set.json";
import Dropdown from "../../components/dropDown";
import UniverseButton from "../../components/universeButton";
import UploadScenarioModal from "../../components/UploadScenarioModal";

const API_URL = "http://localhost:5000/api/scenarios";
const TOOL_TYPE = "minitool3";

// Local presets shipped with the app, available alongside DB scenarios.
const LOCAL_PRESETS = Object.keys(bivariateData).map((key) => ({
  id: `local:${key}`,
  name: key,
  data: bivariateData[key],
}));

// Normalise scenario payloads coming from either the manual save endpoint
// (data.currentData = [{x,y}]) or the file upload endpoint
// (data.dataPoints = [{x,y,...}]).
const extractPoints = (scenario) => {
  const data = scenario?.data;
  if (!data) return [];
  if (Array.isArray(data.currentData)) return data.currentData;
  if (Array.isArray(data.dataPoints)) {
    return data.dataPoints
      .map((row) => ({ x: Number(row.x), y: Number(row.y) }))
      .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y));
  }
  return [];
};

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const Minitool_3 = () => {
  const [showCross, setShowCross] = useState(false);
  const [hideData, setHideData] = useState(false);
  const [activeGrid, setActiveGrid] = useState(null);
  const [twoGroupsCount, setTwoGroupsCount] = useState(null);
  const [fourGroupsCount, setFourGroupsCount] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleActiveGridChange = (val) => {
    setActiveGrid(val);
    setTwoGroupsCount(null);
    setFourGroupsCount(null);
  };

  const handleTwoGroupsChange = (val) => {
    setTwoGroupsCount(val);
    setActiveGrid(null);
    setFourGroupsCount(null);
  };

  const handleFourGroupsChange = (val) => {
    setFourGroupsCount(val);
    setActiveGrid(null);
    setTwoGroupsCount(null);
  };

  const [currentKey, setCurrentKey] = useState("local:dataset1");
  const [currentData, setCurrentData] = useState(bivariateData.dataset1);
  const [scenarios, setScenarios] = useState([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const fetchScenarios = useCallback(async () => {
    try {
      setIsLoadingScenarios(true);
      const response = await axios.get(`${API_URL}/tool/${TOOL_TYPE}`);
      if (response.data?.success) {
        setScenarios(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      if (error.code === "ERR_NETWORK") {
        showAlert(
          "Connection Error",
          "Unable to reach the database. Make sure the backend server is running on port 5000.",
        );
      } else {
        showAlert("Error", "Failed to fetch scenarios from database.");
      }
    } finally {
      setIsLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const dropdownOptions = [
    ...LOCAL_PRESETS.map((p) => ({ value: p.id, label: `★ ${p.name}` })),
    ...scenarios.map((s) => ({ value: s._id, label: s.name })),
  ];

  const handleSelectScenario = useCallback(async (value) => {
    if (!value) return;
    setCurrentKey(value);
    setSelectedPoint(null);

    if (value.startsWith("local:")) {
      const key = value.slice("local:".length);
      if (bivariateData[key]) setCurrentData(bivariateData[key]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/${value}`);
      if (response.data?.success) {
        const points = extractPoints(response.data.data);
        if (points.length === 0) {
          showAlert("Empty Scenario", "This scenario has no x/y points.");
          return;
        }
        setCurrentData(points);
      } else {
        showAlert(
          "Error",
          "Failed to load scenario: " +
            (response.data?.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      showAlert("Error", "Failed to load scenario from database.");
    }
  }, []);

  const handleUploadSuccess = useCallback(
    (newScenario) => {
      setIsUploadModalVisible(false);
      fetchScenarios();
      if (newScenario?._id) {
        const points = extractPoints(newScenario);
        if (points.length > 0) {
          setCurrentData(points);
          setCurrentKey(newScenario._id);
        }
      }
    },
    [fetchScenarios],
  );

  const { width } = Dimensions.get("window");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#2a7f9f" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Scatter Plot Analysis</Text>
          <Text style={styles.subtitle}>Bivariate Data Visualization</Text>
        </View>
        <ScrollView
          style={styles.mainContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          {/* Dataset selector + Upload action row */}
          <View style={styles.topRow}>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                data={dropdownOptions}
                onChange={handleSelectScenario}
                placeholder={
                  isLoadingScenarios
                    ? "Loading scenarios..."
                    : "Select scenario"
                }
              />
              {isLoadingScenarios && (
                <ActivityIndicator
                  style={styles.loadingIndicator}
                  size="small"
                  color="#2a7f9f"
                />
              )}
            </View>
            <View style={styles.uploadButtonWrapper}>
              <UniverseButton
                title="Upload"
                onPress={() => setIsUploadModalVisible(true)}
                colorScheme="primary"
                containerStyles={styles.uploadButton}
              />
            </View>
          </View>

          {/* Main Chart Section */}
          <View style={styles.chartSection}>
            <ScatterPlot
              data={currentData}
              showCross={showCross}
              hideData={hideData}
              activeGrid={activeGrid}
              twoGroupsCount={twoGroupsCount}
              fourGroupsCount={fourGroupsCount}
              selectedPoint={selectedPoint}
              onPointSelect={setSelectedPoint}
              onScrollEnabled={setScrollEnabled}
            />
          </View>

          {/* Controls and Info Row */}
          <View style={styles.controlsSection}>
            <View style={{ flex: 1 }}>
              <ScatterControls
                showCross={showCross}
                onShowCrossChange={setShowCross}
                hideData={hideData}
                onHideDataChange={setHideData}
                activeGrid={activeGrid}
                onActiveGridChange={handleActiveGridChange}
                twoGroupsCount={twoGroupsCount}
                onTwoGroupsChange={handleTwoGroupsChange}
                fourGroupsCount={fourGroupsCount}
                onFourGroupsChange={handleFourGroupsChange}
              />
            </View>
            {/* <View style={{ marginLeft: 10 }}>
              <DataInfo data={currentData} />
            </View> */}
          </View>

          {/* Additional Info */}
          {/* <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Current Display Mode:</Text>
            <Text style={styles.infoText}>{displayMode}</Text>
            <Text style={styles.infoDescription}>
              More features coming soon! Features like cross analysis, grid
              overlay, and grouping options will be available.
            </Text>
          </View> */}
        </ScrollView>
        <UploadScenarioModal
          visible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          toolType={TOOL_TYPE}
          onSuccess={handleUploadSuccess}
        />{" "}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    backgroundColor: "#2a7f9f",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e5f7f",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#e0e0e0",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  contentContainer: {
    paddingVertical: 16,
  },
  chartSection: {
    backgroundColor: "#cc1111",
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginHorizontal: 10,
    marginVertical: 8,
  },
  infoBox: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  infoDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  dropdownWrapper: {
    minWidth: 200,
  },
  uploadButtonWrapper: {},
  uploadButton: {
    minWidth: 140,
    minHeight: 44,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    zIndex: 100,
  },
  dropdownWrapper: {
    width: 300,
    position: "relative",
  },
  loadingIndicator: {
    position: "absolute",
    right: 50,
    top: 16,
  },
  uploadButtonWrapper: {},
  uploadButton: {
    minWidth: 140,
    minHeight: 44,
    paddingHorizontal: 24,
  },
  dropdownContainer: {
    alignSelf: "center",
    width: 300,
    zIndex: 100, // Crucial for iOS to stay above the SVG
    position: "relative", // Keeps the list anchored to the header
  },
  dropdownHeader: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    height: 40, // Fixed height helps with alignment
    justifyContent: "center",
  },
  dropdownList: {
    position: "absolute", // Makes it float over the graph
    top: 42, // Position it just below the header (header height + margin)
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    maxHeight: 200, // Optional: add height limit if you have many items
    zIndex: 1000, // Ensure it's the top-most layer
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    overflow: "hidden", // Keeps items within the rounded borders
  },
  headerText: {
    fontWeight: "600",
    color: "#333",
  },
  item: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemText: {
    textAlign: "center",
    color: "#2563eb",
  },
});

export default Minitool_3;
