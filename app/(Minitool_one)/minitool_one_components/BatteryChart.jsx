import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Switch, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import Svg, { Rect, Circle, Line, G, Text as SvgText } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
// --- DELETED --- We will not use an animated SVG text for the counter
// const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

// --- Configuration & Initial Data ---
const TOUGH_CELL_COLOR = '#33cc33';
const ALWAYS_READY_COLOR = '#cc00ff';
const AXIS_COLOR = '#333';
const DOT_COLOR = '#000';
const TOOL_COLOR = 'red';
const MAX_LIFESPAN = 140;

// --- New Range Tool Configuration ---
const RANGE_TOOL_COLOR = '#0000FF'; // Blue for the range tool
const RANGE_HIGHLIGHT_COLOR = '#ff0000'; // A distinct color for highlighted bars
const RANGE_HANDLE_SIZE = 12;

const initialBatteryData = [
  { brand: 'Tough Cell', lifespan: 114 }, { brand: 'Tough Cell', lifespan: 102 }, { brand: 'Tough Cell', lifespan: 110 }, { brand: 'Tough Cell', lifespan: 120 }, { brand: 'Tough Cell', lifespan: 106 }, { brand: 'Tough Cell', lifespan: 88 }, { brand: 'Tough Cell', lifespan: 105 }, { brand: 'Tough Cell', lifespan: 82 }, { brand: 'Tough Cell', lifespan: 92 }, { brand: 'Tough Cell', lifespan: 98 },
  { brand: 'Always Ready', lifespan: 112 }, { brand: 'Always Ready', lifespan: 74 }, { brand: 'Always Ready', lifespan: 115 }, { brand: 'Always Ready', lifespan: 109 }, { brand: 'Always Ready', lifespan: 112 }, { brand: 'Always Ready', lifespan: 46 }, { brand: 'Always Ready', lifespan: 110 }, { brand: 'Always Ready', lifespan: 104 }, { brand: 'Always Ready', lifespan: 98 }, { brand: 'Always Ready', lifespan: 116 },
];

// --- Chart Layout Constants ---
const PADDING = 20;
const Y_AXIS_WIDTH = 30;
const BAR_HEIGHT = 8;
const BAR_SPACING = 7;
const X_AXIS_HEIGHT = 20;
const TOOL_LABEL_OFFSET_Y = 25;
const RANGE_LABEL_OFFSET_Y = 15;
// --- NEW ---: Add a buffer for the label at the top
const TOP_BUFFER = RANGE_LABEL_OFFSET_Y + 10;

