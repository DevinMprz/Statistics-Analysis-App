import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CholesterolLevelChart } from "./minitool_2_components/minitool_2_chart"; // Adjusted path
import {
  dataBefore as cholesterolDataBefore,
  dataAfter as cholesterolDataAfter,
  generateCholesterolData,
  calculateCombinedExtent, // <--- Added import
} from "../../data/_data"; // Adjusted path

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

export default function CholesterolScreen() {
  const cholesterolChartContainerWidth =
    screenWidth < SMALL_SCREEN_THRESHOLD
      ? screenWidth * 0.9
      : screenWidth * 0.8;

  // Example usage of the new data generator:
  const generatedCholesterolDataBefore = generateCholesterolData(300, 100, 300);
  const generatedCholesterolDataAfter = generateCholesterolData(300, 100, 295);

  // Calculate the combined extent for cholesterol data
  const cholesterolExtent = calculateCombinedExtent([
    generatedCholesterolDataBefore.length > 0
      ? generatedCholesterolDataBefore
      : cholesterolDataBefore,
    generatedCholesterolDataAfter.length > 0
      ? generatedCholesterolDataAfter
      : cholesterolDataAfter,
  ]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module One: Cholesterol Level Scenario
            </Text>
            <CholesterolLevelChart
              width={cholesterolChartContainerWidth}
              height={180}
              dataBefore={
                generatedCholesterolDataBefore.length > 0
                  ? generatedCholesterolDataBefore
                  : cholesterolDataBefore
              } // Or use generatedCholesterolDataBefore
              dataAfter={
                generatedCholesterolDataAfter.length > 0
                  ? generatedCholesterolDataAfter
                  : cholesterolDataAfter
              } // Or use generatedCholesterolDataAfter
              dotRadius={5}
              chartName="Cholesterol Levels"
              xDomain={cholesterolExtent} // <--- Pass the calculated extent
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
});
