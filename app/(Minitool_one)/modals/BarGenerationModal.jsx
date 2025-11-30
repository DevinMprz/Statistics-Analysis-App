import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";

/**
 * BarGenerationModal Hook
 * Encapsulates all add bar modal logic including state management and validation
 * Returns state and handlers for modal management
 */
const useBarGenerationModal = ({
  onBarAdded,
  onClose,
  initialLifespan = "100",
  initialBrand = "Tough Cell",
  // Configuration constants
  MAX_LIFESPAN = 130,
  MIN_LIFESPAN = 1,
  MAX_BAR_COUNT = 20,
  currentBarCount = 0,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [barLifespanInput, setBarLifespanInput] = useState(initialLifespan);
  const [barBrandInput, setBarBrandInput] = useState(initialBrand);

  // --- Handler for opening modal ---
  const handleOpenModal = useCallback(() => {
    setBarLifespanInput(initialLifespan);
    setBarBrandInput(initialBrand);

    // Check bar count limit before opening
    if (currentBarCount >= MAX_BAR_COUNT) {
      const message = `You cannot add more than ${MAX_BAR_COUNT} batteries.`;
      if (Platform.OS === "web") {
        alert("Limit Reached\n" + message);
      } else {
        Alert.alert("Limit Reached", message);
      }
      return;
    }

    setIsModalVisible(true);
  }, [initialLifespan, initialBrand, currentBarCount, MAX_BAR_COUNT]);

  // --- Handler for canceling modal ---
  const handleCancelModal = useCallback(() => {
    setIsModalVisible(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // --- Handler for adding bar ---
  const handleAddBar = useCallback(() => {
    const lifespan = parseInt(barLifespanInput, 10);

    // Validation checks
    if (isNaN(lifespan) || lifespan < MIN_LIFESPAN || lifespan > MAX_LIFESPAN) {
      const message = `Please enter a number between ${MIN_LIFESPAN} and ${MAX_LIFESPAN}.`;
      if (Platform.OS === "web") {
        alert("Invalid Lifespan\n" + message);
      } else {
        Alert.alert("Invalid Lifespan", message);
      }
      return;
    }

    // Create new bar object
    const newBar = {
      brand: barBrandInput,
      lifespan: lifespan,
    };

    // Callback to parent with new bar
    if (onBarAdded) {
      onBarAdded(newBar);
    }

    setIsModalVisible(false);
  }, [barLifespanInput, barBrandInput, MIN_LIFESPAN, MAX_LIFESPAN, onBarAdded]);

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
            <Text style={styles.modalText}>Add a New Battery</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Lifespan (1-130):</Text>
              <TextInput
                style={styles.input}
                onChangeText={setBarLifespanInput}
                value={barLifespanInput}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.inputLabel}>Brand:</Text>
            <View style={styles.brandSelectorContainer}>
              <TouchableOpacity
                onPress={() => setBarBrandInput("Tough Cell")}
                style={[
                  styles.brandButton,
                  barBrandInput === "Tough Cell" && styles.brandButtonSelected,
                ]}
              >
                <Text style={styles.brandButtonText}>Tough Cell</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBarBrandInput("Always Ready")}
                style={[
                  styles.brandButton,
                  barBrandInput === "Always Ready" &&
                    styles.brandButtonSelected,
                ]}
              >
                <Text style={styles.brandButtonText}>Always Ready</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" color="gray" onPress={handleCancelModal} />
              <Button title="Add Bar" onPress={handleAddBar} />
            </View>
          </View>
        </View>
      </Modal>
    ),
    [
      isModalVisible,
      barLifespanInput,
      barBrandInput,
      handleCancelModal,
      handleAddBar,
    ]
  );

  return {
    // State
    isModalVisible,
    barLifespanInput,
    barBrandInput,

    // State setters
    setIsModalVisible,
    setBarLifespanInput,
    setBarBrandInput,

    // Handlers
    handleOpenModal,
    handleCancelModal,
    handleAddBar,

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
  brandSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  brandButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  brandButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#e7f3ff",
  },
  brandButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
});

export default useBarGenerationModal;
