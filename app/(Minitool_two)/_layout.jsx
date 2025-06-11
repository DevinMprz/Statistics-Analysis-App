// filepath: /home/denyst/develop/repos/Statistics-Analysis-App/app/_layout.jsx
import { StyleSheet, Text, View } from "react-native";
import { SplashScreen, Slot, Stack } from "expo-router";
import "../global.css";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Import this

const RootLayout = () => {
  useEffect(() => {
    SplashScreen.hideAsync();
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {" "}
      {/* Wrap here */}
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* You might have other global Stack.Screen configurations here */}
      </Stack>
    </GestureHandlerRootView>
  );
};

//npx expo start --clear -a

export default RootLayout;
