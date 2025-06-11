import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Link, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomButton from "../../components/customButton"; // Assuming CustomButton is in components folder at root

// Define Tailwind CSS class strings for the button
const buttonInRowTailwind = "py-[15px] px-[10px] rounded-[10px]";
const buttonTextTailwind = "text-white text-base";

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
          <View style={styles.buttonsRow}>
            <CustomButton
              handlePress={() => router.push("cholesterol")}
              title="Cholesterol Level Scenario"
              containerStyles={buttonInRowTailwind}
              textStyles={buttonTextTailwind}
            />
            <CustomButton
              handlePress={() => router.push("speedtrap")}
              title="Speed Trap Scenario"
              containerStyles={buttonInRowTailwind}
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
    marginBottom: 20, // Adjusted margin
    color: "black",
  },
  introText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between", // This will space out the two buttons
    width: "50%", // Adjusted width to make buttons fill more space
    alignSelf: "center",
    marginBottom: 20,
  },
});
