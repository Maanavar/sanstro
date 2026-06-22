import React from "react";
import { type Href, router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  leftRoute?: Href;
  rightRoute?: Href;
}

export function SwipeRouteView({ children, leftRoute, rightRoute }: Props) {
  const flingLeft = Gesture.Fling()
    .direction(1)
    .enabled(Boolean(leftRoute))
    .onEnd(() => {
      if (leftRoute) router.push(leftRoute);
    })
    .runOnJS(true);

  const flingRight = Gesture.Fling()
    .direction(2)
    .enabled(Boolean(rightRoute))
    .onEnd(() => {
      if (rightRoute) router.push(rightRoute);
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={Gesture.Exclusive(flingLeft, flingRight)}>
      <Animated.View style={{ flex: 1 }}>{children}</Animated.View>
    </GestureDetector>
  );
}
