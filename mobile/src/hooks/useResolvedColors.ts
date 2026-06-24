import { useColorScheme } from "react-native";
import { getColors } from "@/theme/colors";

export function useResolvedColors() {
  const scheme = useColorScheme() ?? "light";
  return getColors(scheme);
}