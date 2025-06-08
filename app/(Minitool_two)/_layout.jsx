import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Circle, Line, Text as SvgText } from 'react-native-svg';
import { scaleLinear } from 'd3-scale';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');
const chartHeight = 300;
const margins = { top: 20, bottom: 30, left: 40, right: 20 };
const innerWidth = screenWidth - margins.left - margins.right - 32; // account for horizontal padding

const data = [
  1,2,3,4,5,6,7,8,9,10,
  11,12,13,14,15,16,17,18,19,20,
  21,22,23,24,25,26,27,28,29,30,
  31,32,33,34,35,36,37,38,39,40,
  41,42,43,44,45,46,47,48,49,50,
];

// Prepare stacked dot data
const computeScatterData = (data) => {
  const counts = {};
  return data.map((value) => {
    counts[value] = (counts[value] || 0) + 1;
    return { value, index: counts[value] };
  });
};

const SpeedTrapMinitool = () => {
  // threshold x-position (pixel)
  const [thresholdX, setThresholdX] = useState(innerWidth / 2);

  const scatterData = useMemo(() => computeScatterData(data), [data]);
  const maxIndex = Math.max(...scatterData.map(d => d.index));

  // Scales: fixed domain 1 to 300 for x
const xScale = useMemo(
	() => scaleLinear().domain([Math.min(...data), Math.max(...data)]).range([0, innerWidth]),
	[data]
);
  const yScale = useMemo(
    () => scaleLinear().domain([0, maxIndex + 1]).range([chartHeight - margins.bottom, margins.top]),
    [maxIndex]
  );

  // Invert thresholdX pixel to data value
  const thresholdValue = xScale.invert(thresholdX);

  // Counts
  const leftCount = data.filter((v) => v <= thresholdValue).length;
  const rightCount = data.length - leftCount;

  // Define pan gesture using new API
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      let x = e.x - margins.left - 16;
      if (x < 0) x = 0;
      if (x > innerWidth) x = innerWidth;
      setThresholdX(x);
    });

	const xAxisTicks = useMemo(() => {
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const step = Math.ceil((maxVal - minVal) / 6); // Aim for ~6 ticks
    const ticks = [];
    for (let i = minVal; i <= maxVal; i += step) {
      ticks.push(i);
    }
    // Ensure the max value is included
    if (ticks[ticks.length - 1] < maxVal) {
      ticks.push(maxVal);
    }
    return ticks;
  }, [data]);


return (
  <View style={styles.container}>
      <View style={styles.countsRow}>
        <Text style={styles.countText}>Left: {leftCount}</Text>
        <Text style={styles.countText}>Right: {rightCount}</Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <View>
          <Svg width={screenWidth - 32} height={chartHeight + 20}> {/* Added height for axis labels */}
            {/* Scatter plot dots */}
            {scatterData.map((d, i) => {
              const cx = xScale(d.value) + margins.left;
              const cy = yScale(d.index);
              return <Circle key={i} cx={cx} cy={cy} r={4} fill="blue" />;
            })}

            {/* Threshold line */}
            <Line
              x1={thresholdX + margins.left}
              y1={margins.top}
              x2={thresholdX + margins.left}
              y2={chartHeight - margins.bottom}
              stroke="red"
              strokeWidth={2}
            />

            <SvgText x={thresholdX + margins.left + 4} y={margins.top + 12} fontSize={12} fill="red">
              {thresholdValue.toFixed(1)}
            </SvgText>

            {/* X-axis line */}
            <Line
              x1={margins.left}
              y1={chartHeight - margins.bottom}
              x2={innerWidth + margins.left}
              y2={chartHeight - margins.bottom}
              stroke="black"
              strokeWidth={1}
            />

            {/* X-axis ticks and labels */}
            {xAxisTicks.map((tick, i) => (
              <G key={`tick-${i}`}>
                <Line
                  x1={xScale(tick) + margins.left}
                  y1={chartHeight - margins.bottom}
                  x2={xScale(tick) + margins.left}
                  y2={chartHeight - margins.bottom + 5}
                  stroke="black"
                  strokeWidth={1}
                />
                <SvgText
                  x={xScale(tick) + margins.left}
                  y={chartHeight - margins.bottom + 16}
                  fontSize={10}
                  fill="black"
                  textAnchor="middle"
                >
                  {tick}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      </GestureDetector>
    </View>
);
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: innerWidth,
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SpeedTrapMinitool;
