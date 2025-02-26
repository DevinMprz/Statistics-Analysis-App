import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Platform } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import CustomButton from '../../components/customButton';


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
	const [chartWidth, setChartWidth] = useState(0);
	
	
	const [data, setData] = useState(initialData);
 
	//Sorted by Label
	const sortByLabel = () => {
	  const sortedData = [...data].sort((a, b) => a.label.localeCompare(b.label));
	  setData(sortedData); 
	};

	//Sorted by Values
	const sortByValue = () => {
		const sortedData = [...data].sort((a,b) => a.value - b.value);
		setData(sortedData);
	}

	const [originalData] = useState(initialData);
	//Back to unsorted data
	const resetData = () => {
		setData(originalData); 
	};

	return (
		<ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      		<View style={{ padding: 10 }}>
        		
				<Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
         		 Life Span of Batteries
        		</Text>
        		
				<View style={{ height: data.length * 30, backgroundColor: 'grey', justifyContent: 'start',
						alignItems: 'start', padding: 10,
					}}
					onLayout={(event) => {
            		const { width } = event.nativeEvent.layout;
            		setChartWidth(width); 
          			}}
				>
          		
				<BarChart
            	data={data.map(item => ({
					...item,
					frontColor: item.label === 'Always Ready' ? 'yellow' : 'blue'
			  	}))}
				horizontal
				barWidth={10}
				spacing={10}
				noOfSections={Platform.OS !== 'android' ? 12: 5}
				barBorderRadius={5}
				yAxisThickness={0}
				xAxisThickness={1}
				hideRules
				labelWidth={100000000} //need to change
				width={chartWidth - 80}
				/>
				</View>

				<CustomButton 
					title='Sort by Company'
					hadlePress={sortByLabel}
					containerStyles = "bg-[#00cc00] w-full mt-7"
				/>
			
				<CustomButton 
					title='Sort by Value'
					hadlePress={sortByValue}
					containerStyles = "bg-[#00cc00] w-full mt-7"
				/>

				<CustomButton 
					title='Back'
					hadlePress={resetData}
					containerStyles = "bg-[#00cc00] w-full mt-7"
				/>

      		</View>
    	</ScrollView>
	)
}
export default Minitool_1;