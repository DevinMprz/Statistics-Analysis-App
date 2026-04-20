import React, { useState } from "react";
import { Text, Pressable, StyleSheet, Platform, View } from "react-native";

/**
 * @param {{
 * title: string,
 * onPress: () => void,
 * colorScheme?: 'primary' | 'secondary' | 'default',
 * containerStyles?: import('react-native').ViewStyle,
 * textStyles?: import('react-native').TextStyle,
 * disabled?: boolean
 * }} props
 */
const UniverseButton = ({
  title,
  onPress,
  colorScheme = "primary", // Default to blue
  containerStyles,
  textStyles,
  disabled,
}) => {
  // Track hover state for Web
  const [isHovered, setIsHovered] = useState(false);

  // Helper to determine the correct color styles based on the scheme and state
  const getColorStyles = (pressedOrHovered) => {
    switch (colorScheme) {
      case "primary": // Primary Blue
        return {
          inactive: styles.buttonSchemePrimaryInactive,
          active: styles.buttonSchemePrimaryActive,
          textInactive: styles.textSchemePrimaryInactive,
          textActive: styles.textSchemePrimaryActive,
        };
      case "secondary": // Secondary Red
        return {
          inactive: styles.buttonSchemeSecondaryInactive,
          active: styles.buttonSchemeSecondaryActive,
          textInactive: styles.textSchemeSecondaryInactive,
          textActive: styles.textSchemeSecondaryActive,
        };
      case "default": // Grayscale (for general purpose)
      default:
        return {
          inactive: styles.buttonSchemeDefaultInactive,
          active: styles.buttonSchemeDefaultActive,
          textInactive: styles.textSchemeDefaultInactive,
          textActive: styles.textSchemeDefaultActive,
        };
    }
  };

  const schemeStyles = getColorStyles();
  const isActive = isHovered && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Mouse interactions for Web
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => {
        const currentActiveState = (pressed || isHovered) && !disabled;

        return [
          styles.baseButton,
          // Apply inactive color scheme
          !currentActiveState && schemeStyles.inactive,
          // Apply active/hovered style and color scheme
          currentActiveState && [styles.buttonActiveBase, schemeStyles.active],
          // Apply transform lift only on actual press
          pressed && !disabled && { transform: [{ translateY: -2 }] },
          containerStyles,
        ];
      }}
    >
      {({ pressed }) => {
        const currentActiveState = (pressed || isHovered) && !disabled;

        return (
          <Text
            style={[
              styles.baseText,
              // Invert text color if Pressed or Hovered
              !currentActiveState && schemeStyles.textInactive,
              currentActiveState && schemeStyles.textActive,
              textStyles,
            ]}
          >
            {title}
          </Text>
        );
      }}
    </Pressable>
  );
};

// Colors based on your tool's existing palette
const COLOR_PRIMARY_DARK = "#1e3a8a"; // Matches existing dark blue text
const COLOR_PRIMARY_LIGHT = "#87CEFA"; // Lightest blue from chart area / dropdown
const COLOR_SECONDARY_DARK = "#D32F2F"; // Matching MD error red / existing red button border

const styles = StyleSheet.create({
  // --- FIXED BASE STYLES ---
  baseButton: {
    borderWidth: 1, // Refined to 1px for a cleaner look
    borderColor: "#e5e7eb", // Initial grey border, scheme will override
    borderRadius: 8, // Subtler radius
    minHeight: 40, // Shorter for a more standard button feel
    paddingHorizontal: 30, // Good horizontal spacing
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // Standard starting background

    // Platform-specific interactions
    ...Platform.select({
      web: {
        cursor: "pointer",
        transitionDuration: "300ms", // Smooth transition
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
    }),
  },
  baseText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase", // Match the look in the image
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },

  // Base style for Active state
  buttonActiveBase: {
    elevation: 8, // Android shadow
    shadowOpacity: 0.25, // iOS shadow
  },

  // --- COLOR SCHEMES ---

  // 1. PRIMARY (BLUE)
  buttonSchemePrimaryInactive: {
    borderColor: COLOR_PRIMARY_DARK,
    backgroundColor: "white",
  },
  buttonSchemePrimaryActive: {
    borderColor: COLOR_PRIMARY_LIGHT,
    backgroundColor: COLOR_PRIMARY_LIGHT,
  },
  textSchemePrimaryInactive: {
    color: COLOR_PRIMARY_DARK,
  },
  textSchemePrimaryActive: {
    color: "white",
  },

  // 2. SECONDARY (RED)
  buttonSchemeSecondaryInactive: {
    borderColor: COLOR_SECONDARY_DARK,
    backgroundColor: "white",
  },
  buttonSchemeSecondaryActive: {
    borderColor: COLOR_SECONDARY_DARK,
    backgroundColor: COLOR_SECONDARY_DARK,
  },
  textSchemeSecondaryInactive: {
    color: COLOR_SECONDARY_DARK,
  },
  textSchemeSecondaryActive: {
    color: "white",
  },

  // 3. DEFAULT (GREYSCALE)
  buttonSchemeDefaultInactive: {
    borderColor: "#6B7280", // Default grey border
    backgroundColor: "white",
  },
  buttonSchemeDefaultActive: {
    borderColor: "#6B7280",
    backgroundColor: "#6B7280",
  },
  textSchemeDefaultInactive: {
    color: "#6B7280",
  },
  textSchemeDefaultActive: {
    color: "white",
  },
});

export default UniverseButton;
