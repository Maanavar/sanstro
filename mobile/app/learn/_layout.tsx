import { Stack } from "expo-router";
import { C } from "@/theme/colors";

export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.parchment },
        animation: "slide_from_right",
      }}
    />
  );
}
