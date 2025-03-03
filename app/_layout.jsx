import { StyleSheet, Text, View } from 'react-native'
import { SplashScreen, Slot, Stack } from 'expo-router';
import "../global.css";
import { useEffect } from 'react';

const RootLayout = () => {
	
	useEffect(() => {
		SplashScreen.hideAsync();
	})
	
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown:
				false }}/>
			 <Stack.Screen name="(Minitool_one)" options={{headerShown:
				false }}/>	
		</Stack>
	)
}

export default RootLayout