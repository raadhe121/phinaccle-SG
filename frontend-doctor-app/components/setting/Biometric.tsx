import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Switch } from '@ant-design/react-native';

const Biometric: React.FC = () => {
  return (
    <View style={styles.biometricContainer}>
      <View style={{ flexDirection: "row", }}>
        <Text style={styles.biometricText}>(Upcoming) Biometric Login</Text>
      </View>
      <Switch disabled={true} />
    </View>

  );
};

const styles = StyleSheet.create({
  biometricContainer: {
    height: 70,
    width: "90%",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  biometricText: {
    fontSize: 17,
  },
})

export default Biometric;
