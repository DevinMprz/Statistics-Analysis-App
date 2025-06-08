import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import SpeedTrapMinitool from './_layout';
//import { dataBefore, dataAfter } from './_data';


export default function minitool_2() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <SpeedTrapMinitool data={dataBefore} />
        <SpeedTrapMinitool data={dataAfter} />
      </ScrollView>
    </SafeAreaView>
  );
}