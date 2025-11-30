import React, { useCallback } from "react";
import { Platform } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  clamp,
  withTiming,
} from "react-native-reanimated";
import { Rect, Line, G } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/**
 * RangeTool Hook
 * Encapsulates all range tool logic including gestures, animations, and state management
 * Returns an object with animated props and handlers for integration into the main chart
 */
const useRangeTool = ({
  isActive,
  onActiveChange,
  onRangeChange,
  onCountChange,
  chartWidth,
  chartHeight,
  maxLifespan = 130,
  initialStartValue = 102,
  initialEndValue = 126,
  rangeHandleSize = 15,
  rangeToolColor = "#0000FF",
  displayedData = [],
}) => {
  // --- Range Tool Gesture Logic ---
  const initialRangeStartX = (initialStartValue / maxLifespan) * chartWidth;
  const initialRangeEndX = (initialEndValue / maxLifespan) * chartWidth;
  const rangeStartX = useSharedValue(initialRangeStartX);
  const rangeEndX = useSharedValue(initialRangeEndX);
  const rangeContext = useSharedValue({ start: 0, end: 0 });

  const movePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      const rangeWidth = rangeContext.value.end - rangeContext.value.start;
      const newStart = clamp(
        rangeContext.value.start + event.translationX,
        0,
        chartWidth - rangeWidth
      );
      rangeStartX.value = newStart;
      rangeEndX.value = newStart + rangeWidth;
    });

  const leftHandlePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      rangeStartX.value = clamp(
        rangeContext.value.start + event.translationX,
        0,
        rangeEndX.value - rangeHandleSize
      );
    });

  const rightHandlePanGesture = Gesture.Pan()
    .onStart(() => {
      rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value };
    })
    .onUpdate((event) => {
      rangeEndX.value = clamp(
        rangeContext.value.end + event.translationX,
        rangeStartX.value + rangeHandleSize,
        chartWidth
      );
    });

  // --- Animated Props for range tool elements ---
  const animatedRangeRectProps = useAnimatedProps(() => ({
    x: rangeStartX.value,
    width: rangeEndX.value - rangeStartX.value,
  }));

  const animatedRangeLeftLineProps = useAnimatedProps(() => ({
    x1: rangeStartX.value,
    x2: rangeStartX.value,
  }));

  const animatedRangeRightLineProps = useAnimatedProps(() => ({
    x1: rangeEndX.value,
    x2: rangeEndX.value,
  }));

  const animatedLeftHandleProps = useAnimatedProps(() => ({
    x: rangeStartX.value - rangeHandleSize / 2,
  }));

  const animatedRightHandleProps = useAnimatedProps(() => ({
    x: rangeEndX.value - rangeHandleSize / 2,
  }));

  const animatedMoveHandleProps = useAnimatedProps(() => ({
    x: rangeStartX.value,
    width: Math.abs(rangeEndX.value - rangeStartX.value),
  }));

  // --- Animation for label ---
  const animatedRangeLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (rangeStartX.value + rangeEndX.value) / 2 }],
    opacity: withTiming(isActive ? 1 : 0),
  }));

  // --- Animation for tool visibility ---
  const rangeToolContainerAnimatedProps = useAnimatedProps(() => {
    return { opacity: withTiming(isActive ? 1 : 0) };
  });

  // --- Function to handle range updates and calculate count ---
  useAnimatedReaction(
    () => ({ start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange, previousRange) => {
      if (
        currentRange.start !== previousRange?.start ||
        currentRange.end !== previousRange?.end
      ) {
        const minLifespanValue =
          (currentRange.start / chartWidth) * maxLifespan;
        const maxLifespanValue = (currentRange.end / chartWidth) * maxLifespan;
        const count = displayedData.filter(
          (item) =>
            item.visible &&
            item.lifespan >= minLifespanValue &&
            item.lifespan <= maxLifespanValue
        ).length;
        runOnJS(onCountChange)(count);
        if (onRangeChange) {
          runOnJS(onRangeChange)({
            start: minLifespanValue,
            end: maxLifespanValue,
          });
        }
      }
    },
    [chartWidth, maxLifespan, displayedData]
  );

  const handleToggle = useCallback(
    (newValue) => {
      onActiveChange(newValue);
    },
    [onActiveChange]
  );

  // --- Render component ---
  const renderRangeTool = () => (
    <AnimatedG animatedProps={rangeToolContainerAnimatedProps}>
      <AnimatedRect
        y="0"
        height={chartHeight}
        fill={rangeToolColor}
        opacity="0.2"
        animatedProps={animatedRangeRectProps}
      />
      <AnimatedLine
        y1="0"
        y2={chartHeight}
        stroke={rangeToolColor}
        strokeWidth="2"
        animatedProps={animatedRangeLeftLineProps}
      />
      <AnimatedLine
        y1="0"
        y2={chartHeight}
        stroke={rangeToolColor}
        strokeWidth="2"
        animatedProps={animatedRangeRightLineProps}
      />

      {/* --- Rectangles - gesture handlers --- */}
      {/* {Platform.OS === "web" && isActive ? ( */}
      <>
        <AnimatedRect
          y={chartHeight}
          width={rangeHandleSize}
          height={rangeHandleSize}
          fill={rangeToolColor}
          animatedProps={animatedLeftHandleProps}
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.nativeEvent.pageX;
            const initialStart = rangeStartX.value;

            const handleMouseMove = (moveEvent) => {
              const deltaX = moveEvent.pageX - startX;
              rangeStartX.value = clamp(
                initialStart + deltaX,
                0,
                rangeEndX.value - rangeHandleSize
              );
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
        <AnimatedRect
          y={chartHeight}
          width={rangeHandleSize}
          height={rangeHandleSize}
          fill={rangeToolColor}
          animatedProps={animatedRightHandleProps}
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.nativeEvent.pageX;
            const initialEnd = rangeEndX.value;

            const handleMouseMove = (moveEvent) => {
              const deltaX = moveEvent.pageX - startX;
              rangeEndX.value = clamp(
                initialEnd + deltaX,
                rangeStartX.value + rangeHandleSize,
                chartWidth
              );
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
        <AnimatedRect
          y="0"
          height={chartHeight}
          fill="transparent"
          animatedProps={animatedMoveHandleProps}
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.nativeEvent.pageX;
            const initialStart = rangeStartX.value;
            const initialEnd = rangeEndX.value;
            const rangeWidth = initialEnd - initialStart;

            const handleMouseMove = (moveEvent) => {
              const deltaX = moveEvent.pageX - startX;
              const newStart = clamp(
                initialStart + deltaX,
                0,
                chartWidth - rangeWidth
              );
              rangeStartX.value = newStart;
              rangeEndX.value = newStart + rangeWidth;
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      </>
      {/* ) : (
        <>
          <GestureDetector gesture={leftHandlePanGesture} enabled={isActive}>
            <AnimatedRect
              y={chartHeight}
              width={rangeHandleSize}
              height={rangeHandleSize}
              fill={rangeToolColor}
              animatedProps={animatedLeftHandleProps}
            />
          </GestureDetector>
          <GestureDetector gesture={rightHandlePanGesture} enabled={isActive}>
            <AnimatedRect
              y={chartHeight}
              width={rangeHandleSize}
              height={rangeHandleSize}
              fill={rangeToolColor}
              animatedProps={animatedRightHandleProps}
            />
          </GestureDetector>
          <GestureDetector gesture={movePanGesture} enabled={isActive}>
            <AnimatedRect
              y="0"
              height={chartHeight}
              fill="transparent"
              animatedProps={animatedMoveHandleProps}
            />
          </GestureDetector>
        </>
      )} */}
    </AnimatedG>
  );

  return {
    // Rendered component
    renderRangeTool,

    // Shared values and gestures (exposed if needed for advanced usage)
    rangeStartX,
    rangeEndX,
    movePanGesture,
    leftHandlePanGesture,
    rightHandlePanGesture,

    // Animated props (exposed if needed)
    animatedRangeRectProps,
    animatedRangeLeftLineProps,
    animatedRangeRightLineProps,
    animatedLeftHandleProps,
    animatedRightHandleProps,
    animatedMoveHandleProps,
    animatedRangeLabelStyle,
    rangeToolContainerAnimatedProps,

    // Handlers
    handleToggle,
  };
};

export default useRangeTool;
