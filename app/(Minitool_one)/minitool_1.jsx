import { StyleSheet, StatusBar, Platform } from 'react-native';
import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BarChart } from 'react-native-gifted-charts';
import { RadioButton } from 'react-native-paper';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';


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

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const [height, width] = [Dimensions.get('window').height, Dimensions.get('window').width ]

const Minitool_1 = () => {


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

	
	const translationX = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
    ],
  }));

  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
    })
    .onUpdate((event) => {
      const maxTranslateX = screenWidth / 2 - 50;

      translationX.value = clamp(
        prevTranslationX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
    })
    .runOnJS(true);

	return (
			<ScrollView style ={styles.AndroidSafeArea}>
				<Text style={styles.text}>
					Life Span of Batteries
				</Text>

			<View style={styles.chart}>	  	
					<BarChart 
						data={data.map(item => ({
						...item,
						frontColor: item.label === 'Always Ready' ? '#ffff00' : '#0099ff'
						}))}
						height={(20 * 20) + 20}
						width={ Platform.OS !== 'android' && Platform.OS !== 'ios' ? screenWidth * 0.9 : screenWidth * 0.85}
						noOfSections={Platform.OS !== 'android' && Platform.OS !== 'ios' ? 12 : 5}
						
						barWidth={10}
						spacing={10}
						barBorderRadius={5}
						barBorderColor={"#666699"}
						barBorderWidth={0.5}
						
						yAxisThickness={1}
						xAxisThickness={1}
						xAxisColor={"#666699"}
						yAxisColor={"#666699"}
						xAxisLabelsHeight={1}
						hideRules
						horizontal
						shiftX={Platform.OS !== 'android' && Platform.OS !== 'ios' ? 10 : -(screenWidth * 0.15)/2}
					/>
				</View>

				<GestureHandlerRootView style ={styles.gestureView}>
					<GestureDetector gesture={pan}>
						<Animated.View style ={[styles.gestureButton, animatedStyles]}>
							<GestureDetector gesture={pan}>
								<Animated.View style ={[styles.gestureButton, animatedStyles]} />
							</GestureDetector>	
							<GestureDetector gesture={pan}>
								<Animated.View style ={[styles.gestureButton, 				animatedStyles]} />
							</GestureDetector>		
						</Animated.View>
					</GestureDetector>
				</GestureHandlerRootView>		

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
		margin: screenHeight * 0.02,
    fontSize: 30, 
		fontWeight: 'bold', 
		textAlign: 'center', 
		color: "#38BDF8BF",
	},
	chart: {
		flexGrow: 1,
		height: (20 * 20) + 130,
	},
	buttonContainer:{
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
			height: Platform.OS !== 'android' && Platform.OS !== 'ios' 
			? screenHeight * 0.2 
			: screenHeight * 0.1,
			flex: 1, 
			alignItems: 'center', 
			justifyContent: 'center'
	},
	gestureButton:{
		width: 25, 
		height: 25, 
		backgroundColor: '#b58df1', 
		borderRadius: 20,
	}
});

export default Minitool_1;
