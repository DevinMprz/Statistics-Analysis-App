export const generateBivariateData = (
  numCategories = 3,
  pointsPerGroup = 25
) => {
  const categoryTemplates = [
    { name: "High School", baseSalary: 35000, eduFactor: 1.0 },
    { name: "Associate's", baseSalary: 45000, eduFactor: 1.1 },
    { name: "Bachelor's", baseSalary: 55000, eduFactor: 1.2 },
    { name: "Master's", baseSalary: 65000, eduFactor: 1.4 },
    { name: "PhD", baseSalary: 75000, eduFactor: 1.6 },
  ];
  const data = [];

  for (let i = 0; i < numCategories; i++) {
    const template = categoryTemplates[i % categoryTemplates.length];
    const categoryName =
      template.name +
      (numCategories > categoryTemplates.length
        ? ` (${Math.floor(i / categoryTemplates.length) + 1})`
        : "");

    const group1Salaries = Array.from({ length: pointsPerGroup }, () =>
      Math.floor(
        template.baseSalary * template.eduFactor +
          Math.random() * 20000 +
          Math.random() * i * 2000
      )
    );
    // Ensure group2 salaries are distinct enough for visualization
    const group2Salaries = Array.from({ length: pointsPerGroup }, () =>
      Math.floor(
        template.baseSalary * template.eduFactor * 0.9 +
          Math.random() * 18000 +
          Math.random() * i * 1800
      )
    );

    data.push({
      categoryName: categoryName,
      group1: { name: "Group A", data: group1Salaries, color: "blue" }, // e.g., Male
      group2: { name: "Group B", data: group2Salaries, color: "deeppink" }, // e.g., Female
    });
  }
  return data;
};

// New function for generating bivariate scatter plot data
export const generateSingleScatterPlotData = (
  numPoints = 50,
  xMin = 0,
  xMax = 100,
  yMin = 0,
  yMax = 100,
  correlation = 0
) => {
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    let x = Math.random() * (xMax - xMin) + xMin;
    let yBase = Math.random() * (yMax - yMin) + yMin;

    // Apply some correlation if specified (simplified approach)
    // A positive correlation means y tends to increase with x
    // A negative correlation means y tends to decrease with x
    if (correlation !== 0) {
      const xNormalized = (x - xMin) / (xMax - xMin); // Normalize x to 0-1 range
      const correlatedYShift =
        (xNormalized - 0.5) * (yMax - yMin) * correlation;
      yBase += correlatedYShift;
      // Clamp y to be within yMin and yMax after correlation adjustment
      yBase = Math.max(yMin, Math.min(yMax, yBase));
    }

    data.push({ id: i, x: Math.round(x), y: Math.round(yBase) });
  }
  return data;
};

// Example: 3 categories (e.g., Bachelor's, Master's, PhD), 20 data points per group per category.
export const sampleMinitoolThreeData = generateBivariateData(3, 20);

export const anotherSampleMinitoolThreeData = generateBivariateData(5, 30);

export const sampleScatterData1 = generateSingleScatterPlotData(
  75,
  10,
  90,
  20,
  120,
  0.6
);
export const sampleScatterData2 = generateSingleScatterPlotData(
  100,
  0,
  50,
  50,
  150,
  -0.4
);
