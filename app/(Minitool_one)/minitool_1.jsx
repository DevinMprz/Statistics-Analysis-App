import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, StatusBar, Platform } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { RadioButton } from 'react-native-paper';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS, clamp, useDerivedValue, useAnimatedProps } from 'react-native-reanimated';
import { Line, Svg, Text as SvgText} from 'react-native-svg'
import { isScaleX, ReText } from 'react-native-redash';
import {scaleLinear} from 'd3-scale'

const initialData = [
    {value: 10, label: 'Always Ready' },
    {value: 30, label: 'Tough Cell' },
    {value: 50, label: 'Always Ready' },
    {value: 80, label: 'Tough Cell' },
    {value: 100, label: 'Always Ready' },
    {value: 50, label: 'Tough Cell' },
    {value: 130, label: 'Always Ready' },
    {value: 140, label: 'Tough Cell' },
    {value: 55, label: 'Always Ready' },
    {value: 77, label: 'Tough Cell' },
    {value: 150, label: 'Always Ready' },
    {value: 122, label: 'Tough Cell' },
    {value: 130, label: 'Always Ready' },
    {value: 134, label: 'Tough Cell' },
    {value: 96, label: 'Always Ready' },
    {value: 50, label: 'Tough Cell' },
    {value: 98, label: 'Always Ready' },
    {value: 130, label: 'Tough Cell' },
    {value: 68, label: 'Always Ready' },
    {value: 144, label: 'Tough Cell' },	
];

const  {width, height} = Dimensions.get('window');

