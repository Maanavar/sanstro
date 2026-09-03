import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  color: string;
  size: number;
}

export function MeIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 20c.7-3.6 3-5.4 6.5-5.4s5.8 1.8 6.5 5.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
