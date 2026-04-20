import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Button,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import UploadDataset from "../../components/UploadDataset";

import RNPickerSelect from 'react-native-picker-select';
import { CholesterolLevelChart, defaultSettings as chartDefaultSettings } from './minitool_2_components/minitool_2_chart';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import data
import cholesterolData from '../../data/cholesterol.json';
import speedtrapData from '../../data/speedtrap.json';
import {
  calculateCombinedExtent,
  generateCholesterolData,
  loadAllDatasets,
} from '../../data/_data';

const cholesterolExtent = calculateCombinedExtent([cholesterolData.before, cholesterolData.after]);
const speedtrapExtent = calculateCombinedExtent([speedtrapData.before, speedtrapData.after]);

const scenarioPresets = {
    cholesterol: {
        label: 'Cholesterol Levels',
        data: cholesterolData,
        settings: {
            ...chartDefaultSettings,
            chartName: "Cholesterol",
            xDomain: { 
                min: Math.floor(cholesterolExtent.min), 
                max: Math.ceil(cholesterolExtent.max) 
            },
            xAxisStep: 2,
            initialIntervalWidth: 10,
        },
        component: CholesterolLevelChart,
    },
    speedtrap: {
        label: 'Speed Trap',
        data: speedtrapData,
        settings: {
            ...chartDefaultSettings,
            chartName: "Speed Trap",
            xDomain: { 
                min: Math.floor(speedtrapExtent.min), 
                max: Math.ceil(speedtrapExtent.max) 
            },
            xAxisStep: 5,
            initialIntervalWidth: 5,
        },
        component: CholesterolLevelChart,
    },
};

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

// API Configuration
const API_URL = "http://localhost:5000/api/scenarios";

