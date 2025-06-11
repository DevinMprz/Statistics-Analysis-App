import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Minitool_1 from '../minitool_1';

// Mock initial data to have a predictable state for tests
const mockInitialData = [
  { value: 50, label: 'Tough Cell' },
  { value: 10, label: 'Always Ready' },
  { value: 80, label: 'Tough Cell' },
];

// --- CHANGE #1: Define useSharedValue as a Jest mock function ---
jest.mock('react-native-reanimated', () => {
  // Use the actual mock and extend it
  const Reanimated = jest.requireActual('react-native-reanimated/mock'); 
  return {
    ...Reanimated,
    useSharedValue: jest.fn(), // This makes it a mock function we can configure
    useAnimatedStyle: (callback) => callback(),
    runOnJS: (fn) => fn,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
  };
});


describe('Minitool_1 Component', () => {

  beforeEach(() => {
    const { useSharedValue } = require('react-native-reanimated');
    
    // --- CHANGE #2: Use .mockReturnValue() to set the data for each test ---
    // The component expects useSharedValue() to return an object with a `.value` property.
    useSharedValue.mockReturnValue({ value: [...mockInitialData] });
  });


  test('renders correctly with initial data', () => {
    render(<Minitool_1 />);

    expect(screen.getByText('Life Span of Batteries')).toBeTruthy();
    expect(screen.getByText('Normal Data')).toBeTruthy();
    expect(screen.getByText('Sort by Label')).toBeTruthy();
    expect(screen.getByText('Sort by Value')).toBeTruthy();
  });

  test('sorts data by value when "Sort by Value" is pressed', async () => {
    render(<Minitool_1 />);
    
    const sortByValueRadio = screen.getByTestId('sort-by-value-radio');
    fireEvent.press(sortByValueRadio);

    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.props['data-props']);

      console.log(`Sorted chart data:`, chartData);

      expect(chartData[0].value).toBe(10);
      expect(chartData[1].value).toBe(50);
      expect(chartData[2].value).toBe(80);
    });
  });

  test('sorts data by label when "Sort by Label" is pressed', async () => {
    render(<Minitool_1 />);

    const sortByLabelRadio = screen.getByTestId('sort-by-value-radio');
    fireEvent.press(sortByLabelRadio);

    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.props['data-props']);
      
      expect(chartData[0].label).toBe('Always Ready');
      expect(chartData[1].label).toBe('Tough Cell');
      expect(chartData[2].label).toBe('Tough Cell');
    });
  });

  test('resets data to normal when "Normal Data" is pressed after sorting', () => {
    render(<Minitool_1 />);

    fireEvent.press(screen.getByTestId('sort-by-value-radio'));
    let barChart = screen.getByTestId('bar-chart');
    let chartData = JSON.parse(barChart.props['data-props']);
    expect(chartData[0].value).toBe(10);

    fireEvent.press(screen.getByTestId('return-to-normal'));
    barChart = screen.getByTestId('bar-chart');
    chartData = JSON.parse(barChart.props['data-props']);

    expect(chartData[0].value).toBe(50);
    expect(chartData[1].value).toBe(10);
    expect(chartData[2].value).toBe(80);
  });

  test('toggles the value tool on and off', () => {
    render(<Minitool_1 />);
    const valueToolButton = screen.findByTestId('custom-button-Value-tool');
    
    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();

    fireEvent.press(valueToolButton);
    expect(screen.findByText(/^[0-9]+$/)).toBeTruthy();

    fireEvent.press(valueToolButton);
    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();
  });

  test('toggles the range tool on and off', () => {
    render(<Minitool_1 />);
    const rangeToolButton = screen.findByTestId('custom-button-Range-tool');

    expect(screen.queryByText(/Count:/)).toBeNull();

    fireEvent.press(rangeToolButton);
    expect(screen.findByText(/Count:/)).toBeTruthy();

    fireEvent.press(rangeToolButton);
    expect(screen.queryByText(/Count:/)).toBeNull();
  });

  if(Platform.OS == 'web'){
    test('activates the data form when "Add data" is pressed', () => {

      render(<Minitool_1 />);
      const addDataButton = screen.findByTestId('custom-button-Add-data');

      expect(screen.queryByText('CustomDataForm')).toBeNull();

      fireEvent.press(addDataButton);

      expect(screen.findByText('Enter your data')).toBeTruthy();
    }); 
  }
});