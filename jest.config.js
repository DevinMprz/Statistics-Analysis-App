module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.js"],

  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gifted-charts|d3-.*|internmap|react-native-reanimated|react-native-paper|react-native-linear-gradient|react-native-element-dropdown|react-native-css-interop)",
  ],

  moduleNameMapper: {
    "^nativewind/(.*)$": "nativewind/$1",
  },
};
