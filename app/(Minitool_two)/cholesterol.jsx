import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { CholesterolLevelChart, defaultSettings as chartDefaultSettings } from './minitool_2_components/minitool_2_chart';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import data
import cholesterolData from '../../data/cholesterol.json';
import speedtrapData from '../../data/speedtrap.json';
import { calculateCombinedExtent } from '../../data/_data';

const cholesterolExtent = calculateCombinedExtent([cholesterolData.before, cholesterolData.after]);
const speedtrapExtent = calculateCombinedExtent([speedtrapData.before, speedtrapData.after]);

const scenarios = {
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
        component: CholesterolLevelChart, // Using the same versatile chart component
    },
};

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

const CholesterolPage = () => {
    const [selectedScenario, setSelectedScenario] = useState('cholesterol');
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    const handleScenarioChange = (value) => {
        if (value) {
            setSelectedScenario(value);
        }
    };

    const ActiveScenario = useMemo(() => {
        const scenario = scenarios[selectedScenario];
        if (!scenario) return null;

        const ScenarioComponent = scenario.component;
        const chartWidth = screenWidth < SMALL_SCREEN_THRESHOLD ? screenWidth * 0.9 : screenWidth * 0.8;
        
        return (
            <ScenarioComponent
                {...scenario.settings}
                data={scenario.data}
                width={chartWidth}
                height={180}
                dotRadius={5}
            />
        );
    }, [selectedScenario]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.moduleContainer}>
                        <Text style={styles.moduleTitle}>
                            Module One: Cholesterol & Speed Trap Scenarios
                        </Text>
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
                                items={Object.keys(scenarios).map(key => ({
                                    label: scenarios[key].label,
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
                    </View>
                </ScrollView>
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
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
