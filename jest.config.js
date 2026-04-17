module.exports = {
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
};
