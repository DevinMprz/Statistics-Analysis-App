import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';
// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback.
  // Original mock doesn't include this, so we add it.
  Reanimated.default.call = (cb) => cb();

  return Reanimated;
});


// Mock gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  BarChart: (props) => {
    // We can use a testID to inspect the data passed to it
    return <div testID="bar-chart" data-props={JSON.stringify(props.data)} />;
  },
}));


// Mock child components to isolate the Minitool_1 component
jest.mock('./app/(Minitool_one)/minitool_one_components/customTabBar', () => 'CustomTabBar');
jest.mock('./components/customButton', () => {
    // A mock that simulates the button's behavior
    const { Text, TouchableOpacity } = require('react-native');
    return ({ title, hadlePress, containerStyles }) => (
        <TouchableOpacity onPress={hadlePress} testID={`custom-button-${title.replace(/\s+/g, '-')}`}>
            <Text>{title}</Text>
        </TouchableOpacity>
    );
});
jest.mock('./app/(Minitool_one)/minitool_one_components/customDataForm', () => 'CustomDataForm');