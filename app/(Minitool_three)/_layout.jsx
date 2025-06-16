import { View, Text, StyleSheet, Image } from "react-native";
import React from "react";
import { warn } from "../../constants/icons";

const Minitool_three_layout = () => {
  return (
    <View style={styles.container}>
      <Image source={warn} style={styles.img} />

      <Text style={styles.title}>Work in Progress!</Text>

      <Text style={styles.subtitle}>
        Minitool #3 is currently under development. Please check back later!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  img: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default Minitool_three_layout;