const Minitool_1 = ({
	graph_config = {
		barWidth: 10,
		spacing: 10,
		barBorderRadius: 5,
		get height() {
			return (this.barWidth + this.spacing) * 20 + 20;
		},
		width: width * 0.85,
		shiftX: Platform.OS === 'web' ? 0 : -(width * 0.1),
		noteOfSections: Platform.OS !== 'android' && Platform.OS !== 'ios' ? 12 : 6,
		stepValue: Platform.OS === 'web' ? 14 : 28,
	},
	offset = Platform.OS === 'web' ? 2 : 20,
}) => {
 const mainContainer = {
		height: graph_config.height + 190,
		width	: graph_config.width + 190,
	};

	//Button state and data management
	const [checked, setChecked] = useState('normal');
	const [data, setData] = useState(initialData);
	const [originalData] = useState(initialData);
	const maxXvalue = graph_config.stepValue * graph_config.noteOfSections;
	const minXValue = initialData.reduce((min, item) => Math.min(min, item.value), 9999);
	
	 const xScale = useMemo(
    () => scaleLinear().domain([0, maxXvalue]).range([0 + graph_config.shiftX, graph_config.width + graph_config.shiftX]),
    [maxXvalue, graph_config.width]
  	);

	//Sorted by Label
	const sortByLabel = () => {
	  const sortedData = [...data].sort((a, b) => a.label.localeCompare(b.label));
	  setData(sortedData);
	  setChecked('label'); 
	};
	//Sorted by Values
	const sortByValue = () => {
		const sortedData = [...data].sort((a,b) => a.value - b.value);
		setData(sortedData);
		setChecked('value');
	}
	//Back to unsorted data
	const resetData = () => {
		setData(originalData);
		setChecked('normal'); 
	};

	
	
	//Separator gesture
	const translationX = useSharedValue((maxXvalue /2));
  const prevTranslationX = useSharedValue(0);
	const animatedX = useSharedValue((maxXvalue /2) + 15);

	const [isPanning, setIsPanning] = useState(false); 
	const pan = Gesture.Pan()
		 .onStart(() => {
				runOnJS(setIsPanning)(true);
			 	prevTranslationX.value = translationX.value;
		 })
		 .onUpdate((event) => {
			runOnJS(setIsPanning)(true);
			 	translationX.value = clamp(0, event.translationX + prevTranslationX.value, graph_config.width);
			 	animatedX.value = translationX.value + 15;
				// console.log("translationX.value", translationX.value);
				// console.log("Width", graph_config.width);
				// console.log("Height", graph_config.height);
		 })
		 .onEnd(() =>{
			runOnJS(setIsPanning)(false);
		 });

	 const separatorMovement = useAnimatedStyle(() => ({
		 transform: [{ translateX: translationX.value }],
	 }));

	//Separator line 
	const AnimatedLine = Animated.createAnimatedComponent(Line);
	const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

	// const animatedText = useDerivedValue(() => {
	// 	//return (xScale.invert(animatedX.value - 15).toFixed(0) - offset).toString();
	// 	return animatedX.value - 100;
	// });
	


	//Counter gesture
	const minDistanseBeetwenLines = 30;
	const translationXSecond = useSharedValue(maxXvalue / 2 - 40) ;
	const translationXThird = useSharedValue(maxXvalue / 2 + 40);
	const mainXValue = useSharedValue((translationXSecond + translationXThird)/2);
	const latestSecondX = useSharedValue(translationXSecond.value);
	const latestThirdX = useSharedValue(translationXThird.value);

	const [highlightRange, setHighlightRange] = useState({ low: null, up: null });
	
	 useEffect(() => {
    const calculateAndSetHighlightRange = () => {
      // Get the current positions from your interactive handles (translationXSecond, translationXThird)
      // and convert them back to chart data values using xScale.invert.
      // Adjust the '-15' and 'offset' based on how your handles relate to the chart's data points.
      const rawLow = xScale.invert(translationXSecond.value - 15).toFixed(0) - offset;
      const rawUp = xScale.invert(translationXThird.value - 15).toFixed(0) - offset;

      // Ensure low is always less than or equal to up, in case handles cross
      const lowValue = Math.min(rawLow, rawUp);
      const upValue = Math.max(rawLow, rawUp);

      // Update the state with the new range
      setHighlightRange({ low: lowValue, up: upValue });
    };

    // Call the function initially and whenever dependencies change
    calculateAndSetHighlightRange();
  }, [
    translationXSecond.value, // Dependency: value of the first handle's position
    translationXThird.value,  // Dependency: value of the second handle's position
    offset,                   // Dependency: your offset
    // Add other dependencies that affect xScale.invert or range calculation, e.g., graph_config.width, graph_config.maxValue
    graph_config.width,
    graph_config.maxValue,
  ]);	


	
	const handleCounterArea = () => {

		const low = xScale.invert(translationXSecond.value - 15).toFixed(0) - offset; 
		const up = xScale.invert(translationXThird.value - 15).toFixed(0) - offset;
		
    let count = 0;

    initialData.forEach((el) => {
      if (el.value >= low && el.value <= up) {
        count++;
      }
    });
    return count;
  };

	
	const mainCounterPan = Gesture.Pan()
		.onStart(() => {
			runOnJS(setIsPanning)(true);
			// store initial offsets for both lines
			prevTranslationX.value = 0;
			latestSecondX.value = translationXSecond.value;
			latestThirdX.value = translationXThird.value;
		})
		.onUpdate((event) => {
			runOnJS(setIsPanning)(true);
			const pointer_x = event.translationX;
			
			translationXSecond.value = clamp(
				0,
				latestSecondX.value + pointer_x,
				graph_config.width - minDistanseBeetwenLines,
			);

			translationXThird.value = clamp(
				minDistanseBeetwenLines,
				latestThirdX.value + pointer_x,
				graph_config.width
			);

			//handleCounterArea();
			//console.log(currentAmountVal);
		})
		.onEnd(() => {
			runOnJS(setIsPanning)(false);

			// update latest positions
			latestSecondX.value = translationXSecond.value;
			latestThirdX.value = translationXThird.value;
		});

		const secondButtonPan = Gesture.Pan()
			.onStart(() => {
				runOnJS(setIsPanning)(true);
				prevTranslationX.value = translationXSecond.value;
			})
			.onUpdate((event) => {
				runOnJS(setIsPanning)(true);
				const clamped = clamp(
					0,
					event.translationX + prevTranslationX.value,
					translationXThird.value -  minDistanseBeetwenLines,
				);
	
				translationXSecond.value = clamped;
				latestSecondX.value = clamped;
	
				//handleCounterArea();
			})
			.onEnd(() => {
				runOnJS(setIsPanning)(false);
			});
	
		const thirdButtonPan = Gesture.Pan()
			.onStart(() => {
				runOnJS(setIsPanning)(true);
				prevTranslationX.value = translationXThird.value;
			})
			.onUpdate((event) => {
				runOnJS(setIsPanning)(true);
				const clamped = clamp(
					translationXSecond.value + minDistanseBeetwenLines,
					event.translationX + prevTranslationX.value,
					graph_config.width
				);
	
				translationXThird.value = clamped;
				latestThirdX.value = clamped;
	
				//handleCounterArea();
			})
			.onEnd(() => {
				runOnJS(setIsPanning)(false);
			});
		
		const counterSecondButtonMovement = useAnimatedStyle(() => ({
			transform: [{translateX: translationXSecond.value - 15}],
		}));		
		const counterThirdButtonMovement = useAnimatedStyle(() => ({
			transform: [{translateX: translationXThird.value - 45}],
		}));	
		const counterMainMovement = useAnimatedStyle(() => ({
			transform: [{translateX: (translationXSecond.value + translationXThird.value) / 2 - 15}],
		}));


	const Chart = <View style={{ height: graph_config.height + 110 }}>
		<BarChart
			//Data for the chart
			data={data.map(item => {
          // The value of the bar is its 'end' for horizontal bars
          const barEndValue = item.value;

          // Determine if the bar's end is within the calculated highlight range
          const isInsideGreenRange =
            highlightRange.low !== null && // Ensure range has been set
            barEndValue >= highlightRange.low &&
            barEndValue <= highlightRange.up;

          let frontColor;
          if (isInsideGreenRange) {
            frontColor = '#00ff00'; // Green: if the bar's end is within the dynamic range
          } else if (item.label === 'Always Ready') {
            frontColor = '#ffff00'; // Yellow: for Company A
          } else {
            frontColor = '#0099ff'; // Blue: for Company B
          }

          return {
            ...item,
            frontColor: frontColor,
          };
        })}
			// data={data.map(item => {
      //       return {
      //         ...item,
      //         frontColor: item.label === 'Always Ready' ? '#ffff00' : '#0099ff'
      //       };
          
      // })}

			//Chart main settings	
			height={graph_config.height}
			width={graph_config.width}
			hideRules
			horizontal
			shiftX={graph_config.shiftX} 
			noOfSections={graph_config.noteOfSections}
			stepValue={graph_config.stepValue}
			maxValue={graph_config.stepValue * graph_config.noteOfSections}
			
			//Bar settings
			barWidth={graph_config.barWidth}
			spacing={graph_config.spacing}
			barBorderRadius={graph_config.barBorderRadius}
			barBorderColor={"#666699"}
			barBorderWidth={0.5}
			
			//Axis settings
			yAxisThickness={1}
			xAxisThickness={1}
			xAxisColor={"#666699"}
			yAxisColor={"#666699"}
			xAxisLabelsHeight={1}
			/>
	</View>;
	
	return (
		<GestureHandlerRootView>
				<ScrollView style={styles.AndroidSafeArea}>
						{/*Main label*/}
						<Text style={styles.text}>Life Span of Batteries</Text>
						
						{/*Main container for chart and two functions: separator and counter*/}	
						<View style ={mainContainer}>

							{Chart}
							
							<Svg 
							width="100%"
							height="100%"
							style={{ position: 'absolute'}}
							>	
								<AnimatedLine
									x1={animatedX}
									y1={30}
									x2={animatedX}
									y2={graph_config.height + 120}
									stroke="#b58df1"
									strokeWidth="3"
								/>
								<AnimatedSvgText
									x={animatedX}
									y={30}
									fontSize={12}
									fill={'#000'}
								>
									{xScale.invert(animatedX.value - 15).toFixed(0) - offset}
								</AnimatedSvgText>
							</Svg>


							<Svg 
							width="100%"
							height="100%"
							style={{ position: 'absolute'}}>
								
								<AnimatedLine
									x1={translationXSecond}
									y1={graph_config.height + 185}
									x2={translationXThird}
									y2={graph_config.height + 185}
									stroke="#000"
									strokeWidth="3"
								/>
								<AnimatedLine
									x1={translationXSecond}
									y1={30}
									x2={translationXSecond}
									y2={graph_config.height + 187}
									stroke="#000"
									strokeWidth="3"
									/>
								<AnimatedLine
									x1={translationXThird}
									y1={30}
									x2={translationXThird}
									y2={graph_config.height + 187}
									stroke="#000"
									strokeWidth="3"
								/>
								 <SvgText
                  x={translationXSecond.value + 20}
                  y={30}
                  fontSize={12}
                  fill={'#000'}
                >
                  {handleCounterArea()}
                </SvgText>
							</Svg>

						
							<View style={styles.gestureView}>
								<GestureDetector gesture={pan}>
									<Animated.View style ={[styles.gestureButton, separatorMovement]}/>
								</GestureDetector>
								<View style={{flexDirection: 'row', height: 30, margin: 0}}>
									<GestureDetector gesture={secondButtonPan}>
										<Animated.View style ={[styles.counterAdditionalButton, counterSecondButtonMovement]}/>
									</GestureDetector>
									<GestureDetector gesture={thirdButtonPan}>
										<Animated.View style ={[styles.counterAdditionalButton, counterThirdButtonMovement]}/>
									</GestureDetector>
								</View>
								<View style={{height: 30}}>
									<GestureDetector gesture={mainCounterPan}>
										<Animated.View style={[styles.counterMainButton, counterMainMovement]} />
									</GestureDetector>	
								</View>
							</View>
						</View> 
										
					
		
						<View style={styles.buttonContainer}>
								<View style={styles.radioButton}>		
									<RadioButton
										value='normal'
										status={checked === 'normal' ? 'checked' : 'unchecked' }
										onPress={resetData}
										uncheckedColor='#38BDF8BF'
										color='#ff0066'
									/>
									<Text style={{ fontSize: 18}}>Normal Data</Text>
								</View>
								<View style={styles.radioButton}>
									<RadioButton 
										value='label'
										status={checked === 'label' ? 'checked' : 'unchecked' }
										onPress={sortByLabel}
										uncheckedColor='#38BDF8BF'
										color='#ff0066'
									/>
									<Text style={{ fontSize: 18}}>Sort by Label</Text>	
								</View>
								<View style={styles.radioButton}>	
									<RadioButton
										value='value'
										status={checked === 'value' ? 'checked' : 'unchecked' }
										onPress={sortByValue}
										uncheckedColor='#38BDF8BF'
										color='#ff0066'
									/>
									<Text style={{ fontSize: 18}}>Sort by Value</Text>
								</View>
						</View> 		
				</ScrollView>
		</GestureHandlerRootView>		  		
)}

const styles = StyleSheet.create({
  AndroidSafeArea:{
		flex: 1,
		flexDirection: 'column',
    backgroundColor: '#e5e7eb',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	text: {
		margin: height * 0.02,
    fontSize: 30, 
		fontWeight: 'bold', 
		textAlign: 'center', 
		color: "#38BDF8BF",
	},
	
	//Sort buttons style
	buttonContainer:{
		height: 60,
		display: "flex", 
		flexDirection: "row", 
		alignItems: "center", 
		justifyContent: "space-evenly"
	},
	radioButton:{
		display: "flex", 
		flexDirection: "column", 
		alignItems: "center"
	},
	//-------------------
	//Separator movement
	gestureView:{
			height: 100,
	},
	gestureButton:{
		width: 30, 
		height: 30, 
		backgroundColor: '#b58df1', 
		borderRadius: 20,
	},
	//--------------------
	//Counter gesture
	counterMainButton: {
    width: 30,
    height: 30,
    backgroundColor: "#000",
    borderRadius: 20,
  },
	counterAdditionalButton: {
    width: 30,
    height: 30,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
	//------
});

export default Minitool_1;
