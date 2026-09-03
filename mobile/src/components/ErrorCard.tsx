import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { EnType, TamilType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  onRetry?: () => void;
  message?: string;
}

export function ErrorCard({ onRetry, message }: Props) {
  const { t, strings } = useI18n();

  return (
    <View style={styles.card}>
      <AlertTriangle size={24} color={C.caution} strokeWidth={1.5} />
      <Text style={styles.heading}>{message ?? t(strings.common.error)}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.retry}>{t(strings.common.retry)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.amber,
    padding: S.base,
    alignItems: "center",
    gap: S.sm,
  },
  heading: {
    ...TamilType.body,
    color: C.textPrimary,
    textAlign: "center",
  },
  retry: {
    ...EnType.bodySmall,
    color: C.saffron,
    fontFamily: "Inter_600SemiBold",
  },
});
