import React, { useState, useMemo, useEffect} from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, StatusBar, Platform} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS, clamp} from 'react-native-reanimated';
import { Line, Svg, Text as SvgText} from 'react-native-svg'
import {scaleLinear} from 'd3-scale'
import { RadioButton } from 'react-native-paper';
import CustomTabBar from './minitool_one_components/customTabBar';
import CustomButton from '../../components/customButton';
import CustomDataForm from './minitool_one_components/customDataForm';



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
const platform = Platform.OS;

const Minitool_1 = ({
	graph_config = {
		barWidth: 10,
		spacing: 10,
		barBorderRadius: 5,
		get height() {
			return (this.barWidth + this.spacing) * 20 + 20;
		},
		width: width * 0.75,
		shiftX: platform === 'web' ? 0 : -(width * 0.1),
		noteOfSections: platform !== 'android' && platform !== 'ios' ? 12 : 6,
		stepValue: platform === 'web' ? 14 : 28,
	},
	offset = platform === 'web' ? 3 : 24,
}) => {
 const mainContainer = {
		height: graph_config.height + 180,
		width	: graph_config.width + 190,
	};

	// State for active tools, can be 'value', 'range', 'none' and 'both'
	// It helps to display tools
	const [activeTool, setActiveTool] = useState('none');

	//Shared value for data, which is used by barChart to change data
	//State allows to return to intiall data if user wants to
	const data = useSharedValue(initialData);
	const [originalData, setOriginalData] = useState(data.value);
	//State which is triggered by special customForm, which allows user
	//to paste his own data
	const [isFormActive, setIsFormActive] = useState(false);
	
	useEffect(() => {
		if(platform === 'web'){
			const loaded = [];

			Object.keys(localStorage).forEach((key) => {
			try {
				const item = JSON.parse(localStorage.getItem(key));
				if (item && typeof item === "object" && item.value && item.label) {
					loaded.push({ value: item.value, label: item.label });
				}
			} catch (e) {
				console.warn("Invalid JSON in localStorage:", key);
			}
			});

			loaded.length === 0 ? data.value = initialData : data.value = loaded;
			setOriginalData(data.value);
			localStorage.clear();
		}
	}, [isFormActive]);
	
	//State for 3 radio buttons, used to sort data
	const [checked, setChecked] = useState('normal');
	//Sorts data by it's label
	const sortByLabel = () => {
	  const sortedData = [...data.value].sort((a, b) => a.label.localeCompare(b.label));
	  data.value = (sortedData);
	  setChecked('label');
	};
	//Sorts data by Values(from lowest -> to higest)
	const sortByValue = () => {
		const sortedData = [...data.value].sort((a,b) => a.value - b.value);
		data.value = (sortedData);
		setChecked('value');
	}
	//Back to unsorted data
	const resetData = () => {
		data.value = (originalData);
		setChecked('normal'); 
	};	
	

	//Special function which allows to map linear x values to data range x values
	const maxXvalue = graph_config.stepValue * graph_config.noteOfSections;
	const xScale = useMemo(
    () => scaleLinear().domain([0, maxXvalue]).range([0 + graph_config.shiftX, graph_config.width + graph_config.shiftX]),
    [maxXvalue, graph_config.width]
  );
	//"Value tool"--------------------------------------------
	const translationX = useSharedValue((maxXvalue /2))
  const prevTranslationX = useSharedValue(0);
	//Special const whic is used to draw separator line and display value of "Value tool"
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
		 })
		 .onEnd(() =>{
			runOnJS(setIsPanning)(false);
		 });

	 const separatorMovement = useAnimatedStyle(() => ({
		 transform: [{ translateX: translationX.value }],
	 }));

	//"Value tool" components - line and text 
	const AnimatedLine = Animated.createAnimatedComponent(Line);
	const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

	//"Range tool"-------------------------------------------------------------------------
	//Special const which doesn't allow two lines of "Range tool"  
	// to be closer than 30 pixels from each other
	const minDistanseBeetwenLines = 30;
	//Special const whic is used to draw three lines of "Range tool" and display counter value
	const translationXSecond = useSharedValue(maxXvalue / 2 - 40) ;
	const translationXThird = useSharedValue(maxXvalue / 2 + 40);
	const mainXValue = useSharedValue((translationXSecond + translationXThird)/2);
	const latestSecondX = useSharedValue(translationXSecond.value);
	const latestThirdX = useSharedValue(translationXThird.value);

	const [highlightRange, setHighlightRange] = useState({ low: null, up: null });
	
	//Use effect which is used to rerender BarChart colors
	useEffect(() => {
    const calculateAndSetHighlightRange = () => {
      const rawLow = xScale.invert(translationXSecond.value - 15).toFixed(0) - offset;
      const rawUp = xScale.invert(translationXThird.value - 15).toFixed(0) - offset;

      const lowValue = Math.min(rawLow, rawUp);
      const upValue = Math.max(rawLow, rawUp);

      setHighlightRange({ low: lowValue, up: upValue });
  };
    calculateAndSetHighlightRange();
  }, [
    translationXSecond.value,
    translationXThird.value,
    offset,          
    graph_config.width,
    graph_config.maxValue,
  ]);	

	//Special function which counts how many chart are in range
	const handleCounterArea = () => {

		const low = xScale.invert(translationXSecond.value - 15).toFixed(0) - offset; 
		const up = xScale.invert(translationXThird.value - 15).toFixed(0) - offset;
		
    let count = 0;

    data.value.forEach((el) => {
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

	//View which represent actuall BarChart with all it's modifications
	const Chart = <View style={{ height: graph_config.height + 110 }}>
		<BarChart
			//Data for the chart
			data={data.value.map(item => {
    
          const barEndValue = item.value;

          const isInsideGreenRange =
            highlightRange.low !== null &&
            barEndValue >= highlightRange.low &&
            barEndValue <= highlightRange.up;

          let frontColor;
          if (isInsideGreenRange) {
            frontColor = '#bf00ff'; 
          } else if (item.label === 'Always Ready') {
            frontColor = '#ffff00'; 
          } else {
            frontColor = '#0099ff'; 
          }
          return {
            ...item,
            frontColor: frontColor,
          };
        })}
		

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

	//Help to increase the line length if there are two settings on the screen at the same time
	const default_length = graph_config.height + 155;
	const [activeLength, setActiveLength] = useState(graph_config.height + 155);
	const tabs = [
		<CustomButton
			title={'Value tool'}
			hadlePress={() => {
				if(activeTool === 'none'){
					setActiveTool('value');
				}else if(activeTool === 'range'){
					setActiveLength(default_length + 10);
					setActiveTool('both');
				}else if(activeTool === 'both'){
					setActiveTool('range');
					setActiveLength(default_length);
				}else{
					setActiveTool('none');
				}
			}}
			containerStyles = {`bg-sky-400/75 w-full m-4`}
			testID={'custom-button-Value-tool'}
		/>,
		<CustomButton
			title={'Range tool'}
			hadlePress={() => {
				if(activeTool === 'none'){
					setActiveTool('range');
				}else if(activeTool === 'value'){
					setActiveLength(default_length + 10);
					setActiveTool('both');
				}else if(activeTool === 'both'){
					setActiveTool('value');
					setActiveLength(default_length);
					setHighlightRange({low: null, up: null});
				}else{
					setActiveTool('none');
					setHighlightRange({low: null, up: null});
				}
			}}
			containerStyles = "bg-sky-400/75 w-full m-4"
			testID={'custom-button-Range-tool'}
		/>
		]
	const additionalTabs = [
			<CustomButton
			title={'Add data'}
			hadlePress={() => {
        setIsFormActive(true);
      }}
			containerStyles = "bg-sky-400/75 w-full m-4"
			testID={'custom-button-Add-data'}
		/>,
    <CustomButton
			title={'Reset data'}
			hadlePress={() => {
        data.value = initialData;
        setOriginalData(initialData);
      }}
			containerStyles = "bg-sky-400/75 w-full m-4"
		/>,
		]
	return (
		<GestureHandlerRootView>
			 {isFormActive ? (<CustomDataForm formHandler={setIsFormActive} />) : null}
				<ScrollView style={styles.AndroidSafeArea}>
						{/*Main label*/}
						<Text style={styles.text}>Life Span of Batteries</Text>
					 
						<View style={{
							height: platform === 'web' ? height * 0.85 : height * 0.7 , 
							width: width, 
							margin: 0, 
							flexDirection: platform === 'web' ? 'row': 'column', 
							}}
							>
							{/*Main container for chart and two functions: separator and counter*/}	
							<View style ={mainContainer}>

							{Chart}
							
							{(activeTool === 'value' || activeTool === 'both') && (<View style ={styles.absoluteFill} >
									<Svg 
									width="100%"
									height="100%"
									style={{ position: 'absolute'}}
									>	
										<AnimatedLine
											x1={animatedX}
											y1={50}
											x2={animatedX}
											y2={graph_config.height + 120}
											stroke="#000099"
											strokeWidth="3"
										/>
										<AnimatedSvgText
											x={animatedX}
											y={50}
											fontSize={20}
											fill={'#000099'}
										>
											{xScale.invert(animatedX.value - 15).toFixed(0) - offset}
										</AnimatedSvgText>
									</Svg>
								</View>
							)}
							{(activeTool === 'value') && (<View style={styles.gestureView}>
									<GestureDetector gesture={pan}>
										<Animated.View style ={[styles.gestureButton, separatorMovement]}/>
									</GestureDetector>
								</View>
							)}

							{(activeTool === 'range' || activeTool === 'both') && (<View style ={styles.absoluteFill} >
									<Svg 
										width="100%"
										height="100%"
										style={{ position: 'absolute'}}
										>
										<AnimatedLine
											x1={translationXSecond}
											y1={activeLength}
											x2={translationXThird}
											y2={activeLength}
											stroke="#f53b57"
											strokeWidth="3"
										/>
										<AnimatedLine
											x1={translationXSecond}
											y1={30}
											x2={translationXSecond}
											y2={activeLength + 1}
											stroke="#f53b57"
											strokeWidth="3"
											/>
										<AnimatedLine
											x1={translationXThird}
											y1={30}
											x2={translationXThird}
											y2={activeLength + 1}
											stroke="#f53b57"
											strokeWidth="3"
										/>
										<SvgText
											x={translationXSecond.value + 20}
											y={30}
											fontSize={20}
											fill={'#f53b57'}
										>
											{`Count: ${handleCounterArea()}`}
										</SvgText>
									</Svg> 
								</View>
							)}
							{(activeTool === 'range') && (<View style={styles.gestureView}>
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
							)}
							
							{(activeTool === 'both') && (<View style={styles.gestureView}>
								<View style={{
									height: 20,
								}}>
									<GestureDetector gesture={pan}>
										<Animated.View style ={[styles.gestureButton, separatorMovement]}/>
									</GestureDetector>
								</View>
								<View style={styles.gestureView}>
									<View style={{flexDirection: 'row', height: 20, margin: 0}}>
										<GestureDetector gesture={secondButtonPan}>
											<Animated.View style ={[styles.counterAdditionalButton, counterSecondButtonMovement]}/>
										</GestureDetector>
										<GestureDetector gesture={thirdButtonPan}>
											<Animated.View style ={[styles.counterAdditionalButton, counterThirdButtonMovement]}/>
										</GestureDetector>
									</View>
									<View style={{height: 20}}>
										<GestureDetector gesture={mainCounterPan}>
											<Animated.View style={[styles.counterMainButton, counterMainMovement]} />
										</GestureDetector>	
									</View>
								</View>
								</View>
							)}

							</View> 

							<View style={{
								height: platform === 'web' ? graph_config.height + 190 : 100,
								display: 'flex', 
								flexDirection: platform === 'web' ? 'column' : 'row', 
								alignItems: "center", 
								justifyContent: "space-evenly", 
								}}>
								<View style={styles.radioButton}>		
									<RadioButton
										value='normal'
										status={checked === 'normal' ? 'checked' : 'unchecked' }
										onPress={resetData}
										uncheckedColor='#38BDF8BF'
										color='#ff0066'
										testID="return-to-normal"
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
										testID="sort-by-label-radio"
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
										testID="sort-by-value-radio"
									/>
									<Text style={{ fontSize: 18}}>Sort by Value</Text>
								</View>
							</View>
						</View>
											
				</ScrollView>
				<CustomTabBar
						customTabs={platform === 'web' ? tabs.concat(additionalTabs) : tabs}
						platform={platform}
					/> 
		</GestureHandlerRootView>		  		
)}

const styles = StyleSheet.create({
  AndroidSafeArea:{
		flex: 1,
		flexDirection: 'column',
    backgroundColor: '#e5e7eb',
    paddingTop: platform === 'android' ? StatusBar.currentHeight : 0,
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
		flexDirection: "column", 
		alignItems: "center", 
		justifyContent: "space-evenly",
	},
	radioButton:{
		display: "flex", 
		flexDirection: "column", 
		alignItems: "center"
	},
	//-------------------
	//Separator movement
	gestureView:{
			height: 30,
	},
	gestureButton:{
		width: 30, 
		height: 30, 
		backgroundColor: '#0080ff',
		borderColor: '#000099',
		borderWidth: 2, 
		borderRadius: 20,
	},
	//--------------------
	//Counter gesture
	counterMainButton: {
    width: 30,
    height: 30,
    backgroundColor: "#ffa801",
		borderColor: "#f53b57",
    borderRadius: 20,
		borderWidth: 2, 
  },
	counterAdditionalButton: {
    width: 30,
    height: 30,
    backgroundColor: "#0fbcf9",
    borderColor: "#575fcf",
    borderRadius: 20,
		borderWidth: 2, 
  },
	valueButton: {
		//position: "absolute",
    height: 100,
		width: 100,
	},
  absoluteFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
	//-------
});

export default Minitool_1;
