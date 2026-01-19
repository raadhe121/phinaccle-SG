import React, { ReactNode, useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export function VideoAnimatedScreen({ fullScreen, miniScreen, controls }: { fullScreen: ReactNode, miniScreen?: ReactNode, controls: ReactNode }) {
  const { width, height } = Dimensions.get('screen');
  const insets = useSafeAreaInsets()

  // Boundary values for the overlay screen
  const TOPBOUNDARY = 10
  const BOTTOMBOUNDARY = height - 380 + insets.bottom
  const LEFTBOUNDARY = 10
  const RIGHTBOUNDARY = width - 130

  // Set initial position of overlay here
  const initialPosition = { x: RIGHTBOUNDARY, y: BOTTOMBOUNDARY };
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;

  // const panResponder = useRef(
  //   PanResponder.create({
  //     onMoveShouldSetPanResponder: () => true,
  //     onPanResponderGrant: () => {
  //       // First, getting the current position of overlay
  //       const currentOffset = pan.getLayout();

  //       // Set the pan and allow pan to know current position
  //       pan.setOffset({
  //         x: (currentOffset as any).left._value,
  //         y: (currentOffset as any).top._value,
  //       });

  //       // Use current position as a relative position. Current position will now act as reference origin point
  //       pan.setValue({ x: 0, y: 0 });
  //     },
  //     onPanResponderMove: (event, gestureState) => {
  //       Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(event, gestureState);
  //     },
  //     onPanResponderRelease: () => {
  //       // Declare boundary
  //       let leftX: Animated.Value = new Animated.Value(LEFTBOUNDARY);
  //       let rightX: Animated.Value = new Animated.Value(RIGHTBOUNDARY);
  //       let bottomY: Animated.Value = new Animated.Value(BOTTOMBOUNDARY);
  //       let topY: Animated.Value = new Animated.Value(TOPBOUNDARY);

  //       let newX;
  //       let newY;
  //       let horizontalBounce = true
  //       let verticalBounce = true

  //       // Check horizontal position within boundary
  //       if ((pan.x as any).__getValue() < (leftX as any).__getValue()) {
  //         newX = leftX;
  //       } else if ((pan.x as any).__getValue() > (rightX as any).__getValue()) {
  //         newX = rightX;
  //       } else {
  //         newX = pan.x
  //         horizontalBounce = false
  //       }

  //       // Check vertical position within boundary
  //       if ((pan.y as any).__getValue() < (topY as any).__getValue()) {
  //         newY = topY
  //       } else if ((pan.y as any).__getValue() > (bottomY as any).__getValue()) {
  //         newY = bottomY
  //       } else {
  //         newY = pan.y
  //         verticalBounce = false
  //       }

  //       // If the movement within boundary, dont bounce (bounce will have jumping effect sometimes)
  //       // Else, bounce back into boundary
  //       if (!horizontalBounce && !verticalBounce) {
  //         pan.flattenOffset();
  //       } else {
  //         Animated.spring(
  //           pan,
  //           { toValue: { x: (newX as any).__getValue(), y: (newY as any).__getValue() }, useNativeDriver: false },
  //         ).start();
  //         pan.flattenOffset();
  //       }

  //     },
  //   })
  // ).current;

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {fullScreen}
      </View>

      <View style={styles.controls}>
        <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
          {miniScreen && <View style={styles.overlay}>{miniScreen}</View>}
        </View>
        {controls}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%"
  },
  videoContainer: {
    backgroundColor: 'grey',
    flexGrow: 1,
  },
  buttonContainer: {
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    height: 68,
  },
  overlay: {
    width: 121,
    height: 176,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    // flex: 1,
    // position: 'absolute',
    // right: 12,
    // top: 12,
  },
  controls: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    // justifyContent: 'center',
    // alignItems: 'center',
  }
});