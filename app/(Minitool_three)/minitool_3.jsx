import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Button, // Removed TextInput as it's no longer used for global controls
  TouchableOpacity, // Added for data selection buttons
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
// import DotHistogramView from "../(Minitool_two)/minitool_2_components/DotHistogramView"; // Removed old import
import ScatterPlotView from "./minitool_3_components/ScatterPlotView"; // Import the new ScatterPlotView
import {
  sampleScatterData1,
  sampleScatterData2,
} from "../data/_data_minitool_three"; // Import scatter plot data

const screenWidth = Dimensions.get("window").width;

const minitool_3 = () => {
  // State to hold the currently selected dataset
  const [currentDataset, setCurrentDataset] = useState(sampleScatterData1);
  const [currentDatasetName, setCurrentDatasetName] = useState(
    "Dataset 1 (Positive Correlation)"
  );

  // Data options for selection
  const datasets = [
    {
      name: "Dataset 1 (Positive Correlation)",
      data: sampleScatterData1,
      xLabel: "Variable X1",
      yLabel: "Variable Y1",
    },
    {
      name: "Dataset 2 (Negative Correlation)",
      data: sampleScatterData2,
      xLabel: "Variable X2",
      yLabel: "Variable Y2",
    },
    // Add more datasets here if needed
  ];

  const handleDatasetChange = (dataset) => {
    setCurrentDataset(dataset.data);
    setCurrentDatasetName(dataset.name);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <Text style={styles.mainTitle}>
          Minitool Three: Bivariate Data Explorer
        </Text>

        {/* Data Selection Controls */}
        <View style={styles.dataSelectionContainer}>
          <Text style={styles.controlTitle}>Select Dataset:</Text>
          <View style={styles.datasetButtons}>
            {datasets.map((ds) => (
              <TouchableOpacity
                key={ds.name}
                style={[
                  styles.datasetButton,
                  currentDatasetName === ds.name && styles.datasetButtonActive,
                ]}
                onPress={() => handleDatasetChange(ds)}
              >
                <Text
                  style={
                    currentDatasetName === ds.name
                      ? styles.datasetButtonTextActive
                      : styles.datasetButtonText
                  }
                >
                  {ds.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scatter Plot View takes up the main space */}
        {/* Use a ScrollView in case the ScatterPlotView or its controls become too tall */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.chartContainer}>
            <ScatterPlotView
              data={currentDataset}
              // You can pass specific settings for width/height or let ScatterPlotView use its defaults
              // settings={{ width: screenWidth * 0.95, height: 450 }}
              xAxisLabel={
                datasets.find((ds) => ds.name === currentDatasetName)?.xLabel ||
                "X-Axis"
              }
              yAxisLabel={
                datasets.find((ds) => ds.name === currentDatasetName)?.yLabel ||
                "Y-Axis"
              }
            />
          </View>
        </ScrollView>

        {/* Removed old controlsArea for global interval width */}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default minitool_3;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F8FF", // Light blue background
  },
  mainTitle: {
    fontSize: 20, // Slightly smaller for a cleaner look
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#2c3e50", // Darker, more modern blue
  },
  dataSelectionContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#ecf0f1", // Light grey background for controls
    borderBottomWidth: 1,
    borderBottomColor: "#bdc3c7", // Slightly darker border
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: "600", // Semi-bold
    textAlign: "center",
    marginBottom: 10,
    color: "#34495e", // Another shade of blue/grey
  },
  datasetButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap", // Allow buttons to wrap on smaller screens
  },
  datasetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff", // White buttons
    borderRadius: 20, // Rounded buttons
    borderWidth: 1,
    borderColor: "#3498db", // Blue border
    margin: 5,
  },
  datasetButtonActive: {
    backgroundColor: "#3498db", // Blue background for active
    borderColor: "#2980b9", // Darker blue border for active
  },
  datasetButtonText: {
    color: "#3498db", // Blue text
    fontWeight: "500",
  },
  datasetButtonTextActive: {
    color: "#ffffff", // White text for active
    fontWeight: "500",
  },
  scrollViewContent: {
    alignItems: "center", // Center the chart container if it's narrower than ScrollView
    paddingVertical: 10,
  },
  chartContainer: {
    width: screenWidth, // Make chart container take full width
    alignItems: "center", // Center ScatterPlotView within this container
    // backgroundColor: '#fff', // Optional: if you want a white card bg for the chart
    // borderRadius: 8,
    // padding: 10,
    // elevation: 2, // Android shadow
    // shadowColor: '#000', // iOS shadow
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 1.41,
  },
  // Removed old styles: columnContainer, categoryTitle, controlsArea, controlRow, controlLabel, input
});
