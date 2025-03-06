import { View,Text, TouchableOpacity } from 'react-native'
import "../global.css";
import React from 'react'

const CustomButton = ({title, hadlePress, containerStyles, textStyles, isLoading}) => {
    return (
        <TouchableOpacity 
        onPress={hadlePress}
        activeOpacity={0.7}
        disabled={isLoading}
        className= {`rounded-xl min-h-[62px] justify-center items-center ${containerStyles}
        ${isLoading ? 'opacity-50' : '' }`}>
            <Text className={`text-primary font-extrabold text-lg ${textStyles}`}>
                {title}</Text>
        </TouchableOpacity>
    )
}

export default CustomButton