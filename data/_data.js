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
    data.push(parseFloat(randomNumber.toFixed(1)));
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

// Remove old static imports if they exist:
// import cholesterolSet1 from "./cholesterol_set1.json";
// import cholesterolSet2 from "./cholesterol_set2.json";
// import speedtrapSet1 from "./speedtrap_set1.json";

/**
 * Loads all datasets from JSON files in the current directory dynamically.
 * @returns {Object} An object where keys are dataset names (derived from filenames)
 *                   and values are the data arrays.
 */
export const loadAllDatasets = () => {
  // Corrected regex: /\.json$/ means match a literal dot, then 'json', then end of string.
  const context = require.context(".", false, /\.json$/);
  const datasets = {};

  console.log("[loadAllDatasets] Context keys found:", context.keys()); // <-- ADDED LOG

  context.keys().forEach((key) => {
    const fileNameWithExtension = key.substring(key.lastIndexOf("/") + 1);
    const fileName = fileNameWithExtension.substring(
      0,
      fileNameWithExtension.lastIndexOf(".")
    );

    if (fileNameWithExtension === "_data.js") {
      return;
    }

    let datasetName = fileName.replace(/[_-]/g, " ");
    // Corrected: Capitalize the first letter of each word using a regex literal
    datasetName = datasetName.replace(/\b\w/g, (char) => char.toUpperCase());
    datasetName = datasetName.replace(
      / (set)(\\d+)/i,
      (match, p1, p2) => " Set " + p2
    );
    datasetName = datasetName.replace(
      /^Set (\\d+)$/i,
      (match, p1) => "Set " + p1
    );
    console.log(
      `[loadAllDatasets] Processing key: ${key}, original fileName: ${fileName}, generated datasetName: ${datasetName}`
    ); // <-- ADDED LOG

    datasets[datasetName] = context(key);
  });

  console.log("[loadAllDatasets] Final datasets object:", datasets); // <-- ADDED LOG
  return datasets;
};
