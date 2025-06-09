import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { SpeedTrapMinitool } from "./_layout"; // Import as named export
import { dataBefore, dataAfter } from "../../data/_data";

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
          <View>
            {/* Pass props directly instead of nested in settings */}
            <SpeedTrapMinitool
              width={400}
              height={100}
              dotRadius={5}
              dotColor="blue"
              data={dataBefore}
              enablePopup={false}
            />
          </View>
          <View>
            <SpeedTrapMinitool
              width={400}
              height={100}
              dotRadius={5}
              dotColor="yellow"
              data={dataAfter}
              enablePopup={false}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
