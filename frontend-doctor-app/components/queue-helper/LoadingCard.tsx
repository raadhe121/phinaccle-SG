import React from 'react';
import { StyleSheet } from 'react-native';
import {  ActivityIndicator, View } from '@ant-design/react-native';

const LoadingCard: React.FC = () => {
  return (
      <View style={styles.container}>
        <ActivityIndicator size="large"/>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: "100%",
    flexDirection: "row",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 5
  },
})

export default LoadingCard;
