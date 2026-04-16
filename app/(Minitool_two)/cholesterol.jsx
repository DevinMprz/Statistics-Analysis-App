import React, { useState, useEffect } from "react"; // Added useState, useEffect
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CholesterolLevelChart } from "./minitool_2_components/minitool_2_chart";
import {
  dataBefore as fallbackDataBefore, // Renamed for clarity
  dataAfter as fallbackDataAfter, // Renamed for clarity
  generateCholesterolData, // Added import
  calculateCombinedExtent,
  loadAllDatasets, // Added import
} from "../../data/_data";
import RNPickerSelect from "react-native-picker-select"; // Added import

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

// API Configuration
const API_URL = "http://localhost:5000/api/scenarios";

export default function CholesterolScreen() {
  const [datasets, setDatasets] = useState({});
  const [pickerItemsBefore, setPickerItemsBefore] = useState([]); // Separate picker items
  const [pickerItemsAfter, setPickerItemsAfter] = useState([]); // Separate picker items
  const [selectedDatasetBeforeKey, setSelectedDatasetBeforeKey] =
    useState(undefined);
  const [selectedDatasetAfterKey, setSelectedDatasetAfterKey] =
    useState(undefined);

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // State for data generation - BEFORE
  const [generatedBeforeDatasets, setGeneratedBeforeDatasets] = useState({});
  const [countBefore, setCountBefore] = useState("100");
  const [minValBefore, setMinValBefore] = useState("150");
  const [maxValBefore, setMaxValBefore] = useState("250");
  const [generatedBeforeCounter, setGeneratedBeforeCounter] = useState(0);

  // State for data generation - AFTER
  const [generatedAfterDatasets, setGeneratedAfterDatasets] = useState({});
  const [countAfter, setCountAfter] = useState("100");
  const [minValAfter, setMinValAfter] = useState("140"); // Slightly different default for After
  const [maxValAfter, setMaxValAfter] = useState("240"); // Slightly different default for After
  const [generatedAfterCounter, setGeneratedAfterCounter] = useState(0);

  // State for loaded scenario data
  const [loadedScenarioBefore, setLoadedScenarioBefore] = useState(null);
  const [loadedScenarioAfter, setLoadedScenarioAfter] = useState(null);
  const [loadedScenarioName, setLoadedScenarioName] = useState(null);

  // Database-related state
  const [scenarios, setScenarios] = useState([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  // State for scenario dropdown selectors
  const [loadedScenarioId, setLoadedScenarioId] = useState(null);
  const [selectedScenarioBeforeId, setSelectedScenarioBeforeId] =
    useState(null);
  const [selectedScenarioAfterId, setSelectedScenarioAfterId] = useState(null);

  useEffect(() => {
    try {
      const loadedDatasets = loadAllDatasets();
      setDatasets(loadedDatasets);

      // Populate Before Picker Items
      const allBeforeDatasets = {
        ...loadedDatasets,
        ...generatedBeforeDatasets,
      };
      const cholesterolItemsBefore = Object.keys(allBeforeDatasets)
        .filter(
          (key) =>
            key.toLowerCase().includes("cholesterol") ||
            key.toLowerCase().includes("before"),
        )
        .map((key) => ({ label: key, value: key }));
      setPickerItemsBefore(cholesterolItemsBefore);

      // Populate After Picker Items
      const allAfterDatasets = { ...loadedDatasets, ...generatedAfterDatasets };
      const cholesterolItemsAfter = Object.keys(allAfterDatasets)
        .filter(
          (key) =>
            key.toLowerCase().includes("cholesterol") ||
            key.toLowerCase().includes("after"),
        )
        .map((key) => ({ label: key, value: key }));
      setPickerItemsAfter(cholesterolItemsAfter);

      if (cholesterolItemsBefore.length > 0 && !selectedDatasetBeforeKey) {
        setSelectedDatasetBeforeKey(cholesterolItemsBefore[0].value);
      }
      if (cholesterolItemsAfter.length > 0 && !selectedDatasetAfterKey) {
        if (
          cholesterolItemsAfter.length > 1 &&
          cholesterolItemsBefore[0].value !== cholesterolItemsAfter[0].value
        ) {
          setSelectedDatasetAfterKey(
            cholesterolItemsAfter[0].value === selectedDatasetBeforeKey
              ? cholesterolItemsAfter[1].value
              : cholesterolItemsAfter[0].value,
          );
        } else if (
          cholesterolItemsAfter.length > 1 &&
          cholesterolItemsBefore[0].value === cholesterolItemsAfter[0].value &&
          cholesterolItemsAfter[1]
        ) {
          setSelectedDatasetAfterKey(cholesterolItemsAfter[1].value);
        } else {
          setSelectedDatasetAfterKey(cholesterolItemsAfter[0].value);
        }
      }
    } catch (error) {
      console.error("Failed to load or process datasets:", error);
    }
  }, [generatedBeforeDatasets, generatedAfterDatasets]); // Re-run when generated datasets change

  // --- Database Functions ---
  const fetchScenarios = async () => {
    setIsLoadingScenarios(true);
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.success) {
        // Filter scenarios to only show those for this tool
        const filteredScenarios = result.data.filter(
          (scenario) => scenario.toolType === "minitool2_cholesterol",
        );
        setScenarios(filteredScenarios);
      } else {
        console.error("Failed to fetch scenarios:", result.error);
      }
    } catch (error) {
      console.error("Error fetching scenarios:", error);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const saveScenario = async () => {
    if (!scenarioName.trim()) {
      alert("Please enter a scenario name");
      return;
    }

    setIsSavingScenario(true);
    try {
      const scenarioData = {
        name: scenarioName,
        description: "Cholesterol scenario",
        toolType: "minitool2_cholesterol",
        data: {
          dataBefore: dataToDisplayBefore,
          dataAfter: dataToDisplayAfter,
          selectedBefore: selectedDatasetBeforeKey,
          selectedAfter: selectedDatasetAfterKey,
        },
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scenarioData),
      });

      const result = await response.json();
      if (result.success) {
        alert("Scenario saved successfully!");
        setScenarioName("");
        fetchScenarios();
      } else {
        alert("Failed to save scenario: " + result.error);
      }
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert("Error saving scenario: " + error.message);
    } finally {
      setIsSavingScenario(false);
    }
  };

  const loadScenario = async (scenarioId) => {
    try {
      const response = await fetch(`${API_URL}/${scenarioId}`);
      const result = await response.json();
      if (result.success) {
        const scenarioData = result.data.data;
        // Load actual data directly instead of using keys
        setLoadedScenarioBefore(scenarioData.dataBefore);
        setLoadedScenarioAfter(scenarioData.dataAfter);
        setLoadedScenarioName(result.data.name);
        alert("Scenario loaded successfully!");
        setShowScenariosModal(false);
      } else {
        alert("Failed to load scenario: " + result.error);
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert("Error loading scenario: " + error.message);
    }
  };

  const deleteScenario = async (scenarioId) => {
    try {
      const response = await fetch(`${API_URL}/${scenarioId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        alert("Scenario deleted successfully!");
        fetchScenarios();
      } else {
        alert("Failed to delete scenario: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting scenario:", error);
      alert("Error deleting scenario: " + error.message);
    }
  };

  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleLoadScenarioBeforeFromDropdown = async (scenarioId) => {
    if (!scenarioId) return;
    try {
      const response = await fetch(`${API_URL}/${scenarioId}`);
      const result = await response.json();
      if (result.success) {
        const scenarioData = result.data.data;
        setLoadedScenarioBefore(scenarioData.dataBefore);
        setSelectedScenarioBeforeId(scenarioId);
        setLoadedScenarioName(result.data.name);
      } else {
        alert("Failed to load scenario: " + result.error);
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert("Error loading scenario: " + error.message);
    }
  };

  const handleLoadScenarioAfterFromDropdown = async (scenarioId) => {
    if (!scenarioId) return;
    try {
      const response = await fetch(`${API_URL}/${scenarioId}`);
      const result = await response.json();
      if (result.success) {
        const scenarioData = result.data.data;
        setLoadedScenarioAfter(scenarioData.dataAfter);
        setSelectedScenarioAfterId(scenarioId);
        setLoadedScenarioName(result.data.name);
      } else {
        alert("Failed to load scenario: " + result.error);
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert("Error loading scenario: " + error.message);
    }
  };

  const handleGenerateData = (type) => {
    const count = type === "before" ? countBefore : countAfter;
    const minVal = type === "before" ? minValBefore : minValAfter;
    const maxVal = type === "before" ? maxValBefore : maxValAfter;
    const setGeneratedDatasets =
      type === "before"
        ? setGeneratedBeforeDatasets
        : setGeneratedAfterDatasets;
    const setCounter =
      type === "before" ? setGeneratedBeforeCounter : setGeneratedAfterCounter;
    const counter =
      type === "before" ? generatedBeforeCounter : generatedAfterCounter;
    const datasetNamePrefix =
      type === "before"
        ? "Generated Cholesterol Before"
        : "Generated Cholesterol After";

    const numCount = parseInt(count, 10);
    const numMinVal = parseInt(minVal, 10);
    const numMaxVal = parseInt(maxVal, 10);

    if (isNaN(numCount) || isNaN(numMinVal) || isNaN(numMaxVal)) {
      alert("Please enter valid numbers for count, min value, and max value.");
      return;
    }

    const newGeneratedData = generateCholesterolData(
      numCount,
      numMinVal,
      numMaxVal,
    );
    const newKey = `${datasetNamePrefix} ${counter + 1}`;
    setCounter((prev) => prev + 1);
    setGeneratedDatasets((prev) => ({ ...prev, [newKey]: newGeneratedData }));
  };

  const cholesterolChartContainerWidth =
    screenWidth < SMALL_SCREEN_THRESHOLD
      ? screenWidth * 0.9
      : screenWidth * 0.8;

  // Use loaded scenario data if available, otherwise use dataset keys
  const dataToDisplayBefore =
    loadedScenarioBefore !== null
      ? loadedScenarioBefore
      : datasets[selectedDatasetBeforeKey] ||
        generatedBeforeDatasets[selectedDatasetBeforeKey] ||
        fallbackDataBefore;
  const dataToDisplayAfter =
    loadedScenarioAfter !== null
      ? loadedScenarioAfter
      : datasets[selectedDatasetAfterKey] ||
        generatedAfterDatasets[selectedDatasetAfterKey] ||
        fallbackDataAfter;

  const cholesterolExtent = calculateCombinedExtent([
    dataToDisplayBefore,
    dataToDisplayAfter,
  ]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module One: Cholesterol Level Scenario
            </Text>
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
                <Text style={styles.legendTitle}>
                  Cholesterol Level Analysis
                </Text>
                <Text style={styles.legendText}>
                  <Text style={styles.legendTextBold}>What is this?</Text> These
                  charts display cholesterol levels for a group of individuals.
                  The{" "}
                  <Text style={{ color: "green", fontWeight: "bold" }}>
                    GREEN
                  </Text>{" "}
                  chart shows levels{" "}
                  <Text style={styles.legendTextBold}>before</Text> a dietary
                  change, and the{" "}
                  <Text style={{ color: "pink", fontWeight: "bold" }}>
                    PINK
                  </Text>{" "}
                  chart shows levels{" "}
                  <Text style={styles.legendTextBold}>after</Text> the diet.
                </Text>
                <Text style={styles.legendText}>
                  <Text style={styles.legendTextBold}>Why is it useful?</Text>{" "}
                  Comparing the two charts helps to see if the diet had a
                  positive effect on lowering cholesterol. You can look for
                  changes in how the dots are spread out or grouped.
                </Text>
                <Text style={styles.legendText}>
                  <Text style={styles.legendTextBold}>What can you do?</Text>
                  {"\n"}- Toggle{" "}
                  <Text style={styles.legendTextBold}>'Show Data'</Text> to view
                  or hide the individual data points (dots).
                  {"\n"}- Enable{" "}
                  <Text style={styles.legendTextBold}>'Create Boxes'</Text>:
                  Then, tap directly on the chart area to add vertical lines.
                  Small squares will appear on these lines near the x-axis.
                  {"\n"}-{" "}
                  <Text style={styles.legendTextBold}>Drag the squares</Text>{" "}
                  left or right to reposition the lines. The numbers appearing
                  between the lines (or between a line and the chart edge) show
                  how many data points fall into that specific cholesterol
                  range.
                  {"\n"}- Use the{" "}
                  <Text style={styles.legendTextBold}>'Clear All Boxes'</Text>{" "}
                  button to remove all lines you've added.
                  {"\n"}- Select{" "}
                  <Text style={styles.legendTextBold}>
                    'Groups: Two (Median)'
                  </Text>{" "}
                  or{" "}
                  <Text style={styles.legendTextBold}>'Four (Quartiles)'</Text>{" "}
                  to automatically divide the data into sections based on
                  statistical values (median or quartiles). This will replace
                  any lines you've manually created.
                </Text>
              </View>
            )}

            {/* Scenario Selector Dropdowns */}

            <View style={styles.scenarioPickerRowContainer}>
              <View style={styles.scenarioPickerWrapper}>
                <Text style={styles.pickerLabel}>Scenario 'Before':</Text>
                <RNPickerSelect
                  placeholder={{
                    label: "Select scenario (Before)",
                    value: null,
                  }}
                  items={scenarios.map((scenario) => ({
                    label: scenario.name,
                    value: scenario._id,
                  }))}
                  onValueChange={handleLoadScenarioBeforeFromDropdown}
                  style={pickerSelectStyles}
                  value={selectedScenarioBeforeId}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
              <View style={styles.scenarioPickerWrapper}>
                <Text style={styles.pickerLabel}>Scenario 'After':</Text>
                <RNPickerSelect
                  placeholder={{
                    label: "Select scenario (After)",
                    value: null,
                  }}
                  items={scenarios.map((scenario) => ({
                    label: scenario.name,
                    value: scenario._id,
                  }))}
                  onValueChange={handleLoadScenarioAfterFromDropdown}
                  style={pickerSelectStyles}
                  value={selectedScenarioAfterId}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
            </View>

            <View style={styles.dataGenerationRowContainer}>
              {/* Before Data Generation */}
              <View style={styles.dataGenerationColumnContainer}>
                <Text style={styles.dataGenerationTitle}>
                  Generate 'Before' Data
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setCountBefore}
                  value={countBefore}
                  placeholder="Count (e.g., 100)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  onChangeText={setMinValBefore}
                  value={minValBefore}
                  placeholder="Min (e.g., 150)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  onChangeText={setMaxValBefore}
                  value={maxValBefore}
                  placeholder="Max (e.g., 250)"
                  keyboardType="numeric"
                />
                <Button
                  title="Generate 'Before'"
                  onPress={() => handleGenerateData("before")}
                />
              </View>

              {/* After Data Generation */}
              <View style={styles.dataGenerationColumnContainer}>
                <Text style={styles.dataGenerationTitle}>
                  Generate 'After' Data
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setCountAfter}
                  value={countAfter}
                  placeholder="Count (e.g., 100)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  onChangeText={setMinValAfter}
                  value={minValAfter}
                  placeholder="Min (e.g., 140)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  onChangeText={setMaxValAfter}
                  value={maxValAfter}
                  placeholder="Max (e.g., 240)"
                  keyboardType="numeric"
                />
                <Button
                  title="Generate 'After'"
                  onPress={() => handleGenerateData("after")}
                />
              </View>
            </View>

            <View style={styles.pickerRowContainer}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>'Before' Dataset:</Text>
                <RNPickerSelect
                  placeholder={{ label: "Select 'Before' data", value: null }}
                  items={pickerItemsBefore} // Use before items
                  onValueChange={(value) => setSelectedDatasetBeforeKey(value)}
                  style={pickerSelectStyles}
                  value={
                    selectedDatasetBeforeKey === null
                      ? undefined
                      : selectedDatasetBeforeKey
                  } // Ensure undefined if null
                  useNativeAndroidPickerStyle={false}
                />
              </View>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>'After' Dataset:</Text>
                <RNPickerSelect
                  placeholder={{ label: "Select 'After' data", value: null }}
                  items={pickerItemsAfter} // Use after items
                  onValueChange={(value) => setSelectedDatasetAfterKey(value)}
                  style={pickerSelectStyles}
                  value={
                    selectedDatasetAfterKey === null
                      ? undefined
                      : selectedDatasetAfterKey
                  } // Ensure undefined if null
                  useNativeAndroidPickerStyle={false}
                />
              </View>
            </View>

            <CholesterolLevelChart
              width={cholesterolChartContainerWidth}
              height={180}
              dataBefore={dataToDisplayBefore}
              dataAfter={dataToDisplayAfter}
              dotRadius={5}
              chartName="Cholesterol Levels"
              xDomain={cholesterolExtent}
            />

            {/* Database Buttons */}
            <View style={styles.databaseButtonContainer}>
              <TouchableOpacity
                style={styles.databaseButton}
                onPress={() => {
                  fetchScenarios();
                  setShowScenariosModal(true);
                }}
              >
                <Text style={styles.databaseButtonText}>
                  Save/Load Scenario
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Scenarios Modal */}
        <Modal
          visible={showScenariosModal}
          transparent={true}
          animationType="slide"
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
                  placeholder="Enter scenario name"
                  value={scenarioName}
                  onChangeText={setScenarioName}
                />
                <TouchableOpacity
                  style={[styles.databaseButton, { marginTop: 10 }]}
                  onPress={saveScenario}
                  disabled={isSavingScenario}
                >
                  {isSavingScenario ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.databaseButtonText}>Save Scenario</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Load Scenario Section */}
              <View style={styles.loadScenarioSection}>
                <Text style={styles.sectionTitle}>Load Saved Scenarios</Text>
                {isLoadingScenarios ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                ) : scenarios.length === 0 ? (
                  <Text style={styles.noScenariosText}>
                    No scenarios saved yet
                  </Text>
                ) : (
                  <FlatList
                    data={scenarios}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.scenarioItem}>
                        <View style={styles.scenarioInfo}>
                          <Text style={styles.scenarioItemName}>
                            {item.name}
                          </Text>
                          <Text style={styles.scenarioItemDetails}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.scenarioActions}>
                          <TouchableOpacity
                            style={styles.loadButton}
                            onPress={() => loadScenario(item._id)}
                          >
                            <Text style={styles.buttonText}>Load</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteScenario(item._id)}
                          >
                            <Text style={styles.buttonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    style={styles.scenariosList}
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowScenariosModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  scrollViewContent: {
    alignItems: "center",
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  moduleContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "navy",
    marginBottom: 15,
    textAlign: "center",
  },
  dataGenerationRowContainer: {
    // New style for side-by-side generation forms
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginBottom: 20,
  },
  dataGenerationColumnContainer: {
    // New style for individual generation form
    flex: 1,
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5, // Add some space between forms
  },
  dataGenerationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "navy",
  },
  input: {
    // Added style
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: "100%",
    backgroundColor: "white",
  },
  pickerRowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1, // Each picker takes half the space
    marginHorizontal: 5, // Add some space between pickers
  },
  pickerLabel: {
    fontSize: 14,
    color: "navy",
    marginBottom: 5,
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
  databaseButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    marginTop: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  databaseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  databaseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
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
  scenarioPickerRowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginBottom: 20,
    alignSelf: "center",
  },
  scenarioPickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
});

// Styles for RNPickerSelect (can be customized)
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: "white",
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
    backgroundColor: "white",
    marginBottom: 10,
  },
  placeholder: {
    color: "gray",
  },
});