// --- Bar Component with Highlighting Logic ---
const BatteryBar = ({ item, index, chartWidth, rangeStartX, rangeEndX }) => {

  const yPos = index * (BAR_HEIGHT + BAR_SPACING);
  const originalColor = item.brand === 'Tough Cell' ? TOUGH_CELL_COLOR : ALWAYS_READY_COLOR;
  const [barColor, setBarColor] = useState(originalColor);
  // This is a constant for each bar, representing its end position in pixels.
  const barEndPosition = (item.lifespan / MAX_LIFESPAN) * chartWidth;

  // This is the key change. We create animated props for the bar's <Rect>
   useAnimatedReaction(
    () => ({ start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange) => {
      if (barEndPosition >= currentRange.start && barEndPosition <= currentRange.end) {
        runOnJS(setBarColor)(RANGE_HIGHLIGHT_COLOR);
      }else{
        runOnJS(setBarColor)(originalColor);
      }
    },
    []
  );

  return (
    <G>
      <AnimatedRect
        x="0"
        y={yPos}
        width={barEndPosition}
        height={BAR_HEIGHT}
        // Apply the animated props here instead of a static fill
        //animatedProps={animatedBarProps}
        fill={barColor}
      />
      {/* The dot at the end remains the same */}
      <Circle cx={barEndPosition} cy={yPos + BAR_HEIGHT / 2} r="4" fill={DOT_COLOR} />
    </G>
  );
};

export const BatteryChart = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [displayedData, setDisplayedData] = useState(initialBatteryData);
  const [isSortedBySize, setIsSortedBySize] = useState(false);
  const [isSortedByColor, setIsSortedByColor] = useState(false);
  const [toolValue, setToolValue] = useState(80.0);
  // --- MODIFIED ---: We re-introduce the React state for the counter
  const [rangeCount, setRangeCount] = useState(0); 

  const SVG_WIDTH = windowWidth - PADDING * 2;
  const chartWidth = SVG_WIDTH - Y_AXIS_WIDTH > 0 ? SVG_WIDTH - 2 * Y_AXIS_WIDTH : 1;
  const chartHeight = displayedData.length * (BAR_HEIGHT + BAR_SPACING);
  // --- MODIFIED ---: Increase SVG height to make space for the label
  const SVG_HEIGHT = chartHeight + X_AXIS_HEIGHT + TOP_BUFFER;
  
  // --- Single Tool Gesture Logic ---
  const translateX = useSharedValue((80.0 / MAX_LIFESPAN) * chartWidth);
  const context = useSharedValue({ x: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => { context.value = { x: translateX.value }; })
    .onUpdate((event) => {
      let newX = context.value.x + event.translationX;
      translateX.value = Math.max(0, Math.min(newX, chartWidth));
    });

  // --- Range Tool Gesture Logic ---
  const rangeStartX = useSharedValue((102 / MAX_LIFESPAN) * chartWidth);
  const rangeEndX = useSharedValue((126 / MAX_LIFESPAN) * chartWidth);
  const rangeContext = useSharedValue({ start: rangeStartX.value, end: rangeEndX.value });

  const movePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      const x = event.translationX;
      rangeStartX.value = clamp(0, rangeContext.value.start + x, rangeEndX.value - 2*RANGE_HANDLE_SIZE);
      rangeEndX.value = clamp(rangeStartX.value + 2* RANGE_HANDLE_SIZE, rangeContext.value.end + x, chartWidth);
      // const rangeWidth = rangeContext.value.end - rangeContext.value.start;
      // const newStart = Math.max(0, Math.min(rangeStartX.value + event.translationX, chartWidth - rangeWidth));
      // rangeStartX.value = newStart;
      // rangeEndX.value = newStart + rangeWidth;
    });

  const leftHandlePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      rangeStartX.value = clamp(0, rangeContext.value.start + event.translationX, rangeContext.value.end - 2*RANGE_HANDLE_SIZE);
      // const newStart = rangeContext.value.start + event.translationX;
      // rangeStartX.value = Math.max(0, Math.min(newStart, rangeEndX.value - RANGE_HANDLE_SIZE));
    });

  const rightHandlePanGesture = Gesture.Pan()
    .onStart(() => { rangeContext.value = { start: rangeStartX.value, end: rangeEndX.value }; })
    .onUpdate((event) => {
      rangeEndX.value = clamp(rangeContext.value.start + 2 * RANGE_HANDLE_SIZE, rangeContext.value.end + event.translationX, chartWidth);
      // const newEnd = rangeContext.value.end + event.translationX;
      // rangeEndX.value = Math.min(chartWidth, Math.max(newEnd, rangeStartX.value + RANGE_HANDLE_SIZE));
    });

  // --- Animated Props ---
  const animatedToolProps = useAnimatedProps(() => ({ transform: [{ translateX: translateX.value }] }));
  const animatedLabelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  const animatedRangeRectProps = useAnimatedProps(() => ({
    x: (rangeStartX.value + rangeEndX.value) / 2 - RANGE_HANDLE_SIZE / 2,
  }));
  const animatedRangeLeftLineProps = useAnimatedProps(() => ({ x1: rangeStartX.value, x2: rangeStartX.value }));
  const animatedRangeRightLineProps = useAnimatedProps(() => ({ x1: rangeEndX.value, x2: rangeEndX.value }));
  const animatedLeftHandleProps = useAnimatedProps(() => ({ x: rangeStartX.value - RANGE_HANDLE_SIZE / 2 }));
  const animatedRightHandleProps = useAnimatedProps(() => ({ x: rangeEndX.value - RANGE_HANDLE_SIZE / 2 }));
  
  // --- NEW ---: We create an animated style for the absolutely positioned label View
  const animatedRangeLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: (rangeStartX.value + rangeEndX.value) / 2}]
    }
  });

  // --- DELETED ---: Removed unused animated props and derived values
  // const animatedMoveHandleProps = ...
  // const animatedCountTextProps = ...
  // const countText = ...

  // --- Reactions for JS-side updates ---
  useAnimatedReaction(
    () => translateX.value,
    (currentValue) => runOnJS(setToolValue)((currentValue / chartWidth) * MAX_LIFESPAN),
    [chartWidth]
  );
  
  // --- MODIFIED ---: Revert to using runOnJS to update the React state for the label.
  useAnimatedReaction(
    () => ({ start: rangeStartX.value, end: rangeEndX.value }),
    (currentRange, previousRange) => {
      if (currentRange.start !== previousRange?.start || currentRange.end !== previousRange?.end) {
        const minLifespan = (currentRange.start / chartWidth) * MAX_LIFESPAN;
        const maxLifespan = (currentRange.end / chartWidth) * MAX_LIFESPAN;
        const count = displayedData.filter(item => item.lifespan >= minLifespan && item.lifespan <= maxLifespan).length;
        // This will now correctly update the <Text> component via React state
        runOnJS(setRangeCount)(count);
      }
    },
    [chartWidth, displayedData]
  );
  
  // --- Sorting Handlers ---
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

  const [valueToolActive, setValueToolActive] = useState(false);
  const [rangeToolActive, setRangeToolActive] = useState(false);
  const handleValueTool = (isActive) =>{
    if(isActive && !rangeToolActive){
      setValueToolActive(true);
    }else if(rangeToolActive && isActive){
      setValueToolActive(true);
    }else if(rangeToolActive){
      setValueToolActive(false);
    }else{
      setValueToolActive(false);
    }
  }

  const handleRangeTool = (isActive) =>{
    if(isActive && !valueToolActive){
       setRangeToolActive(true);
    }else if(valueToolActive && isActive){
      setRangeToolActive(true);
    }else if(valueToolActive){
      setRangeToolActive(false);
    }else{
       setRangeToolActive(false);
    }
  }

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

      {/* --- MODIFIED ---: Adjust overall height to account for labels */}
      <View style={[styles.chartContainer, { height: SVG_HEIGHT + TOOL_LABEL_OFFSET_Y }]}>
        
        {valueToolActive && (
          <Animated.View style={[styles.toolLabelContainer, { left: Y_AXIS_WIDTH, top: TOP_BUFFER }, animatedLabelStyle]}>
              <Text style={styles.toolLabelText}>{toolValue.toFixed(1)}</Text>
          </Animated.View> 
        )}

        {/* --- NEW ---: Add the new animated label for the range count */}
        {rangeToolActive && (
        <Animated.View style={[styles.rangeLabelContainer, animatedRangeLabelStyle]}>
          <Text style={styles.rangeLabelText}>count: {rangeCount}</Text>
        </Animated.View>
        )}

        <Svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ zIndex: 1 }}>
          {/* --- MODIFIED ---: Translate the entire chart group down to make space for labels */}
          <G x={Y_AXIS_WIDTH} y={TOP_BUFFER}>
            {/* X-Axis */}
            <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={AXIS_COLOR} strokeWidth="1"/>
            {Array.from({ length: 11 }).map((_, i) => {
              const val = i * 14;
              const xPos = (val / MAX_LIFESPAN) * chartWidth;
              return (<SvgText key={`label-${i}`} x={xPos} y={chartHeight + 15} fill={AXIS_COLOR} fontSize="12" textAnchor="middle">{val}</SvgText>);
            })}
            
            {/* Data Bars */}
            {displayedData.map((item, index) => (
              <BatteryBar
                key={`bar-${index}`}
                item={item}
                index={index}
                chartWidth={chartWidth}
                rangeStartX={rangeStartX}
                rangeEndX={rangeEndX}
              />
            ))}
            
            {/* Range Tool */}
            {rangeToolActive && (
            <G>
              <AnimatedRect y="0" height={chartHeight} fill={RANGE_TOOL_COLOR} opacity="0.2" animatedProps={animatedRangeRectProps} />
              <AnimatedLine y1="0" y2={chartHeight} stroke={RANGE_TOOL_COLOR} strokeWidth="2" animatedProps={animatedRangeLeftLineProps} />
              <AnimatedLine y1="0" y2={chartHeight} stroke={RANGE_TOOL_COLOR} strokeWidth="2" animatedProps={animatedRangeRightLineProps} />
            </G>
            )}
              {/* --- DELETED ---: Removed the SvgText component */}
              
              {/* --- MODIFIED ---: Changed y-position of handles to match new coordinate system */}
              
              {rangeToolActive && (
              <GestureDetector gesture={leftHandlePanGesture}>
                  <AnimatedRect y={chartHeight} width={RANGE_HANDLE_SIZE} height={RANGE_HANDLE_SIZE} fill={RANGE_TOOL_COLOR} animatedProps={animatedLeftHandleProps} />
              </GestureDetector>
              )}
              {rangeToolActive && ( 
              <GestureDetector gesture={rightHandlePanGesture}>
                  <AnimatedRect y={chartHeight} width={RANGE_HANDLE_SIZE} height={RANGE_HANDLE_SIZE} fill={RANGE_TOOL_COLOR} animatedProps={animatedRightHandleProps} />
              </GestureDetector>
              )}
              {rangeToolActive && ( 
              <GestureDetector gesture={movePanGesture}>
                  {/* --- MODIFIED ---: The "move" gesture area is now the transparent rect of the range itself */}
                  {/* <AnimatedRect y="0" height={chartHeight} fill="transparent" animatedProps={animatedRangeRectProps} />*/}
                  <AnimatedRect y={chartHeight} width={RANGE_HANDLE_SIZE} height={RANGE_HANDLE_SIZE} fill={RANGE_TOOL_COLOR} animatedProps={animatedRangeRectProps} />
              </GestureDetector>
              )} 
    
            
          
            {/* Single Value Tool with its own gesture */}
            {valueToolActive && (
            <GestureDetector gesture={panGesture}>
              <AnimatedG animatedProps={animatedToolProps}>
                <Rect x="-10" y={-5} width="20" height={chartHeight + 10} fill="transparent" />
                <Line y1={-5} y2={chartHeight} stroke={TOOL_COLOR} strokeWidth="2" />
                <Rect y={chartHeight} x="-5" width="10" height="10" fill={TOOL_COLOR} />
              </AnimatedG>
            </GestureDetector>
            )}
           
          </G>
          
          {/* Y-Axis */}
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

