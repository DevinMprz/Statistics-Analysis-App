import "react-native-gesture-handler/jestSetup";
import "@testing-library/jest-native/extend-expect";

// Global Alert
global.alert = jest.fn();

// Global Axios Mock
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { success: true, data: [] } })),
  post: jest.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
  create: jest.fn(function () {
    return this;
  }),
}));

// Reanimated (Detailed Mock for animations & tools)
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = (cb) => cb();
  return {
    ...Reanimated,
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: (callback) => callback(),
    useAnimatedReaction: jest.fn(),
    runOnJS: (fn) => fn,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
  };
});

// Gesture Handler
jest.mock("react-native-gesture-handler", () => {
  const { View, ScrollView } = require("react-native");
  const createMockGesture = () => {
    const obj = {};
    const methods = [
      "activeOffsetX",
      "activeOffsetY",
      "onBegin",
      "onStart",
      "onUpdate",
      "onEnd",
      "onFinalize",
    ];
    methods.forEach((m) => (obj[m] = jest.fn(() => obj)));
    return obj;
  };
  return {
    ScrollView,
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: { Pan: createMockGesture, Tap: createMockGesture },
    State: {},
    Directions: {},
  };
});

// Safe Area Context
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// UI & Icon Libraries
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  FontAwesome: "FontAwesome",
}));
