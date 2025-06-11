module.exports = function (api) {
  const isTest = api.caller((caller) => caller && caller.name === 'babel-jest');

  // Dynamically cache based on whether it's a test run
  api.cache(() => isTest);

  if (isTest) {
    return {
      presets: [
        ['babel-preset-expo', { jsxRuntime: 'automatic' }],
      ],
      plugins: [
        'react-native-reanimated/plugin',
      ],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
