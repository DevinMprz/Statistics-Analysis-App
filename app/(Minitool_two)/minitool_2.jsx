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
import { CholesterolLevelChart } from "./minitool_2_components/minitool_2_chart";
import {
  dataBefore as cholesterolDataBefore,
  dataAfter as cholesterolDataAfter,
} from "../../data/_data";
import {
  dataBefore as speedDataBefore,
  dataAfter as speedDataAfter,
} from "../../data/_data";
import { DotHistogramView as SpeedTrapHistogram } from "./minitool_2_components/DotHistogramView";

const screenWidth = Dimensions.get("window").width;

export default function minitool_2() {
  const chartWidth = screenWidth * 0.2; // 20% of screen width as per your confirmation

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              Health and Safety Data Analysis
            </Text>
          </View>

          {/* Module One: Cholesterol Level Scenario */}
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module One: Cholesterol Level Scenario
            </Text>
            <CholesterolLevelChart
              width={chartWidth * 2 + 20} // Adjust width to accommodate two charts + spacing if needed
              height={150} // Example height, adjust as needed
              dataBefore={cholesterolDataBefore}
              dataAfter={cholesterolDataAfter}
              dotRadius={5}
              xAxisStep={10} // Example step
              chartName="Cholesterol Levels"
              // enablePopup={false} // Already a default or can be set
            />
          </View>

          {/* Module Two: Speed Trap Scenario */}
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module Two: Speed Trap Scenario
            </Text>
            <SpeedTrapHistogram
              width={chartWidth * 2 + 20} // Adjust width for two internal charts
              height={200} // Example height
              // Pass data as an array: [beforeData, afterData]
              data={[speedDataBefore, speedDataAfter]}
              dotRadius={4}
              initialIntervalWidth={5} // Example interval width
              chartName="Vehicle Speeds"
              xAxisStep={10} // Example step for speed data
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
  },
  titleContainer: {
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
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
