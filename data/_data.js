export const dataBefore = [
  48.0, 48.2, 48.7, 48.8, 48.9, 49.3, 49.4, 49.8, 49.8, 50.0, 50.2, 51.0, 50.2,
  50.3, 50.7, 50.6, 50.7, 50.8, 50.9, 50.9, 51.2, 51.3, 51.3, 51.2, 51.1, 51.1,
  51.4, 51.4, 51.8, 51.7, 51.7, 51.8, 52.0, 52.0, 52.3, 52.1, 52.2, 52.6, 52.8,
  52.8, 52.9, 53.1, 53.3, 53.2, 53.0, 53.4, 53.9, 53.9, 54.0, 54.4, 54.7, 54.9,
  55.4, 55.6, 56.0, 56.3, 56.6, 57.2, 57.8, 60.3, 63.8,
];
export const dataAfter = [
  63.8, 62.7, 61.7, 61.2, 60.6, 60.1, 59.8, 59.2, 58.9, 58.4, 58.5, 58.1, 57.9,
  57.2, 57.0, 56.8, 56.3, 55.8, 55.9, 55.4, 55.2, 55.0, 55.0, 54.8, 54.7, 54.2,
  54.4, 54.5, 53.8, 53.8, 53.8, 53.6, 53.5, 53.0, 52.6, 52.6, 52.4, 52.2, 52.2,
  53.0, 52.9, 52.8, 53.0, 53.2, 51.8, 51.7, 51.1, 51.1, 51.2, 51.3, 50.6, 50.4,
  50.3, 49.8, 49.7, 49.2, 49.1, 48.0,
];

export const generateCholesterolData = (count, minVal, maxVal) => {
  const data = [];
  if (
    typeof count !== "number" ||
    count <= 0 ||
    typeof minVal !== "number" ||
    typeof maxVal !== "number" ||
    minVal >= maxVal
  ) {
    console.warn(
      "Invalid parameters for generateCholesterolData. Ensure count > 0, and minVal < maxVal."
    );
    return data;
  }
  for (let i = 0; i < count; i++) {
    const randomNumber = Math.random() * (maxVal - minVal) + minVal;
    data.push(parseFloat(randomNumber.toFixed(1)));
  }
  return data;
};

export const generateSpeedTrapData = (count, minVal, maxVal) => {
  const data = [];
  if (
    typeof count !== "number" ||
    count <= 0 ||
    typeof minVal !== "number" ||
    typeof maxVal !== "number" ||
    minVal >= maxVal
  ) {
    console.warn(
      "Invalid parameters for generateSpeedTrapData. Ensure count > 0, and minVal < maxVal."
    );
    return data;
  }
  for (let i = 0; i < count; i++) {
    const randomNumber = Math.random() * (maxVal - minVal) + minVal;
    data.push(Math.round(randomNumber)); // Speed data as integers
  }
  return data;
};

export const calculateCombinedExtent = (datasets) => {
  let overallMin = Infinity;
  let overallMax = -Infinity;

  datasets.forEach((dataset) => {
    if (!dataset || dataset.length === 0) return;
    const currentMin = Math.min(...dataset);
    const currentMax = Math.max(...dataset);
    if (currentMin < overallMin) {
      overallMin = currentMin;
    }
    if (currentMax > overallMax) {
      overallMax = currentMax;
    }
  });

  if (overallMin === Infinity || overallMax === -Infinity) {
    return { min: 0, max: 100 }; // Default if no valid data
  }
  return { min: overallMin, max: overallMax };
};
