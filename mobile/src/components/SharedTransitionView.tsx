import React from "react";
import Animated from "react-native-reanimated";

type SharedTransitionViewProps = React.ComponentProps<typeof Animated.View> & {
  sharedTransitionTag?: string;
};

export const SharedTransitionView =
  Animated.View as unknown as React.ComponentType<SharedTransitionViewProps>;
