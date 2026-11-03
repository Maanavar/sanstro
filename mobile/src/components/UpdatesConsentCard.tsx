import React, { useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { OPTIONAL_PURPOSES } from "@vinaadi/shared/consentCopy";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useMyConsents } from "@/hooks/useMyConsents";

const UPDATES = OPTIONAL_PURPOSES.find((p) => p.key === "updates");

/**
 * Says plainly that alerts stay silent until the "updates and astro alerts"
 * purpose is on, and lets the user turn it on here. The mobile twin of web's
 * UpdatesConsentNotice.
 *
 * Since L2 the server sends no alert of any kind, not even the in-app inbox
 * row, without that purpose, and mobile had no switch for it: registration
 * records it as off, so a mobile-only account could never receive an alert
 * whatever its alert switches said (audit 2026-11-03, N4).
 *
 * Renders nothing while the answer is unknown or once the purpose is granted.
 */
export function UpdatesConsentCard({ style }: { style?: StyleProp<ViewStyle> } = {}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const { consents, change } = useMyConsents();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!consents || consents.updates) return null;

  async function allow() {
    setBusy(true);
    setFailed(false);
    try {
      await change({ updates: true }, lang);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, style]} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.title, T.subheading]}>
            {isTamil ? "நீங்கள் அனுமதிக்கும் வரை அறிவிப்புகள் அணைந்திருக்கும்" : "Alerts are off until you allow them"}
          </Text>
          <Text style={[styles.desc, T.caption]}>{UPDATES?.desc[lang]}</Text>
        </View>
        <Switch
          value={false}
          disabled={busy}
          onValueChange={(v) => { if (v) void allow(); }}
          accessibilityLabel={UPDATES?.title[lang]}
          trackColor={{ false: C.divider, true: C.saffron }}
          thumbColor={C.surface}
        />
      </View>
      {failed && (
        <Text style={[styles.error, T.caption]} accessibilityRole="alert">
          {isTamil ? "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்." : "Could not save. Please try again."}
        </Text>
      )}
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.goldMethodLight,
      borderRadius: RADIUS.card,
      padding: S.base,
      gap: S.sm,
    },
    row: { flexDirection: "row", alignItems: "center", gap: S.md },
    title: { color: C.textPrimary },
    desc: { color: C.textSecond },
    error: { color: C.alert },
  });
}
