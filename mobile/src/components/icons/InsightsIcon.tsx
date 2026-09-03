import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  color: string;
  size: number;
}

export function InsightsIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5 14.7 9l5.8.85-4.2 4.1 1 5.75L12 17l-5.3 2.7 1-5.75-4.2-4.1L9.3 9 12 3.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
    </Svg>
  );
}
