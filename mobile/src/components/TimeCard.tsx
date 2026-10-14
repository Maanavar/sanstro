import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Sun, AlertTriangle, Timer, Moon } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { useI18n } from "@/hooks/useI18n";

type Kind = "nalla_neram" | "rahu_kalam" | "yamagandam" | "kuligai" | "durmuhurtham";

interface Props {
  kind: Kind;
  start: string;
  end: string;
  style?: ViewStyle;
}

const KIND_CONFIG: Record<Kind, { chipColor: string; Icon: LucideIcon; bgColor: string }> = {
  nalla_neram:  { chipColor: C.green,   Icon: Sun,           bgColor: C.greenLight },
  rahu_kalam:   { chipColor: C.caution, Icon: AlertTriangle, bgColor: C.cautionLight },
  yamagandam:   { chipColor: C.caution, Icon: Timer,         bgColor: C.cautionLight },
  kuligai:      { chipColor: C.skyBlue, Icon: Moon,          bgColor: C.skyBlueLight },
  durmuhurtham: { chipColor: C.alert,   Icon: AlertTriangle, bgColor: C.alertLight },
};

export function TimeCard({ kind, start, end, style }: Props) {
  const { t, strings, lang } = useI18n();

  const cfg = KIND_CONFIG[kind];
  const label = {
    nalla_neram:  strings.today.nalla_neram,
    rahu_kalam:   strings.today.rahu_kalam,
    yamagandam:   strings.today.yamagandam,
    kuligai:      strings.today.kuligai,
    durmuhurtham: strings.today.durmuhurtham,
  }[kind];

  // The scope note belongs to the kind, not to the screen. Kuligai (R7) and
  // Durmuhurtham (R8) are the two windows whose polarity is narrower than the
  // strip they sit in: a colour change alone leaves a blue card among red ones
  // with no reason given, and colour is not a carrier of meaning anyway. Wiring
  // it here means no surface can render the window without the clause.
  const scope = {
    nalla_neram:  null,
    rahu_kalam:   null,
    yamagandam:   null,
    kuligai:      strings.today.kuligai_scope,
    durmuhurtham: strings.today.durmuhurtham_scope,
  }[kind];

  const tamilFont = lang === "ta" ? "NotoSansTamil_400Regular" : "Inter_400Regular";

  return (
    <View style={[styles.card, { backgroundColor: C.surface }, scope ? styles.cardWide : null, style]}>
      <View style={[styles.chip, { backgroundColor: cfg.chipColor }]}>
        <cfg.Icon size={14} color={C.surface} strokeWidth={2} />
      </View>
      <Text style={styles.time}>{start} – {end}</Text>
      <Text style={[styles.label, { fontFamily: tamilFont }]}>
        {t(label)}
      </Text>
      {scope && (
        <Text style={[styles.scope, { fontFamily: tamilFont }]}>
          {t(scope)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: RADIUS.card,
    padding: S.md,
    marginRight: S.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.xs,
  },
  time: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    color: C.textSecond,
  },
  // A scoped window carries a clause, so its card is wider than a bare one.
  // Fixed rather than flexed because these sit in a horizontal ScrollView,
  // where an intrinsic width would collapse.
  cardWide: {
    width: 184,
  },
  scope: {
    fontSize: 10,
    lineHeight: 14,
    color: C.textSecond,
    marginTop: 2,
  },
});
