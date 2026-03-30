import React, { useState, useCallback } from "react";
import { View, Text, Switch, Button, StyleSheet } from "react-native";

/**
 * ChartControls Hook
 * Encapsulates all chart control logic including sorting, filtering, and tool toggles
 * Returns state setters and a renderControls() function for rendering
 */
const useChartControls = () => {
  // --- Control state ---
  const [isSortedBySize, setIsSortedBySize] = useState(false);
  const [isSortedByColor, setIsSortedByColor] = useState(false);
  const [hideGreenBars, setHideGreenBars] = useState(false);
  const [hidePurpleBars, setHidePurpleBars] = useState(false);
  const [showDotsOnly, setShowDotsOnly] = useState(false);
  const [valueToolActive, setValueToolActive] = useState(false);
  const [rangeToolActive, setRangeToolActive] = useState(false);

  // --- Handler functions ---
  const handleSortBySize = useCallback((isActive) => {
    setIsSortedBySize(isActive);
    // When sorting by size, turn off color sort
    if (isActive) {
      setIsSortedByColor(false);
    }
  }, []);

  const handleSortByColor = useCallback((isActive) => {
    setIsSortedByColor(isActive);
    // When sorting by color, turn off size sort
    if (isActive) {
      setIsSortedBySize(false);
    }
  }, []);

  const handleValueTool = useCallback((isActive) => {
    setValueToolActive(isActive);
  }, []);

  const handleRangeTool = useCallback((isActive) => {
    setRangeToolActive(isActive);
  }, []);

  const handleHideGreenBars = useCallback((isActive) => {
    setHideGreenBars(isActive);
  }, []);

  const handleHidePurpleBars = useCallback((isActive) => {
    setHidePurpleBars(isActive);
  }, []);

  const handleShowDotsOnly = useCallback((isActive) => {
    setShowDotsOnly(isActive);
  }, []);

  // --- Render component with all controls ---
  const renderControls = useCallback(
    () => (
      <View style={styles.controlsContainer}>
        {/* --- Tool toggles --- */}
        <View style={styles.switchControl}>
          <Text>Value tool</Text>
          <Switch value={valueToolActive} onValueChange={handleValueTool} />
          <Text>Range tool</Text>
          <Switch value={rangeToolActive} onValueChange={handleRangeTool} />
        </View>

        {/* --- Visibility filters --- */}
        <View style={styles.switchControl}>
          <Text>Hide Green Bars</Text>
          <Switch value={hideGreenBars} onValueChange={handleHideGreenBars} />
          <Text>Hide Purple Bars</Text>
          <Switch value={hidePurpleBars} onValueChange={handleHidePurpleBars} />
          <Text>Show Dots Only</Text>
          <Switch value={showDotsOnly} onValueChange={handleShowDotsOnly} />
        </View>

        {/* --- Sorting controllers --- */}
        <View style={styles.switchControl}>
          <Button
            title="Sort by Color"
            onPress={() => handleSortByColor(!isSortedByColor)}
          />
          <Button
            title="Sort by Size"
            onPress={() => handleSortBySize(!isSortedBySize)}
          />
        </View>
      </View>
    ),
    [
      valueToolActive,
      rangeToolActive,
      hideGreenBars,
      hidePurpleBars,
      showDotsOnly,
      isSortedByColor,
      isSortedBySize,
    ]
  );

  return {
    // State
    isSortedBySize,
    isSortedByColor,
    hideGreenBars,
    hidePurpleBars,
    showDotsOnly,
    valueToolActive,
    rangeToolActive,

    // Setters
    setIsSortedBySize,
    setIsSortedByColor,
    setHideGreenBars,
    setHidePurpleBars,
    setShowDotsOnly,
    setValueToolActive,
    setRangeToolActive,

    // Handlers
    handleSortBySize,
    handleSortByColor,
    handleValueTool,
    handleRangeTool,
    handleHideGreenBars,
    handleHidePurpleBars,
    handleShowDotsOnly,

    // Render function
    renderControls,
  };
};

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  switchControl: {
    flexDirection: "column",
    justifyContent: "center",
  },
});

export default useChartControls;
