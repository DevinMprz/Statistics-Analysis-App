import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'


const Minitool_1_layout = () => {
	return (
		<>
		<Stack>
			<Stack.Screen 
			name = "minitool_1"
			options={{
				headerShown: false
			}} />
		</Stack>

		<StatusBar backgroundColor= "#ffffff" style='light'/>
		
		</>
	)
}

export default Minitool_1_layout