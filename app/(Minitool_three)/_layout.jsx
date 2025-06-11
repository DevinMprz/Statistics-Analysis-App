import { Stack } from "expo-router";
import React from "react";

export default function MinitoolThreeLayout() {
  return (
    <Stack>
      <Stack.Screen name="minitool_3" options={{ title: "Minitool Three" }} />
    </Stack>
  );
}
