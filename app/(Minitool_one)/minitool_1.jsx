import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, StatusBar, Platform } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { RadioButton } from 'react-native-paper';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS, clamp, useDerivedValue } from 'react-native-reanimated';
import { Line, Svg} from 'react-native-svg'
import { ReText } from 'react-native-redash';

const initialData = [
    {value: 10, label: 'Always Ready' },
    {value: 30, label: 'Tough Cell' },
    {value: 50, label: 'Always Ready' },
    {value: 80, label: 'Tough Cell' },
    {value: 100, label: 'Always Ready' },
    {value: 50, label: 'Tough Cell' },
    {value: 130, label: 'Always Ready' },
    {value: 200, label: 'Tough Cell' },
    {value: 55, label: 'Always Ready' },
    {value: 77, label: 'Tough Cell' },
    {value: 150, label: 'Always Ready' },
    {value: 190, label: 'Tough Cell' },
    {value: 130, label: 'Always Ready' },
    {value: 250, label: 'Tough Cell' },
    {value: 100, label: 'Always Ready' },
    {value: 50, label: 'Tough Cell' },
    {value: 98, label: 'Always Ready' },
    {value: 300, label: 'Tough Cell' },
    {value: 68, label: 'Always Ready' },
    {value: 225, label: 'Tough Cell' },	
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
		shiftX: Platform.OS !== 'android' && Platform.OS !== 'ios' ? -(width * 0.01) : -(width * 0.1),
		noteOfSections: Platform.OS !== 'android' && Platform.OS !== 'ios' ? 12 : 5,
	}
}) => {
 const mainContainer = {
		height: graph_config.height + 180,
		width	: graph_config.width + 180,
	};

	//Button state and data management
	const [checked, setChecked] = useState('normal');
	const [data, setData] = useState(initialData);
	const [originalData] = useState(initialData);
	const maxXvalue = initialData.reduce((max, item) => Math.max(max, item.value), 0);
	
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
	
	const currentLineValue = useDerivedValue(() =>
		(((((animatedX.value - 15) * maxXvalue)) / graph_config.width)).toFixed(0)
	);
	
	const animatedTextStyle = useAnimatedStyle(() => ({
		position: 'absolute',
		left: animatedX.value - 20,
		alignItems: 'center',
	}));

	//Counter gesture
	const minDistanseBeetwenLines = 30;
	const translationXSecond = useSharedValue(maxXvalue / 2 - 40);
	const translationXThird = useSharedValue(maxXvalue / 2 + 40);
	const latestSecondX = useSharedValue(translationXSecond.value);
	const latestThirdX = useSharedValue(translationXThird.value);
	
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
					graph_config.width
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
					0,
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
			transform: [{translateX: translationXSecond.value}],
		}));		
		const counterThirdButtonMovement = useAnimatedStyle(() => ({
			transform: [{translateX: translationXThird.value}],
		}));	
		const counterMainMovement = useAnimatedStyle(() => ({
			transform: [{translateX: (translationXSecond.value + translationXThird.value) / 2 - 15}],
		}));

	const Chart = <View style={{ height: graph_config.height + 110 }}>
		<BarChart
			//Data for the chart
			data={data.map(item => {
            return {
              ...item,
              frontColor: item.label === 'Always Ready' ? '#ffff00' : '#0099ff'
            };
          
      })}

			//Chart main settings	
			height={graph_config.height}
			width={graph_config.width}
			hideRules
			horizontal
			shiftX={graph_config.shiftX} 
			
			//Bar settings
			barWidth={graph_config.barWidth}
			spacing={graph_config.spacing}
			barBorderRadius={graph_config.barBorderRadius}
			barBorderColor={"#666699"}
			barBorderWidth={0.5}
			
			//Axis settings
			noOfSections={graph_config.noteOfSections}
			maxValue={maxXvalue + 10}
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
							
							<Animated.View style={animatedTextStyle}>
									<ReText
									text={currentLineValue}
									style={{ color: '#b58df1', fontWeight: 'bold', fontSize: 16 }}
								/>
							</Animated.View>

							<Svg 
							width="100%"
							height="100%"
							style={{ position: 'absolute'}}>
								<AnimatedLine
									x1={animatedX}
									y1={30}
									x2={animatedX}
									y2={graph_config.height + 120}
									stroke="#b58df1"
									strokeWidth="3"
								/>
							</Svg>

							<Svg 
							width="100%"
							height="100%"
							style={{ position: 'absolute'}}>
								<AnimatedLine
									x1={translationXSecond}
									y1={graph_config.height + 155}
									x2={translationXThird}
									y2={graph_config.height + 155}
									stroke="#000"
									strokeWidth="3"
								/>
							</Svg>

							<Svg width="100%" height="100%">
										<AnimatedLine
											x1={translationXSecond}
											y1={30}
											x2={translationXSecond}
											y2={graph_config.height + 157}
											stroke="#000"
											strokeWidth="3"
										/>
							</Svg>

							<Svg width="100%" height="100%">
								<AnimatedLine
									x1={translationXThird}
									y1={30}
									x2={translationXThird}
									y2={graph_config.height + 157}
									stroke="#000"
									strokeWidth="3"
								/>
							</Svg>

							{/* <GestureDetector gesture={handleSecondLinePan}>
								<Animated.View style={styles.absoluteFill}>
									<Svg width="100%" height="100%">
										<AnimatedLine
											x1={translationXSecond}
											y1={30}
											x2={translationXSecond}
											y2={graph_config.height + 157}
											stroke="#000"
											strokeWidth="3"
										/>
									</Svg>
								</Animated.View>
							</GestureDetector> */}
{/* 		
							<GestureDetector gesture={handleThirdLinePan}>
								<Animated.View style={styles.absoluteFill}>
									<Svg width="100%" height="100%">
										<AnimatedLine
											x1={translationXThird}
											y1={30}
											x2={translationXThird}
											y2={graph_config.height + 157}
											stroke="#000"
											strokeWidth="3"
										/>
									</Svg>
								</Animated.View>
							</GestureDetector> */}

							<View style={styles.gestureView}>
								<GestureDetector gesture={pan}>
									<Animated.View style ={[styles.gestureButton, separatorMovement]}/>
								</GestureDetector>
								<GestureDetector gesture={secondButtonPan}>
									<Animated.View style ={[styles.counterAdditionalButton, counterSecondButtonMovement]}/>
								</GestureDetector>
								<GestureDetector gesture={thirdButtonPan}>
									<Animated.View style ={[styles.counterAdditionalButton, counterThirdButtonMovement]}/>
								</GestureDetector>
								<GestureDetector gesture={mainCounterPan}>
									<Animated.View style={[styles.counterMainButton, counterMainMovement]} />
								</GestureDetector>
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
			height: 60,
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
