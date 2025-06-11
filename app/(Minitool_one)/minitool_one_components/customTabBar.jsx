import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const CustomTabBar = ({ customTabs, platform }) => {

  return (
    <View style={{
      backgroundColor: '#e5e7eb',
      paddingBottom: 0,
      paddingTop: platform === 'web' ? 10 : 0,
    }}
    >
      <View style={styles.tabBar}>
         {customTabs.map((tab, index) => (
          <View key={index}>
            {tab}
          </View>
        ))}   
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 10,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#80c1ff',
    borderRadius: 12,
    padding: 4,
  },
});

export default CustomTabBar
