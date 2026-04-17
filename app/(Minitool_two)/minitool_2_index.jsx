import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Link, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomButton from "../../components/customButton"; // Assuming CustomButton is in components folder at root

// Define Tailwind CSS class strings for the button
// Adjusted for vertical layout: width 80%, vertical margin my-2 (approx 8px top and bottom)
const buttonTailwind = "w-[80%] bg-sky-400/75 my-2 py-[15px] px-[10px] rounded-[10px]";
const buttonTextTailwind = "text-white text-base font-bold"; // Added font-bold for consistency if needed

export default function MinitoolTwoMenu() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Minitool Two Modules</Text>
          <Text style={styles.introText}>
            Explore these interactive tools to learn about data analysis in a
            fun way!
          </Text>
          {/* Changed from styles.buttonsRow to styles.buttonsContainer for clarity */}
          <View style={styles.buttonsContainer}>
            <CustomButton
              hadlePress={() => router.push("cholesterol")}
              title="Cholesterol Level Scenario"
              containerStyles={buttonTailwind} // Use updated Tailwind string
              textStyles={buttonTextTailwind}
            />
            <CustomButton
              hadlePress={() => router.push("speedtrap")}
              title="Speed Trap Scenario"
              containerStyles={buttonTailwind} // Use updated Tailwind string
              textStyles={buttonTextTailwind}
            />
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
  introText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    // Renamed from buttonsRow and updated for vertical layout
    flexDirection: "column",
    alignItems: "center", // Center buttons horizontally
    width: "100%", // Container can take full width to center its 80% width children
    marginBottom: 20,
  },
});
