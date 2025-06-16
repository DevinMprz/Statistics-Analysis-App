import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const Minitool_2_layout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="minitool_2"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="minitool_2_index"
          options={{ title: "Minitool Two Menu" }}
        />
        <Stack.Screen
          name="cholesterol"
          options={{ title: "Cholesterol Levels" }}
        />
        <Stack.Screen name="speedtrap" options={{ title: "Speed Trap" }} />
      </Stack>

      <StatusBar backgroundColor="#e5e7eb" style="auto" />
    </>
  );
};

export default Minitool_2_layout;
