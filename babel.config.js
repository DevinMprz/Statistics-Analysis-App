module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }], // Required for NativeWind v4
    ],
    plugins: [
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};
