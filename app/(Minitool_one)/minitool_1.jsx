import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BarChart } from 'react-native-gifted-charts';
import { RadioButton } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';


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



const Minitool_1 = () => {
	const screenHeight = Dimensions.get('window').height;
	const screenWidth = Dimensions.get('window').width;

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

	const translateX = useSharedValue(0);
	const gesture = Gesture.Pan().onUpdate((event) => {
		console.log(event.translationX);
	})

	const rStyle = useAnimatedStyle(() => {
		return{
			transform[{ translateX: translateX.value}],
		};
	})


	return (
		<ScrollView style={{ display: "flex", flexGrow: 1, backgroundColor: "#e5e7eb" }}>
      		
        		
				<Text style={{ 
					fontSize: 30, 
					fontWeight: 'bold', 
					textAlign: 'center', 
					marginBottom: 0, 
					paddingTop: 35,
					color: "#38BDF8BF",
					}}>
         		 Life Span of Batteries
        		</Text>
        		
				<View style={{  
					height: screenHeight * 0.75,
					width: screenWidth,
					padding: 0,
					display: "flex",
					flexGrow: 1,
					flexDirection: "row",
					justifyContent: "flex-start",
					alignItems: "flex-start",
					flexGrow: 1,
					marginLeft: 0,
					marginBottom: 10,
					}}>
          		
					<BarChart 
						data={data.map(item => ({
						...item,
						frontColor: item.label === 'Always Ready' ? '#ffff00' : '#0099ff'
					}))}
					height={(screenHeight * 0.75) * 0.8}
					width={screenWidth * 0.7}
					horizontal
					barWidth={10}
					spacing={10}
					noOfSections={Platform.OS !== 'android' ? 12: 5}
					
					barBorderRadius={5}
					barBorderColor={"#666699"}
					barBorderWidth={0.5}
					
					topLabe	

					yAxisThickness={1}
					xAxisThickness={1}
					xAxisColor={"#666699"}
					yAxisColor={"#666699"}
					hideRules
				/>
				</View>

				<View style={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: 1
					}}>
					<GestureHandlerRootView>
					<GestureDetector gesture={gesture}>
						<Animated.View style ={{ height: 25, backgroundColor: "blue", aspectRatio: 1, opacity: 0.8 }} />
					</GestureDetector>	
					<View style ={{ height: 25, backgroundColor: "blue", aspectRatio: 1, opacity: 0.8 }}/>
					<View style ={{ height: 25, backgroundColor: "blue", aspectRatio: 1, opacity: 0.8 }}/>
					</GestureHandlerRootView>
				</View>
				
				<View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly"}}>
						<View style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>		
							<RadioButton
								value='normal'
								status={checked === 'normal' ? 'checked' : 'unchecked' }
								onPress={resetData}
								uncheckedColor='#38BDF8BF'
								color='#ff0066'
							/>
							<Text style={{ fontSize: 18}}>
								Normal Data
								</Text>
						</View>
						<View style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
							<RadioButton 
								value='label'
								status={checked === 'label' ? 'checked' : 'unchecked' }
								onPress={sortByLabel}
								uncheckedColor='#38BDF8BF'
								color='#ff0066'
							/>

							<Text style={{ 
								fontSize: 18

							}}
							>Sort by Label</Text>
							
						</View>
						<View style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>	
							<RadioButton
								value='value'
								status={checked === 'value' ? 'checked' : 'unchecked' }
								onPress={sortByValue}
								uncheckedColor='#38BDF8BF'
								color='#ff0066'
							/>
							<Text style={{ fontSize: 18}}>
								Sort by Value
								</Text>
						</View>
					</View>
      		
    	</ScrollView>
	)
}
export default Minitool_1;