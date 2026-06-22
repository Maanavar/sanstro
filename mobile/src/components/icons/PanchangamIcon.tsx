import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  color: string;
  size: number;
}

export function PanchangamIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={16} height={15} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M8 3.5V7M16 3.5V7M4 10h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
