import { StyleSheet, StatusBar, Platform } from 'react-native';
import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BarChart } from 'react-native-gifted-charts';
import { RadioButton } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS, clamp, useDerivedValue, useAnimatedProps } from 'react-native-reanimated';
import { Line, Svg, Rect, Text as SvgText, G, Circle} from 'react-native-svg'
import { ReText } from 'react-native-redash';
import { data } from 'autoprefixer';


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
		axis_color: '#000',
		axisCircleFillColor: '#000',
		axisStrokeColor: '#000',
		axisStrokeWidth: 2,
		axisCircleRadius: 5,
	}
}) => {

		const mainContainer = {
		height: graph_config.height + 120,
		width	: graph_config.width + 120,
		flex: 'auto',
	};

	const [data, setData] = useState(initialData);
 
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

	const [originalData] = useState(initialData);
	//Back to unsorted data
	const resetData = () => {
		setData(originalData);
		setChecked('normal'); 
	};

	const [checked, setChecked] = React.useState('normal');


	const maxXvalue = initialData.reduce((max, item) => Math.max(max, item.value), 0);
	const translationX = useSharedValue((maxXvalue /2));
  const prevTranslationX = useSharedValue(0);
		
	const AnimatedLine = Animated.createAnimatedComponent(Line);
	const animatedX = useSharedValue((maxXvalue /2) + 13);
	
	const [isPanning, setIsPanning] = useState(false);
	const [, setRerender] = useState(0);
	 // Gesture configuration
	 const pan = Gesture.Pan()
		 .onStart(() => {
				runOnJS(setIsPanning)(true);
			 	prevTranslationX.value = translationX.value;
		 })
		 .onUpdate((event) => {
				runOnJS(setIsPanning)(true);
			 	translationX.value = clamp(10, event.translationX + prevTranslationX.value, width - 50);
			 	animatedX.value = translationX.value + 15;
				console.log("translationX.value", translationX.value);
				console.log("Width", graph_config.width);
			  //runOnJS(setRerender)(r => r + 1);
		 })
		 .onEnd(() => {
    		runOnJS(setIsPanning)(false);
  	});
 
	 // Animated circle movement
	 const animatedStyles = useAnimatedStyle(() => ({
		 transform: [{ translateX: translationX.value }],
	 }));


	const currentLineValue = useDerivedValue(() =>
  (((translationX.value / graph_config.width) * maxXvalue) - 5).toFixed(0)
	);
	

	const animatedTextStyle = useAnimatedStyle(() => ({
		position: 'absolute',
		left: animatedX.value - 20,
		alignItems: 'center',
	}));


	const newLocal = <View style={{ flex: 'auto', height: graph_config.height + 110}}>
		<BarChart
			data={data.map(item => {
				 if (false) {
            // // Dynamic color while panning
            // return {
            //   ...item,
            //   frontColor:
            //     item.value <= getCurrentLineValue()
            //       ? 'green'
            //       : 'purple'
            // };
          } else {
            // Default color when not panning
            return {
              ...item,
              frontColor: item.label === 'Always Ready' ? '#ffff00' : '#0099ff'
            };
          }
        })}
			height={graph_config.height}
			width={graph_config.width} //Platform.OS !== 'android' && Platform.OS !== 'ios' ? width * 0.9 : width * 0.85
			noOfSections={Platform.OS !== 'android' && Platform.OS !== 'ios' ? 12 : 5}

			barWidth={graph_config.barWidth}
			spacing={graph_config.spacing}
			barBorderRadius={graph_config.barBorderRadius}
			barBorderColor={"#666699"}
			barBorderWidth={0.5}

			yAxisThickness={1}
			xAxisThickness={1}
			xAxisColor={"#666699"}
			yAxisColor={"#666699"}
			xAxisLabelsHeight={1}
			hideRules
			horizontal
			shiftX={Platform.OS !== 'android' && Platform.OS !== 'ios' ? 10 : -(width * 0.15) / 2} 
			/>
	</View>;
	
	
	return (
		<GestureHandlerRootView>
			<ScrollView style={styles.AndroidSafeArea}>
					<Text style={styles.text}>Life Span of Batteries</Text>
						
						{/* <View style={mainContainer}>	
							<Svg height='100%' width='100%' style={svgGraphContainer}>
								{render_x_axis()}
								{render_y_axis()}
								{render_x_axis_ticks()}
							</Svg>
						</View> */}

						<View style ={mainContainer}>

								{newLocal}

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

						</View> 
									
						<View style={styles.gestureView}>
							<GestureDetector gesture={pan}>
								<Animated.View style ={[styles.gestureButton, animatedStyles]}/>
							</GestureDetector>
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
	)
}

const styles = StyleSheet.create({
  AndroidSafeArea:{
		flex: 1,
		flexDirection: 'column',
    backgroundColor: '#e5e7eb',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
	},
	text: {
		margin: height * 0.02,
    fontSize: 30, 
		fontWeight: 'bold', 
		textAlign: 'center', 
		color: "#38BDF8BF",
	},
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
	gestureView:{
			height: 30,
	},
	gestureButton:{
		width: 30, 
		height: 30, 
		backgroundColor: '#b58df1', 
		borderRadius: 20,
	}
});

export default Minitool_1;
