import React from "react";
import { SafeAreaView, ScrollView } from "react-native";
import SpeedTrapMinitool from "./_layout";
import { dataBefore, dataAfter } from "../../data/_data";

export default function minitool_2() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>{dataBefore || "No data before available"}</Text>
      <Text style={{ color: dataAfter ? "black" : "red" }}>
        {dataAfter || "No data after available"}
      </Text>
      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
       <SpeedTrapMinitool 
  settings={{
    width: 400,
    height: 150,
    data: yourDataArray,
    dotRadius: 5,
    dotColor: "blue",
    thresholdColor: "crimson",
    axisColor: "#333"
  }}
/>
      </ScrollView>
    </SafeAreaView>
  );
}
