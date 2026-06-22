import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { C } from "@/theme/colors";
import { useI18n } from "@/hooks/useI18n";
import { TodayIcon } from "@/components/icons/TodayIcon";
import { PanchangamIcon } from "@/components/icons/PanchangamIcon";
import { InsightsIcon } from "@/components/icons/InsightsIcon";
import { ToolsIcon } from "@/components/icons/ToolsIcon";
import { MeIcon } from "@/components/icons/MeIcon";

function TabLabel({ text, focused }: { text: string; focused: boolean }) {
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
  const { t, strings, lang } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
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
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color, size }) => <InsightsIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={lang === "ta" ? "பார்வை" : "Insights"} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
      />      <Tabs.Screen
        name="tools"
        options={{
          tabBarIcon: ({ color, size }) => <ToolsIcon color={color} size={size} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.tools)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
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
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: C.surface,
    borderTopColor: C.divider,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 4,
  },
  label: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 10,
    lineHeight: 14,
  },
});
