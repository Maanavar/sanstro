import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useToast } from "@/context/ToastContext";
import { fetchWithAuth } from "@/api/client";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { sharePdfFile } from "@/lib/dataExport";
import { listBirthProfiles } from "@/api/charts";
import {
  createReport, getReportAllowance, listReports, reportDownloadPath,
  type KindAllowance, type Report, type ReportKind,
} from "@/api/reports";
import { TIER_LIMITS } from "@vinaadi/shared";
import type { BirthProfileResponse } from "@vinaadi/shared";

/**
 * Reports — spend an included report or a bought credit, then save the PDF.
 *
 * What this screen used to be: three sections of hardcoded ₹ prices with
 * "Coming Soon" on every button, a "Payment processing coming soon" banner,
 * and a Premium CTA advertising "5 reports/month" — which the plan has not
 * been since ARC-06 made it 1 + 1. It sold nothing and said the wrong number.
 *
 * It now does the thing the credits were always for. Buying is not here:
 * Apple and Google require their own flow for digital goods, so a credit is
 * bought through the store (`app/premium.tsx`) or on the web, and this screen
 * spends what the account has. The counts come from the server, so the screen
 * cannot disagree with the ledger about what is left.
 */

const KIND_LABEL: Record<ReportKind, { en: string; ta: string }> = {
  jadhagam: { en: "Jadhagam report", ta: "ஜாதக அறிக்கை" },
  porutham: { en: "Porutham report", ta: "பொருத்த அறிக்கை" },
};

const KINDS: ReportKind[] = ["jadhagam", "porutham"];

