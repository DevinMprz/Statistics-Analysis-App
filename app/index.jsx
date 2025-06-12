import "../global.css";
import {Text, View, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import { logo } from "../constants/icons";
import { Redirect, router } from "expo-router";
import CustomButton from '../components/customButton';

export default function App() {
  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle = {{ height: '100%'}}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Image 
            source = {logo}
            style={styles.imageContainer}
            resizeMode="contain"
          /> 

          <View className="relative mt-5">
            <Text className="text-3xl text-black font-bold text-center">
              Try your hand at working with {" "}
              <Text className="text-sky-400/75">Dates</Text>
            </Text>
          </View>

          <CustomButton
            title = "Minitool1"
            hadlePress={() => router.push('/minitool_1')}
            containerStyles = "bg-sky-400/75 w-full mt-7"     
          />
          <CustomButton
            title = "Minitool2"
            hadlePress={() => router.push('/minitool_2')}
            containerStyles = "bg-sky-400/75 w-full mt-7"
          />
          <CustomButton
            title = "Minitool3"
            hadlePress={() => router.push('minitool_3')}
            containerStyles = "bg-sky-400/75 w-full mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor= "#F8FBFC" style='black' />
    
    </SafeAreaView>
  );
}
  
const styles = StyleSheet.create({
    imageContainer: {
      height: 400,
      width: '100%',
      alignSelf: 'center',
    },
  });