const CholesterolPage = () => {
    const [selectedScenario, setSelectedScenario] = useState('cholesterol');
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    // Database-related state
    const [dbScenarios, setDbScenarios] = useState([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
    const [showScenariosModal, setShowScenariosModal] = useState(false);
    const [scenarioName, setScenarioName] = useState("");
    const [isSavingScenario, setIsSavingScenario] = useState(false);

    // State for loaded scenario data (overrides default data when loaded from DB)
    const [loadedScenarioData, setLoadedScenarioData] = useState(null);
    const [loadedScenarioName, setLoadedScenarioName] = useState(null);

    const handleScenarioChange = (value) => {
        if (value) {
            setSelectedScenario(value);
            // Clear any loaded DB scenario when switching presets
            setLoadedScenarioData(null);
            setLoadedScenarioName(null);
        }
    };

    // --- Database Functions ---
    const fetchScenarios = async () => {
        setIsLoadingScenarios(true);
        try {
            const response = await fetch(API_URL);
            const result = await response.json();
            if (result.success) {
                const filteredScenarios = result.data.filter(
                    (scenario) => scenario.toolType === "minitool2_cholesterol",
                );
                setDbScenarios(filteredScenarios);
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
            const currentPreset = scenarioPresets[selectedScenario];
            const dataToSave = loadedScenarioData || currentPreset.data;

            const scenarioData = {
                name: scenarioName,
                description: `${currentPreset.label} scenario`,
                toolType: "minitool2_cholesterol",
                data: {
                    dataBefore: dataToSave.before,
                    dataAfter: dataToSave.after,
                    scenarioType: selectedScenario,
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
                setLoadedScenarioData({
                    before: scenarioData.dataBefore,
                    after: scenarioData.dataAfter,
                });
                setLoadedScenarioName(result.data.name);
                if (scenarioData.scenarioType && scenarioPresets[scenarioData.scenarioType]) {
                    setSelectedScenario(scenarioData.scenarioType);
                }
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

    const ActiveScenario = useMemo(() => {
        const scenario = scenarioPresets[selectedScenario];
        if (!scenario) return null;

        const ScenarioComponent = scenario.component;
        const chartWidth = screenWidth < SMALL_SCREEN_THRESHOLD ? screenWidth * 0.9 : screenWidth * 0.8;

        // Use loaded DB data if available, otherwise use preset data
        const data = loadedScenarioData || scenario.data;

        return (
            <ScenarioComponent
                {...scenario.settings}
                data={data}
                width={chartWidth}
                height={180}
                dotRadius={5}
            />
        );
    }, [selectedScenario, loadedScenarioData]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.moduleContainer}>
                        <Text style={styles.moduleTitle}>
                            Module One: Cholesterol & Speed Trap Scenarios
                        </Text>
                        {loadedScenarioName && (
                            <Text style={styles.loadedScenarioText}>
                                Loaded: {loadedScenarioName}
                            </Text>
                        )}
                        <TouchableOpacity
                            onPress={() => setIsLegendOpen(!isLegendOpen)}
                            style={styles.legendToggle}
                        >
                            <Text style={styles.legendToggleText}>
                                {isLegendOpen ? "▼" : "►"} About The Charts
                            </Text>
                        </TouchableOpacity>
                        {isLegendOpen && (
                            <View style={styles.legendContent}>
                                <Text style={styles.legendTitle}>
                                    Scenario Analysis
                                </Text>
                                <Text style={styles.legendText}>
                                    <Text style={styles.legendTextBold}>What is this?</Text> These
                                    charts display data for different scenarios. By default, data points from
                                    <Text style={styles.legendTextBold}> before</Text> an event are shown in{" "}
                                    <Text style={{ color: "blue", fontWeight: "bold" }}>BLUE</Text>{" "}
                                    and data points from
                                    <Text style={styles.legendTextBold}> after</Text> are shown in{" "}
                                    <Text style={{ color: "orange", fontWeight: "bold" }}>ORANGE</Text>.
                                    When you 'Split Charts', the data will be separated into two distinct charts for clearer comparison.
                                </Text>
                                <Text style={styles.legendText}>
                                    <Text style={styles.legendTextBold}>Why is it useful?</Text>{" "}
                                    Comparing the two charts helps to see the effect of the event. You can look for
                                    changes in how the dots are spread out or grouped.
                                </Text>
                                <Text style={styles.legendText}>
                                    <Text style={styles.legendTextBold}>What can you do?</Text>
                                    {"\n"}- Use the 'Select Scenario' dropdown to switch between 'Cholesterol Levels' and 'Speed Trap' data.
                                    {"\n"}- Use the 'Split Colors' checkbox to toggle between a combined view and a split view.
                                    {"\n"}- Toggle{" "}
                                    <Text style={styles.legendTextBold}>'Show Data'</Text> to view
                                    or hide the individual data points (dots).
                                    {"\n"}- Enable{" "}
                                    <Text style={styles.legendTextBold}>'Create Boxes'</Text>:
                                    Then, tap directly on the chart area to add vertical lines.
                                    {"\n"}-{" "}
                                    <Text style={styles.legendTextBold}>Drag the squares</Text>{" "}
                                    on the lines to reposition them. The numbers between the lines show
                                    how many data points fall into that range.
                                    {"\n"}- Use the{" "}
                                    <Text style={styles.legendTextBold}>'Clear All Lines'</Text>{" "}
                                    button to remove all lines.
                                    {"\n"}- Use the{" "}
                                    <Text style={styles.legendTextBold}>
                                    'Groups'
                                    </Text>{" "}
                                    dropdown to automatically divide the data based on
                                    statistical values.
                                </Text>
                            </View>
                        )}
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Select Scenario:</Text>
                            <RNPickerSelect
                                onValueChange={handleScenarioChange}
                                items={Object.keys(scenarioPresets).map(key => ({
                                    label: scenarioPresets[key].label,
                                    value: key,
                                }))}
                                style={pickerSelectStyles}
                                value={selectedScenario}
                                placeholder={{}}
                            />
                        </View>
                        <View style={styles.chartContainer}>
                            {ActiveScenario}
                        </View>

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
                            <UploadDataset
                                name="My Cholesterol Data"
                                description="Class experiment results"
                                toolType="minitool2_cholesterol"
                                onSuccess={(scenario) => console.log("Saved:", scenario._id)}
                                onError={(msg) => console.warn(msg)}
                            />
                        
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
                                ) : dbScenarios.length === 0 ? (
                                    <Text style={styles.noScenariosText}>
                                        No scenarios saved yet
                                    </Text>
                                ) : (
                                    <FlatList
                                        data={dbScenarios}
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
};

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
    loadedScenarioText: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    pickerContainer: {
        width: '90%',
        marginBottom: 20,
        zIndex: 10,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    chartContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    legendToggle: {
        backgroundColor: "#e0e0e0",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginVertical: 10,
        alignItems: "center",
        width: "95%",
        alignSelf: "center",
    },
    legendToggleText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "navy",
    },
    legendContent: {
        width: "95%",
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
      paddingRight: 30,
      backgroundColor: 'white',
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 0.5,
      borderColor: 'purple',
      borderRadius: 8,
      color: 'black',
      paddingRight: 30,
      backgroundColor: 'white',
    },
  });

export default CholesterolPage;
