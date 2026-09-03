import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  color: string;
  size: number;
}

export function ToolsIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m14.5 6 3.5 3.5M15.5 4.5l4 4-9.8 9.8a2.2 2.2 0 0 1-1.1.6l-3.1.6.6-3.1c.08-.42.29-.8.6-1.1l8.8-8.8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4.5 6.5h5M7 4v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
