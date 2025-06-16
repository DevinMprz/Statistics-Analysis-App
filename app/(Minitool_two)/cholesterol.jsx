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
            key.toLowerCase().includes("before")
        )
        .map((key) => ({ label: key, value: key }));
      setPickerItemsBefore(cholesterolItemsBefore);

      // Populate After Picker Items
      const allAfterDatasets = { ...loadedDatasets, ...generatedAfterDatasets };
      const cholesterolItemsAfter = Object.keys(allAfterDatasets)
        .filter(
          (key) =>
            key.toLowerCase().includes("cholesterol") ||
            key.toLowerCase().includes("after")
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
              : cholesterolItemsAfter[0].value
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
      numMaxVal
    );
    const newKey = `${datasetNamePrefix} ${counter + 1}`;
    setCounter((prev) => prev + 1);
    setGeneratedDatasets((prev) => ({ ...prev, [newKey]: newGeneratedData }));
  };

  const cholesterolChartContainerWidth =
    screenWidth < SMALL_SCREEN_THRESHOLD
      ? screenWidth * 0.9
      : screenWidth * 0.8;

  const dataToDisplayBefore =
    datasets[selectedDatasetBeforeKey] ||
    generatedBeforeDatasets[selectedDatasetBeforeKey] ||
    fallbackDataBefore;
  const dataToDisplayAfter =
    datasets[selectedDatasetAfterKey] ||
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
                  useNativeAndroidPickerStyle={false} // Recommended for consistent styling
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
          </View>
        </ScrollView>
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
