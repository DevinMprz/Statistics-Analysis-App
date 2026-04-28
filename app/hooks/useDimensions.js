import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

/**
 * Custom hook to listen to dimension changes
 * Returns the current window dimensions and updates on screen resize
 */
const useDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const handleDimensionChange = ({ window }) => {
      setDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      "change",
      handleDimensionChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return dimensions;
};

export default useDimensions;
