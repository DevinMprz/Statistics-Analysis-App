import { StatusBar } from 'expo-status-bar';
import {Text, View } from 'react-native';
import "C:/Users/1/Desktop/Rp/Statistics-Analysis-App/Statistic/global.css";
import { Link } from 'expo-router';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center
    bg-white">
      <Text>do i need to delete</Text>
      <StatusBar style="auto" />
			<Link href="/profile" style={{color: 'blue'}}>Go to profile</Link>
    </View>
  );
}