export default function ReportsScreen() {
  const { lang } = useI18n();
  const { showError } = useToast();
  const isTamil = lang === "ta";
  const L = useCallback((en: string, ta: string) => (isTamil ? ta : en), [isTamil]);

  const [kind, setKind] = useState<ReportKind>("jadhagam");
  const [allowance, setAllowance] = useState<KindAllowance[] | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [profiles, setProfiles] = useState<BirthProfileResponse[]>([]);
  const [chartId, setChartId] = useState<string>("");
  const [partnerChartId, setPartnerChartId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [allow, list] = await Promise.all([getReportAllowance(), listReports()]);
    setAllowance(allow.kinds);
    setReports(list);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await listBirthProfiles();
        const usable = (data ?? []).filter((p) => p.chartId);
        setProfiles(usable);
        setChartId((current) => current || usable[0]?.chartId || "");
      } catch {
        setProfiles([]);
      }
    })();
  }, []);

  useEffect(() => {
    refresh().catch(() =>
      showError(L("Could not load your reports.", "உங்கள் அறிக்கைகளை ஏற்ற முடியவில்லை.")),
    );
  }, [refresh, showError, L]);

  const current = useMemo(
    () => allowance?.find((a) => a.kind === kind) ?? null,
    [allowance, kind],
  );

  const partnerOptions = useMemo(
    () => profiles.filter((p) => p.chartId && p.chartId !== chartId),
    [profiles, chartId],
  );

  const needsPartner = kind === "porutham";
  const canSubmit =
    Boolean(chartId) && (!needsPartner || Boolean(partnerChartId)) && !busy && (current?.canCreate ?? false);

  async function make() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await createReport({
        kind,
        chartId,
        ...(needsPartner ? { partnerChartId } : {}),
        lang: isTamil ? "ta" : "en",
      });
      await refresh();
    } catch {
      showError(L("Could not make that report.", "அந்த அறிக்கையை உருவாக்க முடியவில்லை."));
    } finally {
      setBusy(false);
    }
  }

  /** The stored bytes, unchanged, handed to the share sheet. */
  async function save(report: Report) {
    if (sharingId) return;
    setSharingId(report.id);
    try {
      const response = await fetchWithAuth(reportDownloadPath(report.id));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const stem = report.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
      await sharePdfFile(`${stem || report.kind}.pdf`, bytes, report.title);
    } catch {
      showError(L("Could not save that report.", "அந்த அறிக்கையைச் சேமிக்க முடியவில்லை."));
    } finally {
      setSharingId(null);
    }
  }

  function allowanceLine(a: KindAllowance): string {
    const parts: string[] = [];
    if (a.includedMonthly > 0) {
      parts.push(
        L(
          `${a.includedRemaining} of ${a.includedMonthly} included this month`,
          `இந்த மாதம் ${a.includedMonthly}-ல் ${a.includedRemaining} உள்ளடங்கியது`,
        ),
      );
    }
    if (a.credits > 0) {
      parts.push(L(`${a.credits} credit${a.credits === 1 ? "" : "s"}`, `${a.credits} வரவு`));
    }
    if (parts.length === 0) return L("Nothing left to spend", "செலவழிக்க எதுவும் இல்லை");
    return parts.join(" · ");
  }

  const premium = TIER_LIMITS.premium;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backText, isTamil ? TamilType.caption : EnType.caption]}>
            ← {L("Back", "திரும்பு")}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
          {L("Reports", "அறிக்கைகள்")}
        </Text>
        <Text style={[styles.sub, isTamil ? TamilType.caption : EnType.caption]}>
          {L(
            "A written reading, saved as a PDF. Once made, a report never changes.",
            "எழுதப்பட்ட பரிசீலனை, PDF ஆகச் சேமிக்கப்படும். ஒருமுறை உருவாக்கியபின் அறிக்கை மாறாது.",
          )}
        </Text>

        {/* ── Which kind ─────────────────────────────────────────────── */}
        <View style={styles.kindRow}>
          {KINDS.map((k) => {
            const active = k === kind;
            return (
              <TouchableOpacity
                key={k}
                onPress={() => setKind(k)}
                style={[styles.kindChip, active && styles.kindChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.kindChipText,
                    active && styles.kindChipTextActive,
                    isTamil ? TamilType.bodySmall : EnType.bodySmall,
                  ]}
                >
                  {isTamil ? KIND_LABEL[k].ta : KIND_LABEL[k].en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.allowance, isTamil ? TamilType.body : EnType.body]}>
          {current ? allowanceLine(current) : "…"}
        </Text>

        {/* ── Make one ───────────────────────────────────────────────── */}
        {profiles.length === 0 ? (
          <View style={styles.card}>
            <Text style={[styles.cardText, isTamil ? TamilType.caption : EnType.caption]}>
              {L(
                "Add a birth profile first — a report is written from a saved chart.",
                "முதலில் ஒரு பிறப்பு விவரத்தைச் சேர்க்கவும் — சேமித்த ஜாதகத்திலிருந்தே அறிக்கை எழுதப்படுகிறது.",
              )}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={[styles.fieldLabel, isTamil ? TamilType.caption : EnType.caption]}>
              {L("Chart", "ஜாதகம்")}
            </Text>
            <View style={styles.pickRow}>
              {profiles.map((p) => {
                const active = p.chartId === chartId;
                return (
                  <TouchableOpacity
                    key={p.chartId}
                    onPress={() => setChartId(p.chartId as string)}
                    style={[styles.pick, active && styles.pickActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.pickText, active && styles.pickTextActive]}>
                      {p.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {needsPartner && (
              <>
                <Text style={[styles.fieldLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {L("Partner's chart", "துணையின் ஜாதகம்")}
                </Text>
                <View style={styles.pickRow}>
                  {partnerOptions.map((p) => {
                    const active = p.chartId === partnerChartId;
                    return (
                      <TouchableOpacity
                        key={p.chartId}
                        onPress={() => setPartnerChartId(p.chartId as string)}
                        style={[styles.pick, active && styles.pickActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.pickText, active && styles.pickTextActive]}>
                          {p.displayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={() => void make()}
              disabled={!canSubmit}
              style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={C.surface} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {current?.includedRemaining
                    ? L("Make it — included", "உருவாக்கு — உள்ளடங்கியது")
                    : L("Make it — 1 credit", "உருவாக்கு — 1 வரவு")}
                </Text>
              )}
            </TouchableOpacity>

            {current && !current.canCreate && (
              <Text style={[styles.cardText, isTamil ? TamilType.caption : EnType.caption]}>
                {L(
                  "You have used this month's allowance. More reports are bought on the web.",
                  "இந்த மாதத்துக்கான அறிக்கைகளைப் பெற்றுவிட்டீர்கள். கூடுதல் அறிக்கைகள் இணையதளத்தில் வாங்கப்படும்.",
                )}
              </Text>
            )}
          </View>
        )}

        {/* ── What has been delivered ────────────────────────────────── */}
        <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
          {L("Your reports", "உங்கள் அறிக்கைகள்")}
        </Text>

        {reports === null ? (
          <ActivityIndicator color={C.saffron} />
        ) : reports.length === 0 ? (
          <View style={styles.card}>
            <Text style={[styles.cardText, isTamil ? TamilType.caption : EnType.caption]}>
              {L(
                "No reports yet. Make one above and it is saved here for good.",
                "இன்னும் அறிக்கைகள் இல்லை. மேலே ஒன்றை உருவாக்கினால் இங்கே நிரந்தரமாகச் சேமிக்கப்படும்.",
              )}
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <Text style={[styles.reportTitle, isTamil ? TamilType.body : EnType.body]}>
                {report.title}
              </Text>
              <Text style={[styles.reportMeta, isTamil ? TamilType.caption : EnType.caption]}>
                {new Date(report.createdAt).toLocaleDateString(isTamil ? "ta-IN" : "en-IN")}
                {" · "}
                {report.source === "included" ? L("included", "உள்ளடங்கியது") : L("credit", "வரவு")}
              </Text>
              <TouchableOpacity
                onPress={() => void save(report)}
                disabled={sharingId !== null}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={L(`Save ${report.title}`, `${report.title} சேமி`)}
                activeOpacity={0.85}
              >
                {sharingId === report.id ? (
                  <ActivityIndicator color={C.textSecond} />
                ) : (
                  <Text style={styles.secondaryBtnText}>{L("Save PDF", "PDF சேமி")}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Premium CTA — from the tier table, not prose. This said
            "5 reports/month" long after the plan became 1 + 1 (ARC-06). */}
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => router.push("/premium")}
          activeOpacity={0.85}
        >
          <Text style={[styles.premiumTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {L(
              `Premium includes ${premium.detailedReportsMonthlyIncluded} jadhagam + ${premium.poruthamReportsMonthlyIncluded} porutham report a month`,
              `பிரீமியத்தில் மாதம் ${premium.detailedReportsMonthlyIncluded} ஜாதக + ${premium.poruthamReportsMonthlyIncluded} பொருத்த அறிக்கை உள்ளடங்கும்`,
            )}
          </Text>
          <Text style={[styles.premiumSub, isTamil ? TamilType.caption : EnType.caption]}>
            {L("See Premium →", "பிரீமியம் பார்க்க →")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingHorizontal: S.base, paddingTop: S.base, paddingBottom: S.xxl },
  backRow: { marginBottom: S.base },
  backText: { color: C.textSecond },
  heading: { color: C.textPrimary, marginBottom: S.sm },
  sub: { color: C.textTertiary, marginBottom: S.base },

  kindRow: { flexDirection: "row", gap: S.sm, marginBottom: S.md },
  kindChip: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surface,
    paddingHorizontal: S.sm,
  },
  kindChipActive: { borderColor: C.gold, backgroundColor: C.cautionLight },
  kindChipText: { color: C.textSecond },
  kindChipTextActive: { color: C.textPrimary },

  allowance: { color: C.textPrimary, marginBottom: S.md },

  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    marginBottom: S.base,
    borderWidth: 1,
    borderColor: C.divider,
    gap: S.sm,
  },
  cardText: { color: C.textSecond },
  fieldLabel: { color: C.textTertiary },

  pickRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  pick: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: RADIUS.chip,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: S.md,
  },
  pickActive: { borderColor: C.gold, backgroundColor: C.cautionLight },
  pickText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecond },
  pickTextActive: { color: C.textPrimary },

  primaryBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { backgroundColor: C.divider },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.surface },

  sectionTitle: { color: C.textPrimary, marginTop: S.md, marginBottom: S.md },

  reportCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.divider,
    gap: S.xs,
  },
  reportTitle: { color: C.textPrimary },
  reportMeta: { color: C.textTertiary, marginBottom: S.xs },
  secondaryBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.divider,
  },
  secondaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textSecond },

  premiumBanner: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    marginTop: S.md,
    borderWidth: 1,
    borderColor: C.gold,
    gap: S.xs,
  },
  premiumTitle: { color: C.textPrimary },
  premiumSub: { color: C.saffron },
});
