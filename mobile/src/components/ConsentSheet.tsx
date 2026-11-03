import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ADULT_DECLARATION,
  CHANGE_LATER,
  HELD_DATA_NOTICE,
  NO_OPTIONAL_CONSENTS,
  OPTIONAL_PURPOSES,
  SERVICE_PURPOSE,
} from "@vinaadi/shared/consentCopy";
import type { OptionalConsents } from "@vinaadi/shared/api/auth";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { ME_QUERY_KEY, useMyConsents } from "@/hooks/useMyConsents";
import { onConsentSheetRequested } from "@/lib/consentPrompt";

/**
 * The mobile consent sheet (admin spec L2), the twin of web's ConsentPanel.
 *
 * Shown when `MeResponse.consentRequired`: the account never consented (every
 * account created before L2 shipped, and Google sign-ups), consented to an
 * older notice, or has not made the 18+ declaration. Until this existed a
 * mobile account in that state could not save a birth profile or family
 * member (`CONSENT_REQUIRED`) and had no screen that could answer it (audit
 * 2026-11-03, Part 3).
 *
 * Non-blocking by the same decision as web: "Not now" hides it until the app
 * restarts, or until the server answers `CONSENT_REQUIRED` again, which reopens
 * it at the moment the answer is needed.
 *
 * New Tamil (group labels, hint), pending native review.
 */