const styles = StyleSheet.create({
  container: {backgroundColor: '#fff', padding: PADDING, alignItems: 'center', margin: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8},
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  legendColorBox: { width: 15, height: 15, marginRight: 8 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  switchControl: { alignItems: 'center' },
  chartContainer: { width: '100%', marginTop: 20, position: 'relative' },
  xAxisTitle: { fontSize: 12, color: AXIS_COLOR, marginTop: 10 },
  // --- MODIFIED ---: Adjusted top position
  toolLabelContainer: { position: 'absolute', height: TOOL_LABEL_OFFSET_Y, alignItems: 'center', zIndex: 15 },
  toolLabelText: { color: TOOL_COLOR, fontWeight: 'bold', fontSize: 14, backgroundColor: 'white', paddingHorizontal: 2 },
  // --- NEW ---: Added styles for the new range counter label
  rangeLabelContainer: {
    position: 'absolute',
    top: 0, // Position it at the very top of the chart container
    height: RANGE_LABEL_OFFSET_Y,
    alignItems: 'center',
    zIndex: 10,
    // This is a trick to ensure the text is centered on the line
    // without knowing its width
  },
  rangeLabelText: {
    color: RANGE_TOOL_COLOR,
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: 'white',
    paddingHorizontal: 4,
    // Add a negative margin to visually center the text block itself
    //transform: [{translateX: -Y_AXIS_WIDTH / 2}]
  },
});