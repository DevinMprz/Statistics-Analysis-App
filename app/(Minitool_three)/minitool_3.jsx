import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Text,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ScatterPlot from "./chart_components/ScatterPlot";
import ScatterControls from "./controls/ScatterControls";
import DataInfo from "./modals/DataInfo";
import bivariateData from "../../data/bivariate_set.json";

const Minitool_3 = () => {
  const [displayMode, setDisplayMode] = useState("dots");

  const [currentKey, setCurrentKey] = useState("dataset1");
  const [isOpen, setIsOpen] = useState(false);

  const currentData = bivariateData[currentKey];

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
        >
          {/* The Dropdown Overaly */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsOpen(!isOpen)}
            >
              <Text style={styles.headerText}>{currentKey} ▼</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.dropdownList}>
                {Object.keys(bivariateData).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.item}
                    onPress={() => {
                      setCurrentKey(key);
                      setIsOpen(false);
                    }}
                  >
                    <Text style={styles.itemText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Main Chart Section */}
          <View style={styles.chartSection}>
            <ScatterPlot data={currentData} />
          </View>

          {/* Controls and Info Row */}
          <View style={styles.controlsSection}>
            <View style={{ flex: 1 }}>
              <ScatterControls onDisplayModeChange={setDisplayMode} />
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
