import React, { useState, useEffect } from "react";
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
import { DotHistogramView as SpeedTrapHistogram } from "./minitool_2_components/DotHistogramView"; // Adjusted path
import {
  dataBefore as speedDataBefore,
  dataAfter as speedDataAfter,
  generateSpeedTrapData,
} from "../../data/_data"; // Adjusted path
import RNPickerSelect from "react-native-picker-select"; // Added import

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

// API Configuration
const API_URL = "http://localhost:5000/api/scenarios";

export default function SpeedTrapScreen() {
  const [scenarios, setScenarios] = useState([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [speedDataBefore, setSpeedDataBefore] = useState(
    generateSpeedTrapData(200, 40, 70),
  );
  const [speedDataAfter, setSpeedDataAfter] = useState(
    generateSpeedTrapData(200, 40, 65),
  );

  // State for loaded scenario data
  const [loadedScenarioBefore, setLoadedScenarioBefore] = useState(null);
  const [loadedScenarioAfter, setLoadedScenarioAfter] = useState(null);
  const [loadedScenarioName, setLoadedScenarioName] = useState(null);

  // State for scenario dropdown selectors
  const [selectedScenarioBeforeId, setSelectedScenarioBeforeId] =
    useState(null);
  const [selectedScenarioAfterId, setSelectedScenarioAfterId] = useState(null);

  const speedTrapHistogramContainerWidth =
    screenWidth < SMALL_SCREEN_THRESHOLD
      ? screenWidth * 0.9
      : screenWidth * 0.8;

  // Use loaded scenario data if available, otherwise use current speedData
  const displayDataBefore =
    loadedScenarioBefore !== null ? loadedScenarioBefore : speedDataBefore;
  const displayDataAfter =
    loadedScenarioAfter !== null ? loadedScenarioAfter : speedDataAfter;
  const displayData = [displayDataBefore, displayDataAfter];

  // --- Database Functions ---
  const fetchScenarios = async () => {
    setIsLoadingScenarios(true);
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.success) {
        // Filter scenarios to only show those for this tool
        const filteredScenarios = result.data.filter(
          (scenario) => scenario.toolType === "minitool2_speedtrap",
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
        description: "Speed trap scenario",
        toolType: "minitool2_speedtrap",
        data: {
          dataBefore: speedDataBefore,
          dataAfter: speedDataAfter,
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
        // Load actual data directly instead of using speedData state
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module Two: Speed Trap Scenario
            </Text>

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

            <SpeedTrapHistogram
              width={speedTrapHistogramContainerWidth}
              height={220}
              data={displayData}
              dotRadius={4}
              initialIntervalWidth={5}
              chartName="Vehicle Speeds"
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
    flexGrow: 1, // Ensure ScrollView takes up space
    justifyContent: "center", // Center content if it's less than screen height
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
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
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
