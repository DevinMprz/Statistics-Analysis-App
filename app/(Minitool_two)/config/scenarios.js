/**
 * Built-in DotPlot presets and the shared chart defaults that every
 * scenario (preset or DB-loaded) extends from.
 */

import cholesterolData from '../../../data/cholesterol.json';
import speedtrapData from '../../../data/speedtrap.json';
import { calculateCombinedExtent } from '../../../data/_data';

export const CHART_DEFAULTS = Object.freeze({
  width: 300,
  height: 100,
  dotRadius: 4,
  thresholdColor: 'blue',
  axisColor: 'black',
  margins: { top: 40, bottom: 40, left: 40, right: 20 },
  xAxisStep: null,
  initialIntervalWidth: 5,
  chartName: 'Dot Plot',
});

/**
 * Builds a scenario settings object by merging chart defaults with
 * scenario-specific overrides and a domain derived from the data.
 */
export const buildScenarioSettings = ({ name, data, xAxisStep, initialIntervalWidth }) => {
  const extent = calculateCombinedExtent([data.before, data.after]);
  return {
    ...CHART_DEFAULTS,
    chartName: name,
    xDomain: { min: Math.floor(extent.min), max: Math.ceil(extent.max) },
    xAxisStep,
    initialIntervalWidth,
  };
};

export const DEFAULT_PRESETS = {
  cholesterol: {
    label: 'Cholesterol Levels',
    data: cholesterolData,
    settings: buildScenarioSettings({
      name: 'Cholesterol',
      data: cholesterolData,
      xAxisStep: 2,
      initialIntervalWidth: 10,
    }),
  },
  speedtrap: {
    label: 'Speed Trap',
    data: speedtrapData,
    settings: buildScenarioSettings({
      name: 'Speed Trap',
      data: speedtrapData,
      xAxisStep: 5,
      initialIntervalWidth: 5,
    }),
  },
};
