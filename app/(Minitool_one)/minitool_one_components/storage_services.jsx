import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use a single, descriptive key to store your chart data array.
const CHART_DATA_KEY = 'app_chart_data';

/**
 * Loads the chart data from the appropriate storage.
 * Returns the parsed data or null if not found.
 */
export const loadChartData = async () => {
  try {
    let data = null;
    if (Platform.OS === 'web') {
      data = localStorage.getItem(CHART_DATA_KEY);
    } else {
      data = await AsyncStorage.getItem(CHART_DATA_KEY);
    }

    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load chart data", error);
    return null; // Return null on error
  }
};

/**
 * Saves the chart data to the appropriate storage.
 * The data should be an array of objects.
 */
export const saveChartData = async (data) => {
  try {
    const dataString = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem(CHART_DATA_KEY, dataString);
    } else {
      await AsyncStorage.setItem(CHART_DATA_KEY, dataString);
    }
  } catch (error) {
    console.error("Failed to save chart data", error);
  }
};


/**
 * Clears the chart data from the appropriate storage.
 */
export const clearChartData = async () => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(CHART_DATA_KEY);
        } else {
            await AsyncStorage.removeItem(CHART_DATA_KEY);
        }
    } catch (error) {
        console.error("Failed to clear chart data", error);
    }
}