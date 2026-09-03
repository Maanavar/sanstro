import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { TodayIcon } from "@/components/icons/TodayIcon";
import { PanchangamIcon } from "@/components/icons/PanchangamIcon";
import { InsightsIcon } from "@/components/icons/InsightsIcon";
import { ToolsIcon } from "@/components/icons/ToolsIcon";
import { MeIcon } from "@/components/icons/MeIcon";

function TabLabel({ text, focused }: { text: string; focused: boolean }) {
  const C = useColors();

  return (
    <Text
      style={[
        styles.label,
        { color: focused ? C.saffron : C.textTertiary },
      ]}
    >
      {text}
    </Text>
  );
}

export default function TabLayout() {
  const C = useColors();
  const { t, strings } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.divider,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: C.saffron,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          tabBarIcon: ({ color, size }) => <TodayIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.today)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
        listeners={{ tabPress: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="panchangam"
        options={{
          tabBarIcon: ({ color, size }) => <PanchangamIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.panchangam)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
        listeners={{ tabPress: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color, size }) => <InsightsIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.insights)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
        listeners={{ tabPress: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          tabBarIcon: ({ color, size }) => <ToolsIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.tools)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
        listeners={{ tabPress: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: ({ color, size }) => <MeIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.me)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
        listeners={{ tabPress: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 10,
    lineHeight: 14,
  },
});
