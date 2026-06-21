import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet, View } from "react-native";
import { C } from "@/theme/colors";
import { useI18n } from "@/hooks/useI18n";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

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
  const { t, strings } = useI18n();

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
          tabBarIcon: ({ focused }) => <TabIcon label="🌅" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.today)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="panchangam"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.panchangam)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="🔧" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel text={t(strings.tabs.tools)} focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
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
