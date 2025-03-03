import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'


const Minitool_1_layout = () => {
	return (
		<>
		<Stack screenOptions={{ headerShown: false}}>
			<Stack.Screen 
			name = "minitool_1"
			options={{
				headerShown: false
			}} />
		</Stack>

		<StatusBar backgroundColor= "#e5e7eb" style="auto"/>
		
		</>
	)
}

export default Minitool_1_layout