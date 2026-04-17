import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const Minitool_three_layout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="minitool_3"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar backgroundColor="#2a7f9f" barStyle="light-content" />
    </>
  );
};

export default Minitool_three_layout;
