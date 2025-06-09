import React from "react";
import { SafeAreaView, View, Text, ScrollView } from "react-native";
import {
  GestureHandlerRootView
} from "react-native-gesture-handler";
import { Minitool_2_chart } from "./minitool_2_components/minitool_2_chart"; // Import as named export
import { dataBefore, dataAfter } from "../../data/_data";

import Animated from 'react-native-reanimated';

export default function minitool_2() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
        <ScrollView>
          <View style={{ padding: 16 }}>
            {/* Make text more visible with explicit styling */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                color: "black",
                textAlign: "center",
              }}
            >
              Speed Trap Test
            </Text>
          </View>
          <Animated.View>
            {/* Pass props directly instead of nested in settings */}
            <Minitool_2_chart
              width={400}
              height={100}
              dotRadius={5}
              dotColor="blue"
              data={dataBefore}
              enablePopup={false}
            />
          </Animated.View>
          <Animated.View>
            <Minitool_2_chart
              width={400}
              height={100}
              dotRadius={5}
              dotColor="yellow"
              data={dataAfter}
              enablePopup={false}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}