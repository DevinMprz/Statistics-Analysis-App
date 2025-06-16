import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Minitool_1 from '../minitool_1';

const mockInitialData = [
  { value: 50, label: 'Tough Cell' },
  { value: 10, label: 'Always Ready' },
  { value: 80, label: 'Tough Cell' },
];

jest.unmock('../minitool_one_components/customTabBar');

jest.mock('react-native-reanimated', () => {
 
  const Reanimated = jest.requireActual('react-native-reanimated/mock'); 
  return {
    ...Reanimated,
    useSharedValue: jest.fn(), 
    useAnimatedStyle: (callback) => callback(),
    runOnJS: (fn) => fn,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
  };
});


describe('Minitool_1 Component', () => {

  beforeEach(() => {
    const { useSharedValue } = require('react-native-reanimated');
    
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

  test('resets data to normal when "Normal Data" is pressed after sorting', async () => {
    render(<Minitool_1 />);

    fireEvent.press(screen.getByTestId('sort-by-value-radio'));
    
    await waitFor(() => {
    let barChart = screen.getByTestId('bar-chart');
    let chartData = JSON.parse(barChart.props['data-props']);
    expect(chartData[0].value).toBe(10);
    })

    fireEvent.press(screen.getByTestId('return-to-normal'));
    
    await waitFor(() => {
    barChart = screen.getByTestId('bar-chart');
    chartData = JSON.parse(barChart.props['data-props']);

    expect(chartData[0].value).toBe(50);
    expect(chartData[1].value).toBe(10);
    expect(chartData[2].value).toBe(80);
    })
  });

  test('toggles the value tool on and off', async () => {
    render(<Minitool_1 />);

    const valueToolButton = await screen.findByTestId('custom-button-Value-tool');
    
    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();

    fireEvent.press(valueToolButton);

    expect(await screen.findByTestId('value_text')).toBeTruthy();
    
    fireEvent.press(valueToolButton);
    
    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();

  });

  test('toggles the range tool on and off', async () => {
    render(<Minitool_1 />);
    const rangeToolButton = await screen.findByTestId('custom-button-Range-tool');

    expect(screen.queryByText(/Count:/)).toBeNull();

    fireEvent.press(rangeToolButton);
    expect(await screen.findByTestId('counter_text')).toBeTruthy();

    fireEvent.press(rangeToolButton);
    expect(screen.queryByText(/Count:/)).toBeNull();
  });

});