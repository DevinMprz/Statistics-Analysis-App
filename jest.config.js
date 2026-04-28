module.exports = {
  projects: [
    // ---------- Project 1: Logic-only tests (no React Native setup) ----------
    {
      displayName: 'logic',
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transformIgnorePatterns: [
        'node_modules/(?!(d3-scale'
          + '|d3-array'
          + '|d3-interpolate'
          + '|d3-format'
          + '|d3-shape'
          + '|d3-color'
          + '|d3-time'
          + '|d3-time-format'
          + '|internmap'
        + ')/)',
      ],
      testMatch: [
        '<rootDir>/app/**/lib/__tests__/**/*.test.{js,jsx}',
        '<rootDir>/app/(Minitool_three)/__tests__/**/*.test.{js,jsx}',
        '<rootDir>/app/(Minitool_two)/__tests__/**/*.test.{js,jsx}',
        '<rootDir>/data/__tests__/**/*.test.{js,jsx}',
        '<rootDir>/__tests__/**/*.test.{js,jsx}',
      ],
    },
    // ---------- Project 2: UI / component tests (needs RN mocks) ----------
    {
      displayName: 'ui',
      preset: 'react-native',
      setupFilesAfterEnv: ['./jest.setup.js'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native'
          + '|@react-native'
          + '|react-native-reanimated'
          + '|react-native-vector-icons'
          + '|react-native-gesture-handler'
          + '|react-native-gifted-charts'
          + '|d3-scale'
          + '|d3-array'
          + '|d3-interpolate'
          + '|d3-format'
          + '|d3-shape'
          + '|d3-color'
          + '|d3-time'
          + '|d3-time-format'
          + '|internmap'
          + '|react-native-paper'
          + '|react-native-svg'
        + ')/)',
      ],
      testMatch: [
        '<rootDir>/app/(Minitool_one)/__tests__/**/*.test.{js,jsx}',
      ],
    },
  ],
};
