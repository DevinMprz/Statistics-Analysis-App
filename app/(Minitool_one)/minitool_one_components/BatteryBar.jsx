import React, { useState } from "react";
import { Rect, Circle, G } from "react-native-svg";
import Animated, {
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const BAR_HEIGHT = 8;
const DOT_COLOR = "#000";
const RANGE_HIGHLIGHT_COLOR = "#ff0000";
const TOUGH_CELL_COLOR = "#33cc33";
const ALWAYS_READY_COLOR = "#cc00ff";
const MAX_LIFESPAN = 140;
const BAR_SPACING = 7;

const BatteryBar = ({
  item,
  index,
  chartWidth,
  rangeStartX,
  rangeEndX,
  tool,
}) => {
  const yPos = index * (BAR_HEIGHT + BAR_SPACING);
  const originalColor =
    item.brand === "Tough Cell" ? TOUGH_CELL_COLOR : ALWAYS_READY_COLOR;
  const [barColor, setBarColor] = useState(originalColor);
  const barEndPosition = (item.lifespan / MAX_LIFESPAN) * chartWidth;

  useAnimatedReaction(
    () => ({
      isToolActive: tool,
      start: rangeStartX.value,
      end: rangeEndX.value,
    }),
    (currentRange) => {
      "worklet";
      if (currentRange.isToolActive) {
        if (
          barEndPosition >= currentRange.start &&
          barEndPosition <= currentRange.end
        ) {
          runOnJS(setBarColor)(RANGE_HIGHLIGHT_COLOR);
        } else {
          runOnJS(setBarColor)(originalColor);
        }
      } else {
        runOnJS(setBarColor)(originalColor);
      }
    },
    [barEndPosition, originalColor, tool]
  );

  return (
    <G>
      <AnimatedRect
        x="0"
        y={yPos}
        width={barEndPosition}
        height={BAR_HEIGHT}
        fill={barColor}
      />
      <Circle
        cx={barEndPosition}
        cy={yPos + BAR_HEIGHT / 2}
        r="4"
        fill={DOT_COLOR}
      />
    </G>
  );
};

export default BatteryBar;
