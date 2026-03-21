import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import { scaleLinear } from "d3-scale";

const ScatterPlot = ({ data = [] }) => {
  const { width } = Dimensions.get("window");

  // Chart dimensions
  const CHART_WIDTH = width - 160;
  const CHART_HEIGHT = 500;
  const PADDING = 40;
  const Y_AXIS_WIDTH = 50;
  const X_AXIS_HEIGHT = 40;

  // Calculate data bounds
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  // Add padding to the data range
  const xPadding = (maxX - minX) * 0.1;
  const yPadding = (maxY - minY) * 0.1;

  // Create scales
  const xScale = scaleLinear()
    .domain([minX - xPadding, maxX + xPadding])
    .range([Y_AXIS_WIDTH + PADDING, CHART_WIDTH - PADDING]);

  const yScale = scaleLinear()
    .domain([minY - yPadding, maxY + yPadding])
    .range([CHART_HEIGHT - X_AXIS_HEIGHT - PADDING, PADDING]);

  // Generate axis ticks
  const xTicks = 6;
  const yTicks = 6;
  const xTickValues = [];
  const yTickValues = [];

  for (let i = 0; i < xTicks; i++) {
    xTickValues.push(
      minX - xPadding + (i * (maxX - minX + 2 * xPadding)) / (xTicks - 1),
    );
  }

  for (let i = 0; i < yTicks; i++) {
    yTickValues.push(
      minY - yPadding + (i * (maxY - minY + 2 * yPadding)) / (yTicks - 1),
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
      }}
    >
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines and Y-axis ticks */}
        {yTickValues.map((tickValue, i) => {
          const y = yScale(tickValue);
          return (
            <G key={`y-tick-${i}`}>
              <Line
                x1={Y_AXIS_WIDTH}
                y1={y}
                x2={CHART_WIDTH}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <SvgText
                x={Y_AXIS_WIDTH - 10}
                y={y + 4}
                fontSize="11"
                textAnchor="end"
                fill="#666"
              >
                {Math.round(tickValue)}
              </SvgText>
            </G>
          );
        })}

        {/* Grid lines and X-axis ticks */}
        {xTickValues.map((tickValue, i) => {
          const x = xScale(tickValue);
          return (
            <G key={`x-tick-${i}`}>
              <Line
                x1={x}
                y1={PADDING}
                x2={x}
                y2={CHART_HEIGHT - X_AXIS_HEIGHT}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <SvgText
                x={x}
                y={CHART_HEIGHT - X_AXIS_HEIGHT + 20}
                fontSize="11"
                textAnchor="middle"
                fill="#666"
              >
                {Math.round(tickValue)}
              </SvgText>
            </G>
          );
        })}

        {/* Y-axis */}
        <Line
          x1={Y_AXIS_WIDTH}
          y1={PADDING}
          x2={Y_AXIS_WIDTH}
          y2={CHART_HEIGHT - X_AXIS_HEIGHT}
          stroke="#333"
          strokeWidth="2"
        />

        {/* X-axis */}
        <Line
          x1={Y_AXIS_WIDTH}
          y1={CHART_HEIGHT - X_AXIS_HEIGHT}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT - X_AXIS_HEIGHT}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const cx = xScale(point.x);
          const cy = yScale(point.y);
          return (
            <Circle
              key={`point-${index}`}
              cx={cx}
              cy={cy}
              r="4"
              fill="#2563eb"
              opacity="0.7"
            />
          );
        })}

        {/* Y-axis label */}
        <SvgText
          x={15}
          y={CHART_HEIGHT / 2}
          fontSize="13"
          textAnchor="middle"
          fill="#333"
          transform={`rotate(-90 15 ${CHART_HEIGHT / 2})`}
        >
          Y Variable
        </SvgText>

        {/* X-axis label */}
        <SvgText
          x={CHART_WIDTH / 2}
          y={CHART_HEIGHT - 5}
          fontSize="13"
          textAnchor="middle"
          fill="#333"
        >
          X Variable
        </SvgText>
      </Svg>
    </View>
  );
};

export default ScatterPlot;
