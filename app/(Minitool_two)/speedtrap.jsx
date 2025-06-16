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
import { DotHistogramView as SpeedTrapHistogram } from "./minitool_2_components/DotHistogramView"; // Adjusted path
import {
  dataBefore as speedDataBefore,
  dataAfter as speedDataAfter,
  generateSpeedTrapData,
} from "../../data/_data"; // Adjusted path

const screenWidth = Dimensions.get("window").width;
const SMALL_SCREEN_THRESHOLD = 400;

export default function SpeedTrapScreen() {
  const speedTrapHistogramContainerWidth =
    screenWidth < SMALL_SCREEN_THRESHOLD
      ? screenWidth * 0.9
      : screenWidth * 0.8;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>
              Module Two: Speed Trap Scenario
            </Text>
            <SpeedTrapHistogram
              width={speedTrapHistogramContainerWidth}
              height={220}
              data={[
                generateSpeedTrapData(200, 40, 70),
                generateSpeedTrapData(200, 40, 65),
              ]}
              dotRadius={4}
              initialIntervalWidth={5}
              chartName="Vehicle Speeds"
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