export function ConsentSheet() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const L = (en: string, ta: string) => (isTamil ? ta : en);

  const { me, answer } = useMyConsents();
  const [dismissed, setDismissed] = useState(false);
  const [serviceAccepted, setServiceAccepted] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [optional, setOptional] = useState<OptionalConsents>(NO_OPTIONAL_CONSENTS);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // Start the optional switches at the account's current answers (all off
  // unless it granted them), as web does.
  const current = me?.consents;
  useEffect(() => {
    if (current) {
      setOptional({ updates: current.updates, analytics: current.analytics, askImprove: current.askImprove });
    }
  }, [current]);

  useEffect(
    () =>
      onConsentSheetRequested(() => {
        // The server just said consent is missing, so a cached "not required"
        // is stale: refetch, and show the sheet once the answer arrives.
        void qc.invalidateQueries({ queryKey: ME_QUERY_KEY() });
        setDismissed(false);
      }),
    [qc],
  );

  if (!me || !me.consentRequired) return null;

  const needsAdult = !me.adultDeclared;
  const ready = serviceAccepted && (!needsAdult || adultConfirmed);
  const neverConsented = !me.consents?.service;

  async function save() {
    setSaving(true);
    setFailed(false);
    try {
      await answer({ adultConfirmed: needsAdult ? adultConfirmed : undefined, consents: optional }, lang);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  function openNotice() {
    // A Modal sits above the navigator, so the notice would open underneath
    // it. Step aside; the Me tab's "Privacy choices" row brings the sheet back.
    setDismissed(true);
    router.push("/privacy" as Href);
  }

  return (
    <Modal
      visible={!dismissed}
      transparent
      animationType="slide"
      onRequestClose={() => setDismissed(true)}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, S.base) }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={[styles.title, T.heading]} accessibilityRole="header">
              {L("Your privacy choices", "உங்கள் தனியுரிமைத் தேர்வுகள்")}
            </Text>
            <TouchableOpacity
              onPress={() => setDismissed(true)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={L("Close", "மூடு")}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.lead, T.caption]}>
              {L(
                "Tell us how we may use your details. ",
                "உங்கள் விவரங்களை நாங்கள் எப்படிப் பயன்படுத்தலாம் என்று சொல்லுங்கள். ",
              )}
              <Text style={styles.link} onPress={openNotice} accessibilityRole="link">
                {L("Read the privacy notice", "தனியுரிமை அறிவிப்பைப் படிக்கவும்")}
              </Text>
            </Text>

            {/* The DPDP §5 notice, as on web. Mobile showed only the link. */}
            <Text style={[styles.lead, T.caption]}>{HELD_DATA_NOTICE[lang]}</Text>

            {neverConsented && (
              <Text style={[styles.note, T.caption]}>
                {L(
                  "We cannot save birth details until you agree to the service purpose below.",
                  "கீழே உள்ள சேவை நோக்கத்திற்கு நீங்கள் ஒப்புதல் தரும் வரை பிறப்பு விவரங்களைச் சேமிக்க இயலாது.",
                )}
              </Text>
            )}

            <Text style={styles.groupLabel}>{L("Required", "அவசியம்")}</Text>
            <View style={styles.group}>
              <CheckRow
                styles={styles}
                checked={serviceAccepted}
                onToggle={() => setServiceAccepted((v) => !v)}
                label={SERVICE_PURPOSE.title[lang]}
              >
                <Text style={[styles.rowTitle, T.body]}>{SERVICE_PURPOSE.title[lang]}</Text>
                <Text style={[styles.rowDesc, T.caption]}>{SERVICE_PURPOSE.desc[lang]}</Text>
              </CheckRow>
              {needsAdult && (
                <>
                  <View style={styles.divider} />
                  <CheckRow
                    styles={styles}
                    checked={adultConfirmed}
                    onToggle={() => setAdultConfirmed((v) => !v)}
                    label={ADULT_DECLARATION[lang]}
                  >
                    <Text style={[styles.rowTitle, T.body]}>{ADULT_DECLARATION[lang]}</Text>
                  </CheckRow>
                </>
              )}
            </View>

            <Text style={styles.groupLabel}>{L("Optional", "விருப்பத்திற்குரியவை")}</Text>
            <View style={styles.group}>
              {OPTIONAL_PURPOSES.map((purpose, index) => (
                <React.Fragment key={purpose.key}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, T.body]}>{purpose.title[lang]}</Text>
                      <Text style={[styles.rowDesc, T.caption]}>{purpose.desc[lang]}</Text>
                    </View>
                    <Switch
                      value={optional[purpose.key]}
                      onValueChange={(value) => setOptional((prev) => ({ ...prev, [purpose.key]: value }))}
                      accessibilityLabel={purpose.title[lang]}
                      trackColor={{ false: C.divider, true: C.saffron }}
                      thumbColor={C.surface}
                    />
                  </View>
                </React.Fragment>
              ))}
            </View>
            <Text style={[styles.hint, T.caption]}>{CHANGE_LATER[lang]}</Text>

            {failed && (
              <Text style={[styles.error, T.caption]} accessibilityRole="alert">
                {L("Could not save. Please try again.", "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்.")}
              </Text>
            )}
          </ScrollView>

          {!ready && (
            <Text style={[styles.hint, styles.footerHint, T.caption]}>
              {needsAdult
                ? L("Tick both required items to continue.", "தொடர, அவசியமான இரண்டையும் தேர்வு செய்யவும்.")
                : L("Tick the required item to continue.", "தொடர, அவசியமானதைத் தேர்வு செய்யவும்.")}
            </Text>
          )}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={() => setDismissed(true)}
              accessibilityRole="button"
            >
              <Text style={[styles.btnGhostText, T.body]}>{L("Not now", "இப்போது வேண்டாம்")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, (!ready || saving) && styles.btnDisabled]}
              onPress={() => void save()}
              disabled={!ready || saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready || saving }}
            >
              <Text style={[styles.btnPrimaryText, T.body]}>
                {saving ? L("Saving…", "சேமிக்கிறது…") : L("Agree and continue", "ஒப்புக்கொண்டு தொடரவும்")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type SheetStyles = ReturnType<typeof makeStyles>;

/** A checkbox row. React Native has no checkbox, so the role and state are
 *  declared for TalkBack/VoiceOver; the row is at least 44px tall. */
function CheckRow({
  styles, checked, onToggle, label, children,
}: {
  styles: SheetStyles;
  checked: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      backgroundColor: C.parchment,
      borderTopLeftRadius: RADIUS.bottomSheet,
      borderTopRightRadius: RADIUS.bottomSheet,
      maxHeight: "90%",
      paddingTop: S.base,
    },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      paddingHorizontal: S.base, paddingBottom: S.sm,
    },
    title: { flex: 1, color: C.textPrimary },
    closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -S.sm },
    closeText: { fontSize: 28, lineHeight: 30, color: C.textSecond },
    body: { paddingHorizontal: S.base, gap: S.sm, paddingBottom: S.sm },
    lead: { color: C.textSecond },
    link: { color: C.saffron, textDecorationLine: "underline" },
    note: { color: C.textPrimary, backgroundColor: C.goldMethodLight, borderRadius: RADIUS.md, padding: S.md },
    groupLabel: {
      color: C.textTertiary, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6,
      marginTop: S.sm, paddingHorizontal: S.xs,
    },
    group: { backgroundColor: C.surface, borderRadius: RADIUS.card, paddingHorizontal: S.base },
    divider: { height: 1, backgroundColor: C.divider },
    checkRow: { flexDirection: "row", alignItems: "flex-start", gap: S.md, minHeight: 44, paddingVertical: S.md },
    checkbox: {
      width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: C.textTertiary,
      alignItems: "center", justifyContent: "center", marginTop: 1,
    },
    checkboxChecked: { backgroundColor: C.saffron, borderColor: C.saffron },
    checkboxTick: { color: C.surface, fontSize: 14, lineHeight: 18 },
    switchRow: { flexDirection: "row", alignItems: "center", gap: S.md, minHeight: 52, paddingVertical: S.md },
    rowTitle: { color: C.textPrimary },
    rowDesc: { color: C.textSecond, marginTop: 2 },
    hint: { color: C.textTertiary, paddingHorizontal: S.xs },
    footerHint: { paddingHorizontal: S.base + S.xs, paddingTop: S.sm },
    error: { color: C.alert },
    footer: { flexDirection: "row", gap: S.sm, paddingHorizontal: S.base, paddingTop: S.md },
    btn: { flex: 1, minHeight: 48, borderRadius: RADIUS.button, alignItems: "center", justifyContent: "center" },
    btnGhost: { borderWidth: 1, borderColor: C.divider },
    btnGhostText: { color: C.textPrimary },
    btnPrimary: { backgroundColor: C.saffron },
    btnPrimaryText: { color: C.surface },
    btnDisabled: { opacity: 0.5 },
  });
}
