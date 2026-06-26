import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { C } from "@/theme/colors";

const VIEWBOX = 320;
const CELL = VIEWBOX / 4;

const RASI_CELLS: Array<{ rasi: number; row: number; col: number }> = [
  { rasi: 1, row: 0, col: 1 },
  { rasi: 2, row: 0, col: 2 },
  { rasi: 3, row: 0, col: 3 },
  { rasi: 4, row: 1, col: 3 },
  { rasi: 5, row: 2, col: 3 },
  { rasi: 6, row: 3, col: 3 },
  { rasi: 7, row: 3, col: 2 },
  { rasi: 8, row: 3, col: 1 },
  { rasi: 9, row: 3, col: 0 },
  { rasi: 10, row: 2, col: 0 },
  { rasi: 11, row: 1, col: 0 },
  { rasi: 12, row: 0, col: 0 },
];

const RASI_SHORT_TA = ["", "மே", "ரி", "மி", "க", "சி", "க", "து", "வி", "த", "ம", "கு", "மீ"];

export interface JadhagamHouseData {
  rasi: number;
  planets: string[];
  isLagna: boolean;
}

interface Props {
  houses: JadhagamHouseData[];
  size?: number;
}

function chunkPlanets(planets: string[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < planets.length; i += 3) {
    lines.push(planets.slice(i, i + 3).join(" "));
  }
  return lines.slice(0, 3);
}

export function JadhagamChart({ houses, size = 280 }: Props) {
  const houseMap = new Map(houses.map((h) => [h.rasi, h]));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Rect x={0} y={0} width={VIEWBOX} height={VIEWBOX} fill={C.parchment} rx={4} />

        {RASI_CELLS.map(({ rasi, row, col }) => {
          const x = col * CELL;
          const y = row * CELL;
          const house = houseMap.get(rasi) ?? { rasi, planets: [], isLagna: false };
          const planetLines = chunkPlanets(house.planets);
          const firstPlanetY = house.isLagna ? y + 40 : y + 36;

          return (
            <React.Fragment key={rasi}>
              <Rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={house.isLagna ? C.cautionLight : C.surface}
                stroke={C.divider}
                strokeWidth={0.6}
              />
              <SvgText
                x={x + 7}
                y={y + 15}
                fill={C.textTertiary}
                fontFamily="NotoSansTamil_400Regular"
                fontSize={10}
              >
                {RASI_SHORT_TA[rasi]}
              </SvgText>
              {house.isLagna && (
                <SvgText
                  x={x + CELL - 7}
                  y={y + 15}
                  fill={C.saffron}
                  fontFamily="NotoSansTamil_700Bold"
                  fontSize={10}
                  textAnchor="end"
                >
                  லக்
                </SvgText>
              )}
              {planetLines.map((line, index) => (
                <SvgText
                  key={`${rasi}-${index}`}
                  x={x + CELL / 2}
                  y={firstPlanetY + index * 14}
                  fill={C.textPrimary}
                  fontFamily="NotoSansTamil_700Bold"
                  fontSize={11}
                  textAnchor="middle"
                >
                  {line}
                </SvgText>
              ))}
              {house.planets.length > 9 && (
                <SvgText
                  x={x + CELL / 2}
                  y={y + CELL - 7}
                  fill={C.textTertiary}
                  fontFamily="Inter_600SemiBold"
                  fontSize={9}
                  textAnchor="middle"
                >
                  +{house.planets.length - 9}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        <Rect
          x={CELL}
          y={CELL}
          width={CELL * 2}
          height={CELL * 2}
          fill={C.parchment}
          stroke={C.divider}
          strokeWidth={0.6}
        />
        <SvgText
          x={VIEWBOX / 2}
          y={VIEWBOX / 2 - 3}
          fill={C.textTertiary}
          fontFamily="NotoSansTamil_400Regular"
          fontSize={11}
          textAnchor="middle"
        >
          திருக்கணிதம்
        </SvgText>
        <SvgText
          x={VIEWBOX / 2}
          y={VIEWBOX / 2 + 15}
          fill={C.gold}
          fontFamily="Inter_600SemiBold"
          fontSize={9}
          textAnchor="middle"
        >
          Vinaadi AI
        </SvgText>
        <Rect
          x={0.75}
          y={0.75}
          width={VIEWBOX - 1.5}
          height={VIEWBOX - 1.5}
          fill="none"
          stroke={C.gold}
          strokeWidth={1.5}
          rx={4}
        />
      </Svg>
    </View>
  );
}
