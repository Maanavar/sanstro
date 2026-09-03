import { useColorScheme } from "react-native";
import { getColors } from "@/theme/colors";

export function useColors() {
  const scheme = useColorScheme() ?? "light";
  return getColors(scheme);
}