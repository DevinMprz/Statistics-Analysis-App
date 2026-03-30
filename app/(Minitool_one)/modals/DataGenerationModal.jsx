import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";

/**
 * DataGenerationModal Hook
 * Encapsulates all data generation modal logic including state management and validation
 * Returns state and handlers for modal management
 */
const useDataGenerationModal = ({
  onDataGenerated,
  onClose,
  initialMinLifespan = "40",
  initialMaxLifespan = "120",
  initialToughCellCount = "10",
  initialAlwaysReadyCount = "10",
  // Configuration constants
  MAX_LIFESPAN = 130,
  MAX_BATTERY_COUNT_VALUE = 10,
  MIN_BATTERY_COUNT_VALUE = 1,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [minLifespanInput, setMinLifespanInput] = useState(initialMinLifespan);
  const [maxLifespanInput, setMaxLifespanInput] = useState(initialMaxLifespan);
  const [toughCellCountInput, setToughCellCountInput] = useState(
    initialToughCellCount
  );
  const [alwaysReadyCountInput, setAlwaysReadyCountInput] = useState(
    initialAlwaysReadyCount
  );

  // --- Handler for opening modal ---
  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  // --- Handler for canceling modal ---
  const handleCancelModal = useCallback(() => {
    setIsModalVisible(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // --- Handler for generating data ---
  const handleGenerateData = useCallback(() => {
    const min = parseInt(minLifespanInput, 10);
    const max = parseInt(maxLifespanInput, 10);
    const toughCellCount = parseInt(toughCellCountInput, 10);
    const alwaysReadyCount = parseInt(alwaysReadyCountInput, 10);

    // Validation checks
    if (
      isNaN(min) ||
      isNaN(max) ||
      isNaN(toughCellCount) ||
      isNaN(alwaysReadyCount) ||
      min >= max ||
      min < 0 ||
      toughCellCount < 0 ||
      alwaysReadyCount < 0 ||
      max > MAX_LIFESPAN
    ) {
      const message = `Invalid Input. Please check your values. Min Lifespan must be less than Max Lifespan, Max Lifespan must be less than ${MAX_LIFESPAN}`;
      if (Platform.OS === "web") {
        alert(message);
      } else {
        Alert.alert("Invalid Input", message);
      }
      return;
    }

    if (
      toughCellCount < MIN_BATTERY_COUNT_VALUE ||
      toughCellCount > MAX_BATTERY_COUNT_VALUE
    ) {
      const message = `Invalid Input. The number of batteries of the company ToughCell must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`;
      if (Platform.OS === "web") {
        alert(message);
      } else {
        Alert.alert("Invalid Input", message);
      }
      return;
    }

    if (
      alwaysReadyCount < MIN_BATTERY_COUNT_VALUE ||
      alwaysReadyCount > MAX_BATTERY_COUNT_VALUE
    ) {
      const message = `Invalid Input. The number of batteries of the company AlwaysReady must be greater than 0 and less than ${MAX_BATTERY_COUNT_VALUE}`;
      if (Platform.OS === "web") {
        alert(message);
      } else {
        Alert.alert("Invalid Input", message);
      }
      return;
    }

    // Generate data
    const newData = [];
    const getRandomLifespan = (minVal, maxVal) =>
      Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

    for (let i = 0; i < toughCellCount; i++) {
      newData.push({
        brand: "Tough Cell",
        lifespan: getRandomLifespan(min, max),
      });
    }
    for (let i = 0; i < alwaysReadyCount; i++) {
      newData.push({
        brand: "Always Ready",
        lifespan: getRandomLifespan(min, max),
      });
    }

    // Callback to parent with generated data
    if (onDataGenerated) {
      onDataGenerated(newData);
    }

    setIsModalVisible(false);
  }, [
    minLifespanInput,
    maxLifespanInput,
    toughCellCountInput,
    alwaysReadyCountInput,
    MAX_LIFESPAN,
    MAX_BATTERY_COUNT_VALUE,
    MIN_BATTERY_COUNT_VALUE,
    onDataGenerated,
  ]);

  // --- Render modal component ---
  const renderModal = useCallback(
    () => (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Generate New Data</Text>

            {/* --- Text inputs --- */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Min Lifespan:</Text>
              <TextInput
                style={styles.input}
                onChangeText={setMinLifespanInput}
                value={minLifespanInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Max Lifespan:</Text>
              <TextInput
                style={styles.input}
                onChangeText={setMaxLifespanInput}
                value={maxLifespanInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tough Cell Count:</Text>
              <TextInput
                style={styles.input}
                onChangeText={setToughCellCountInput}
                value={toughCellCountInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Always Ready Count:</Text>
              <TextInput
                style={styles.input}
                onChangeText={setAlwaysReadyCountInput}
                value={alwaysReadyCountInput}
                keyboardType="numeric"
              />
            </View>

            {/* --- Buttons Cancel and Generate --- */}
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" color="gray" onPress={handleCancelModal} />
              <Button title="Generate" onPress={handleGenerateData} />
            </View>
          </View>
        </View>
      </Modal>
    ),
    [
      isModalVisible,
      minLifespanInput,
      maxLifespanInput,
      toughCellCountInput,
      alwaysReadyCountInput,
      handleCancelModal,
      handleGenerateData,
    ]
  );

  return {
    // State
    isModalVisible,
    minLifespanInput,
    maxLifespanInput,
    toughCellCountInput,
    alwaysReadyCountInput,

    // State setters
    setIsModalVisible,
    setMinLifespanInput,
    setMaxLifespanInput,
    setToughCellCountInput,
    setAlwaysReadyCountInput,

    // Handlers
    handleOpenModal,
    handleCancelModal,
    handleGenerateData,

    // Render function
    renderModal,
  };
};

const styles = StyleSheet.create({
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 400,
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  inputLabel: {
    flex: 2,
    fontSize: 14,
    marginRight: 10,
    fontWeight: "500",
  },
  input: {
    flex: 1.5,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
});

export default useDataGenerationModal;
