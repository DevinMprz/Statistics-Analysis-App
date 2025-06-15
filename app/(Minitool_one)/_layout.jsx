import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const Minitool_1_layout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="minitool_1"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar backgroundColor="#e5e7eb" style="auto" />
    </>
  );
};

export default Minitool_1_layout;
