import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  rasiName: string;
  palanText: string;
  onReadMore?: () => void;
  style?: ViewStyle;
}

export function RasiPalanCard({ rasiName, palanText, onReadMore, style }: Props) {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.rasiLabel, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
        {rasiName}
      </Text>
      <Text
        style={[styles.palan, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}
        numberOfLines={4}
      >
        {palanText}
      </Text>
      {onReadMore && (
        <TouchableOpacity onPress={onReadMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.readMore}>
            {isTamil ? "மேலும் படிக்க →" : "Read full palan →"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rasiLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: C.saffron,
    marginBottom: S.sm,
  },
  palan: {
    fontSize: 15,
    lineHeight: 24,
    color: C.textPrimary,
    marginBottom: S.sm,
  },
  readMore: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.saffron,
  },
});
