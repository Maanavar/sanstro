import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  color: string;
  size: number;
}

export function TodayIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2.5V5M12 19v2.5M4.93 4.93 6.7 6.7M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
