import React, { useEffect, useState} from 'react';
import { StyleSheet, View, Text, Switch, useWindowDimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  clamp,
  withTiming, // --- NEW ---: Import withTiming for smooth transitions
} from 'react-native-reanimated';
import Svg, { Rect, Circle, Line, G, Text as SvgText } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Configuration & Initial Data ---
const TOUGH_CELL_COLOR = '#33cc33';
const ALWAYS_READY_COLOR = '#cc00ff';
const AXIS_COLOR = '#333';
const DOT_COLOR = '#000';
const TOOL_COLOR = 'red';
const MAX_LIFESPAN = 140;

const RANGE_TOOL_COLOR = '#0000FF';
const RANGE_HIGHLIGHT_COLOR = '#ff0000';
const RANGE_HANDLE_SIZE = 15;

const initialBatteryData = [
  { brand: 'Tough Cell', lifespan: 114 }, { brand: 'Tough Cell', lifespan: 102 }, { brand: 'Tough Cell', lifespan: 110 }, { brand: 'Tough Cell', lifespan: 120 }, { brand: 'Tough Cell', lifespan: 106 }, { brand: 'Tough Cell', lifespan: 88 }, { brand: 'Tough Cell', lifespan: 105 }, { brand: 'Tough Cell', lifespan: 82 }, { brand: 'Tough Cell', lifespan: 92 }, { brand: 'Tough Cell', lifespan: 98 },
  { brand: 'Always Ready', lifespan: 112 }, { brand: 'Always Ready', lifespan: 74 }, { brand: 'Always Ready', lifespan: 115 }, { brand: 'Always Ready', lifespan: 109 }, { brand: 'Always Ready', lifespan: 112 }, { brand: 'Always Ready', lifespan: 46 }, { brand: 'Always Ready', lifespan: 110 }, { brand: 'Always Ready', lifespan: 104 }, { brand: 'Always Ready', lifespan: 98 }, { brand: 'Always Ready', lifespan: 116 },
];

// --- Chart Layout Constants ---
const PLATFORM = Platform.OS;
const MOBILE_TICKS = 6;
const WEB_TICKS = 10;
const MOBILE_VALUE_STEP = 26;
const WEB_VALUE_STEP = 14;
const PADDING = 0;
const Y_AXIS_WIDTH = 30;
const BAR_HEIGHT = 8;
const BAR_SPACING = 7;
const X_AXIS_HEIGHT = 20;
const TOOL_LABEL_OFFSET_Y = 25;
const RANGE_LABEL_OFFSET_Y = 15;
const TOP_BUFFER = RANGE_LABEL_OFFSET_Y + 10;

