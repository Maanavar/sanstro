import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LIFE_FOCUS_TEXT, LIFE_MODE_ORDER, LIFE_MODE_TEXT } from "@vinaadi/shared/lifeFocus";

import type { LifeMode } from "@/api/lifeMode";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useLifeFocus } from "@/hooks/useLifeFocus";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { EnType, TamilType } from "@/theme/typography";

/**
 * Life focus on mobile (docs/LIFE_FOCUS_PLAN_2026-09-22.md, Phase 3): the Today
 * chip and the Me card, both opening one picker. Labels come from
 * `LIFE_MODE_TEXT` in @vinaadi/shared, the same words web shows.
 *
 * No first-run modal and no 60-day strip here: the plan gives mobile the two
 * entry points only. Blocked focuses (age, marital status) are not offered.
 */

export function FocusPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang, t } = useI18n();
  const T = lang === "ta" ? TamilType : EnType;
  const { mode, blockedModes, setMode } = useLifeFocus();
  const [saving, setSaving] = useState<LifeMode | null>(null);
  const [failed, setFailed] = useState(false);

  const options = LIFE_MODE_ORDER.filter((m) => !blockedModes.includes(m));

  async function choose(next: LifeMode) {
    Haptics.selectionAsync();
    setSaving(next);
    setFailed(false);
    try {
      await setMode(next);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t(LIFE_FOCUS_TEXT.close)} />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, T.caption]}>{t(LIFE_FOCUS_TEXT.eyebrow)}</Text>
            <Text style={[styles.title, T.subheading]} accessibilityRole="header">{t(LIFE_FOCUS_TEXT.question)}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t(LIFE_FOCUS_TEXT.close)}
          >
            <Ionicons name="close" size={22} color={C.textTertiary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {options.map((option) => {
            const text = LIFE_MODE_TEXT[option];
            const current = option === mode;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, current && styles.optionCurrent, saving !== null && saving !== option && styles.optionDimmed]}
                onPress={() => void choose(option)}
                disabled={saving !== null}
                accessibilityRole="radio"
                accessibilityState={{ selected: current, busy: saving === option }}
                accessibilityLabel={`${t(text.label)}. ${t(text.desc)}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, T.body]}>{t(text.label)}</Text>
                  <Text style={[styles.optionDesc, T.caption]}>{t(text.desc)}</Text>
                </View>
                {current && <Ionicons name="checkmark-circle" size={20} color={C.saffron} />}
              </TouchableOpacity>
            );
          })}
          {failed && (
            <Text style={[styles.error, T.caption]} accessibilityLiveRegion="polite">{t(LIFE_FOCUS_TEXT.saveFailed)}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** Today header chip: "Focus Career". Registered readers only. */
export function FocusChip() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { signedIn, status, mode } = useLifeFocus();
  const [open, setOpen] = useState(false);
  if (!signedIn || !status) return null;

  const visible = `${t(LIFE_FOCUS_TEXT.chipPrefix)} ${t(LIFE_MODE_TEXT[mode].label)}`;
  return (
    <>
      <TouchableOpacity
        style={styles.chip}
        onPress={() => { Haptics.selectionAsync(); setOpen(true); }}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        accessibilityRole="button"
        // The visible text leads the name whole (WCAG 2.5.3, as on web).
        accessibilityLabel={t(LIFE_FOCUS_TEXT.chipAria).replace("%s", visible)}
      >
        <Text style={styles.chipPrefix}>{t(LIFE_FOCUS_TEXT.chipPrefix)}</Text>
        <Text style={styles.chipLabel} numberOfLines={1}>{t(LIFE_MODE_TEXT[mode].label)}</Text>
      </TouchableOpacity>
      <FocusPicker visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Me screen "Your focus" row: the current focus and what it changes. */
export function FocusSettingsRow() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang, t } = useI18n();
  const T = lang === "ta" ? TamilType : EnType;
  const { signedIn, mode } = useLifeFocus();
  const [open, setOpen] = useState(false);
  if (!signedIn) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t(LIFE_FOCUS_TEXT.eyebrow)}: ${t(LIFE_MODE_TEXT[mode].label)}`}
      >
        <Ionicons name="compass-outline" size={20} color={C.gold} style={{ width: 28, textAlign: "center" }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { fontFamily: T.body.fontFamily }]}>
            {t(LIFE_FOCUS_TEXT.eyebrow)}: {t(LIFE_MODE_TEXT[mode].label)}
          </Text>
          <Text style={[styles.rowDesc, { fontFamily: T.caption.fontFamily }]}>{t(LIFE_FOCUS_TEXT.settingsDesc)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
      </TouchableOpacity>
      <FocusPicker visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    // `darkBg` is dark in both themes; no scrim token exists, and a literal
    // would trip the colour ratchet.
    backdrop: { flex: 1, backgroundColor: C.darkBg, opacity: 0.55 },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: RADIUS.bottomSheet,
      borderTopRightRadius: RADIUS.bottomSheet,
      paddingHorizontal: S.base,
      paddingTop: S.base,
      maxHeight: "80%",
    },
    headerRow: { flexDirection: "row", alignItems: "flex-start", gap: S.md, marginBottom: S.md },
    eyebrow: { color: C.saffron, textTransform: "uppercase", letterSpacing: 0.6 },
    title: { color: C.textPrimary, marginTop: 2 },
    list: { gap: S.sm, paddingBottom: S.xl },
    option: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      minHeight: 56, paddingHorizontal: S.base, paddingVertical: S.md,
      borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.divider, backgroundColor: C.parchment,
    },
    optionCurrent: { borderColor: C.saffron, backgroundColor: C.goldMethodLight },
    optionDimmed: { opacity: 0.5 },
    optionLabel: { color: C.textPrimary },
    optionDesc: { color: C.textSecond, marginTop: 2 },
    error: { color: C.alert, marginTop: S.xs },

    chip: {
      flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 160,
      minHeight: 32, paddingHorizontal: S.md, borderRadius: RADIUS.chip,
      borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
    },
    chipPrefix: { fontSize: 11, color: C.textTertiary },
    chipLabel: { fontSize: 12, fontWeight: "600", color: C.textPrimary, flexShrink: 1 },

    row: { flexDirection: "row", alignItems: "center", paddingVertical: S.md, gap: S.md, minHeight: 52 },
    rowLabel: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    rowDesc: { fontSize: 12, lineHeight: 17, color: C.textSecond, marginTop: 2 },
  });
}