// --- Bar Component (No changes here) ---
const BatteryBar = ({ item, index, chartWidth, rangeStartX, rangeEndX, tool }) => {
  const yPos = index * (BAR_HEIGHT + BAR_SPACING);
  const originalColor = item.brand === 'Tough Cell' ? TOUGH_CELL_COLOR : ALWAYS_READY_COLOR;
  const [barColor, setBarColor] = useState(originalColor);
  const barEndPosition = (item.lifespan / MAX_LIFESPAN) * chartWidth;

   useAnimatedReaction(
    () => ({ isToolActive: tool, start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange) => {
      'worklet';
      if (currentRange.isToolActive) {
        if (barEndPosition >= currentRange.start && barEndPosition <= currentRange.end) {
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
      <AnimatedRect x="0" y={yPos} width={barEndPosition} height={BAR_HEIGHT} fill={barColor} />
      <Circle cx={barEndPosition} cy={yPos + BAR_HEIGHT / 2} r="4" fill={DOT_COLOR} />
    </G>
  );
};

//const  {width, height} = Dimensions.get('window');
export const BatteryChart = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [displayedData, setDisplayedData] = useState(initialBatteryData);
  const [isSortedBySize, setIsSortedBySize] = useState(false);
  const [isSortedByColor, setIsSortedByColor] = useState(false);
  const [toolValue, setToolValue] = useState(80.0);
  const [rangeCount, setRangeCount] = useState(0);

  // --- NEW ---: State for controlling tool visibility
  const [valueToolActive, setValueToolActive] = useState(false);
  const [rangeToolActive, setRangeToolActive] = useState(false);

  const SVG_WIDTH = windowWidth - PADDING * 2;
  const chartWidth = SVG_WIDTH - Y_AXIS_WIDTH > 0 ? SVG_WIDTH - Y_AXIS_WIDTH : 1;
  const chartHeight = displayedData.length * (BAR_HEIGHT + BAR_SPACING);
  const SVG_HEIGHT = chartHeight + X_AXIS_HEIGHT + TOP_BUFFER;
  
  // --- Single Tool Gesture Logic (No changes here) ---
  const translateX = useSharedValue((80.0 / MAX_LIFESPAN) * chartWidth);
  const context = useSharedValue({ x: 0 });
  const panGesture = Gesture.Pan()
    .onStart(() => { context.value = { x: translateX.value }; })
    .onUpdate((event) => {
      console.log("itspan")
      translateX.value = clamp(event.translationX + context.value.x, 0, chartWidth);
    });

  // --- Range Tool Gesture Logic (No changes here) ---
  const rangeStartX = useSharedValue((102 / MAX_LIFESPAN) * chartWidth);
  const rangeEndX = useSharedValue((126 / MAX_LIFESPAN) * chartWidth);
  const rangeContext = useSharedValue({ start: 0, end: 0 });

  const movePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      console.log("s")
      const rangeWidth = rangeContext.value.end - rangeContext.value.start;
      const newStart = clamp(rangeContext.value.start + event.translationX, 0, chartWidth - rangeWidth);
      rangeStartX.value = newStart;
      rangeEndX.value = newStart + rangeWidth;
    });

  const leftHandlePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      rangeStartX.value = clamp(rangeContext.value.start + event.translationX, 0, rangeEndX.value - RANGE_HANDLE_SIZE);
    });

  const rightHandlePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      rangeEndX.value = clamp(rangeContext.value.end + event.translationX, rangeStartX.value + RANGE_HANDLE_SIZE, chartWidth);
    });

  // --- Animated Props ---
  const animatedToolProps = useAnimatedProps(() => ({ x: translateX.value - 7.5 }));
  const animatedValueLineProps = useAnimatedProps(() => ({ x1: translateX.value, x2: translateX.value }));
  const animatedRangeRectProps = useAnimatedProps(() => ({
    x: rangeStartX.value,
    width: rangeEndX.value - rangeStartX.value,
  }));
  const animatedRangeLeftLineProps = useAnimatedProps(() => ({ x1: rangeStartX.value, x2: rangeStartX.value }));
  const animatedRangeRightLineProps = useAnimatedProps(() => ({ x1: rangeEndX.value, x2: rangeEndX.value }));
  const animatedLeftHandleProps = useAnimatedProps(() => ({ x: rangeStartX.value - RANGE_HANDLE_SIZE / 2 }));
  const animatedRightHandleProps = useAnimatedProps(() => ({ x: rangeEndX.value - RANGE_HANDLE_SIZE / 2 }));
  const animatedMoveHandleProps = useAnimatedProps(() => ({ 
    x: rangeStartX.value, 
    width: Math.abs(rangeStartX.value - rangeEndX.value) 
  }));

   const animatedValueLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value}],
    opacity: withTiming(rangeToolActive ? 1 : 0),
  }));
  // --- MODIFIED ---: Combine position and opacity animation for the labels
  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: withTiming(valueToolActive ? 1 : 0),
  }));

  const animatedRangeLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (rangeStartX.value + rangeEndX.value) / 2 }],
    opacity: withTiming(rangeToolActive ? 1 : 0),
  }));
  
  // --- NEW ---: Create animated props to control the opacity of the tool groups
  const valueToolContainerAnimatedProps = useAnimatedProps(() => {
    return { opacity: withTiming(valueToolActive ? 1 : 0) };
  });

  const rangeToolContainerAnimatedProps = useAnimatedProps(() => {
    return { opacity: withTiming(rangeToolActive ? 1 : 0) };
  });

  // --- Reactions for JS-side updates (No changes here) ---
  useAnimatedReaction(
    () => translateX.value,
    (currentValue) => runOnJS(setToolValue)((currentValue / chartWidth) * MAX_LIFESPAN),
    [chartWidth]
  );
  
  useAnimatedReaction(
    () => ({ start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange, previousRange) => {
      if (currentRange.start !== previousRange?.start || currentRange.end !== previousRange?.end) {
        const minLifespan = (currentRange.start / chartWidth) * MAX_LIFESPAN;
        const maxLifespan = (currentRange.end / chartWidth) * MAX_LIFESPAN;
        const count = displayedData.filter(item => item.lifespan >= minLifespan && item.lifespan <= maxLifespan).length;
        runOnJS(setRangeCount)(count);
      }
    },
    [chartWidth, displayedData]
  );
  
  // --- Sorting Handlers (No changes here) ---
  const handleSortBySize = (isActive) => {
    setIsSortedBySize(isActive);
    if (isActive) {
      setIsSortedByColor(false);
      setDisplayedData([...initialBatteryData].sort((a, b) => a.lifespan - b.lifespan));
    } else if (!isSortedByColor) {
      setDisplayedData(initialBatteryData);
    }
  };

  const handleSortByColor = (isActive) => {
    setIsSortedByColor(isActive);
    if (isActive) {
      setIsSortedBySize(false);
      setDisplayedData([...initialBatteryData].sort((a, b) => a.brand.localeCompare(b.brand)));
    } else if (!isSortedBySize) {
      setDisplayedData(initialBatteryData);
    }
  };
  
  // --- MODIFIED ---: Simplified toggle handlers
  const handleValueTool = (isActive) => {
    setValueToolActive(isActive);
  };
  const handleRangeTool = (isActive) => {
    setRangeToolActive(isActive);
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battery Lifespan Comparison</Text>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}><View style={[styles.legendColorBox, { backgroundColor: TOUGH_CELL_COLOR }]} /><Text>Tough Cell</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendColorBox, { backgroundColor: ALWAYS_READY_COLOR }]} /><Text>Always Ready</Text></View>
      </View>
      
      <View style={styles.controlsContainer}>
        <View style={styles.switchControl}><Text>Sort by Color</Text><Switch value={isSortedByColor} onValueChange={handleSortByColor} /></View>
        <View style={styles.switchControl}><Text>Sort by Size</Text><Switch value={isSortedBySize} onValueChange={handleSortBySize} /></View>
      </View>

      <View style={[styles.chartContainer, { height: SVG_HEIGHT + TOOL_LABEL_OFFSET_Y }]}>
        
        {/* --- MODIFIED ---: Always render the label, let animated style control opacity */}
        <Animated.View style={[styles.toolLabelContainer, { left: Y_AXIS_WIDTH, top: TOP_BUFFER }, animatedLabelStyle]}>
          <Text style={styles.toolLabelText}>{toolValue.toFixed(1)}</Text>
        </Animated.View> 

        {/* --- MODIFIED ---: Always render the label, let animated style control opacity */}
        <Animated.View style={[styles.rangeLabelContainer, animatedRangeLabelStyle]}>
          <Text style={styles.rangeLabelText}>count: {rangeCount}</Text>
        </Animated.View>

        <Svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ zIndex: 1 }}>
          <G x={Y_AXIS_WIDTH} y={TOP_BUFFER}>
            {/* X-Axis */}
            <Line x1="0" y1={chartHeight} x2={chartWidth - Y_AXIS_WIDTH} y2={chartHeight} stroke={AXIS_COLOR} strokeWidth="1"/>
            {Array.from({ length: PLATFORM === 'web' ? WEB_TICKS : MOBILE_TICKS }).map((_, i) => {
              const val = i * (PLATFORM === 'web' ? WEB_VALUE_STEP : MOBILE_VALUE_STEP);
              const xPos = (val / MAX_LIFESPAN) * chartWidth;
              return (<SvgText key={`label-${i}`} x={xPos} y={chartHeight + 15} fill={AXIS_COLOR} fontSize="12" textAnchor="middle">{val}</SvgText>);
            })}
            
            {/* Data Bars */}
            {displayedData.map((item, index) => (
              <BatteryBar
                key={`bar-${index}`} item={item} index={index} chartWidth={chartWidth}
                rangeStartX={rangeStartX} rangeEndX={rangeEndX} tool={rangeToolActive}
              />
            ))}
            
            {/* --- MODIFIED ---: Wrap all range tool elements in an Animated.G to control opacity */}
            <AnimatedG animatedProps={rangeToolContainerAnimatedProps}>
              <AnimatedRect y="0" height={chartHeight} fill={RANGE_TOOL_COLOR} opacity="0.2" animatedProps={animatedRangeRectProps} />
              <AnimatedLine y1="0" y2={chartHeight} stroke={RANGE_TOOL_COLOR} strokeWidth="2" animatedProps={animatedRangeLeftLineProps} />
              <AnimatedLine y1="0" y2={chartHeight} stroke={RANGE_TOOL_COLOR} strokeWidth="2" animatedProps={animatedRangeRightLineProps} />
              
              {/* --- MODIFIED ---: Add `enabled` prop to gestures */}
              <GestureDetector gesture={leftHandlePanGesture} enabled={rangeToolActive}>
                  <AnimatedRect y={chartHeight} width={RANGE_HANDLE_SIZE} height={RANGE_HANDLE_SIZE} fill={RANGE_TOOL_COLOR} animatedProps={animatedLeftHandleProps} />
              </GestureDetector>
              <GestureDetector gesture={rightHandlePanGesture} enabled={rangeToolActive}>
                  <AnimatedRect y={chartHeight} width={RANGE_HANDLE_SIZE} height={RANGE_HANDLE_SIZE} fill={RANGE_TOOL_COLOR} animatedProps={animatedRightHandleProps} />
              </GestureDetector>
              <GestureDetector gesture={movePanGesture} enabled={rangeToolActive}>
                  <AnimatedRect y="0" height={chartHeight} fill="transparent" animatedProps={animatedMoveHandleProps} />
              </GestureDetector>
            </AnimatedG>
            
            {/* --- MODIFIED ---: Wrap value tool in an Animated.G to control opacity */}
            <AnimatedG animatedProps={valueToolContainerAnimatedProps}>
                <AnimatedLine y1={-5} y2={chartHeight} stroke={TOOL_COLOR} strokeWidth="2" animatedProps={animatedValueLineProps} />
                <GestureDetector gesture={panGesture} enabled={valueToolActive}>
                  <AnimatedRect y={chartHeight} height="15" width="15" fill={TOOL_COLOR} animatedProps={animatedToolProps} />
                </GestureDetector>  
            </AnimatedG>
           
          </G>
          
          <Line x1={Y_AXIS_WIDTH} y1={TOP_BUFFER} x2={Y_AXIS_WIDTH} y2={chartHeight + TOP_BUFFER} stroke={AXIS_COLOR} strokeWidth="1"/>
        </Svg>
      </View>
       <View style={styles.controlsContainer}>
        <View style={styles.switchControl}><Text>Value tool</Text><Switch value={valueToolActive} onValueChange={handleValueTool} /></View>
        <View style={styles.switchControl}><Text>Range tool</Text><Switch value={rangeToolActive} onValueChange={handleRangeTool} /></View>
      </View>
      <Text style={styles.xAxisTitle}>Life Span (hours)</Text>
    </View>
  );
};

// --- Styles (No changes here) ---
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb', 
    padding: PADDING, 
    alignItems: 'center', 
    margin: 0, 
    borderWidth: 1, 
    borderColor: '#eee', 
    borderRadius: 8
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  legendColorBox: { width: 15, height: 15, marginRight: 8 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  switchControl: { alignItems: 'center' },
  chartContainer: { width: '100%', marginTop: 20, position: 'relative' },
  xAxisTitle: { fontSize: 12, color: AXIS_COLOR, marginTop: 10 },
  toolLabelContainer: { position: 'absolute', height: TOOL_LABEL_OFFSET_Y, alignItems: 'center', zIndex: 15 },
  toolLabelText: { color: TOOL_COLOR, fontWeight: 'bold', fontSize: 14, backgroundColor: 'white', paddingHorizontal: 2 },
  rangeLabelContainer: { position: 'absolute', top: 0, height: RANGE_LABEL_OFFSET_Y, alignItems: 'center', zIndex: 10 },
  rangeLabelText: { color: RANGE_TOOL_COLOR, fontWeight: 'bold', fontSize: 14, backgroundColor: 'white', paddingHorizontal: 4 },
});