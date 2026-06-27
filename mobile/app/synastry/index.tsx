import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { biText } from "@/lib/i18n";
import { TIER_LIMITS } from "@vinaadi/shared";
import { listFamilyVaults, getFamilyVaultToday, type FamilyMemberDayView } from "@/api/familyVault";
import { getRelationshipSynastry, type SynastryData } from "@/api/relationships";

export default function SynastryScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;

  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberDayView | null>(null);

  const vaults = useQuery({
    queryKey: ["family-vaults"],
    queryFn: listFamilyVaults,
    enabled: TIER_LIMITS[tier].synastryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const vaultItems = vaults.data?.data.items ?? [];

  // Auto-select first vault
  React.useEffect(() => {
    if (!selectedVaultId && vaultItems.length > 0) {
      setSelectedVaultId(vaultItems[0].familyVaultId);
    }
  }, [vaultItems, selectedVaultId]);

  const members = useQuery({
    queryKey: ["family-vault-today", selectedVaultId ?? ""],
    queryFn: () => getFamilyVaultToday(selectedVaultId as string),
    enabled: !!selectedVaultId && TIER_LIMITS[tier].synastryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const memberList = members.data?.data.members ?? [];

  const synastry = useQuery({
    queryKey: ["synastry", selectedMember?.memberId ?? "", selectedVaultId ?? ""],
    queryFn: () =>
      getRelationshipSynastry(selectedMember!.memberId, selectedVaultId as string),
    enabled: !!selectedMember && !!selectedVaultId && TIER_LIMITS[tier].synastryEnabled,
    staleTime: 1000 * 60 * 10,
  });

  if (!TIER_LIMITS[tier].synastryEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.gatePanel}>
          <Text style={[styles.gateTitle, type.heading]}>
            {isTamil ? "பிரீமியம் அம்சம்" : "Premium feature"}
          </Text>
          <Text style={[styles.gateBody, type.body]}>
            {isTamil
              ? "குடும்ப உறுப்பினர்களுடன் ஜோதிட இணக்கத்தை ஆராய பிரீமியம் திட்டம் தேவை."
              : "Explore astrological compatibility with family members using full Thirukanitham synastry. Requires premium."}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/premium")}>
            <Text style={styles.primaryBtnText}>{isTamil ? "பிரீமியம் பெறுங்கள்" : "Upgrade to premium"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{isTamil ? "திரும்பு" : "Go back"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header isTamil={isTamil} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vaults.isFetching || members.isFetching || synastry.isFetching}
            onRefresh={() => { vaults.refetch(); members.refetch(); synastry.refetch(); }}
            tintColor={C.gold}
          />
        }
      >
        {/* Vault selector */}
        {vaults.isLoading ? (
          <SkeletonCard height={48} />
        ) : vaults.isError ? (
          <ErrorCard message={isTamil ? "குடும்ப வால்ட் ஏற்றல் தோல்வி." : "Could not load family vaults."} onRetry={vaults.refetch} />
        ) : vaultItems.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={[styles.emptyTitle, type.heading]}>
              {isTamil ? "குடும்ப வால்ட் இல்லை" : "No family vault found"}
            </Text>
            <Text style={[styles.emptyBody, type.body]}>
              {isTamil
                ? "முதலில் குடும்ப வால்ட் உருவாக்கவும்."
                : "Create a family vault first to compare charts."}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/family-vault")}>
              <Text style={styles.primaryBtnText}>{isTamil ? "குடும்ப வால்ட் திற" : "Open Family Vault"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {vaultItems.length > 1 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, type.caption]}>
                  {isTamil ? "குடும்ப வால்ட்" : "Family vault"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {vaultItems.map((v) => (
                    <TouchableOpacity
                      key={v.familyVaultId}
                      style={[styles.chip, selectedVaultId === v.familyVaultId && styles.chipActive]}
                      onPress={() => { setSelectedVaultId(v.familyVaultId); setSelectedMember(null); }}
                    >
                      <Text style={[styles.chipText, selectedVaultId === v.familyVaultId && styles.chipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Member picker */}
            {members.isLoading ? (
              <SkeletonCard height={80} />
            ) : members.isError ? (
              <ErrorCard message={isTamil ? "உறுப்பினர்கள் ஏற்றல் தோல்வி." : "Could not load members."} onRetry={members.refetch} />
            ) : memberList.length === 0 ? (
              <View style={styles.emptyPanel}>
                <Text style={[styles.emptyBody, type.body]}>
                  {isTamil ? "இந்த வால்ட்டில் உறுப்பினர்கள் இல்லை." : "No members in this vault yet."}
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, type.caption]}>
                  {isTamil ? "உறுப்பினரை தேர்வு செய்யுங்கள்" : "Select a member"}
                </Text>
                <View style={styles.memberGrid}>
                  {memberList.map((m) => (
                    <TouchableOpacity
                      key={m.memberId}
                      style={[styles.memberCard, selectedMember?.memberId === m.memberId && styles.memberCardActive]}
                      onPress={() => setSelectedMember(m)}
                    >
                      <View style={[styles.memberInitial, selectedMember?.memberId === m.memberId && styles.memberInitialActive]}>
                        <Text style={styles.memberInitialText}>{m.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.memberName, selectedMember?.memberId === m.memberId && styles.memberNameActive]} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={styles.memberRel} numberOfLines={1}>{m.relationship}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Synastry results */}
            {selectedMember && (
              synastry.isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={C.gold} />
                  <Text style={[styles.loadingText, type.body]}>
                    {isTamil ? "இணக்கம் கணக்கிடுகிறது…" : "Calculating compatibility…"}
                  </Text>
                </View>
              ) : synastry.isError ? (
                <ErrorCard message={isTamil ? "இணக்க தரவு ஏற்றல் தோல்வி." : "Could not load synastry."} onRetry={synastry.refetch} />
              ) : synastry.data ? (
                <SynastryResultPanel data={synastry.data.data} isTamil={isTamil} C={C} styles={styles} type={type} />
              ) : null
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon} accessibilityRole="button">
        <Text style={styles.backArrow}>{"←"}</Text>
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>{isTamil ? "இணக்க ஆய்வு" : "Synastry"}</Text>
        <Text style={styles.headerSub}>{isTamil ? "ஜோதிட இணக்க ஒப்பீடு" : "Astrological compatibility"}</Text>
      </View>
    </View>
  );
}

function SynastryResultPanel({
  data,
  isTamil,
  C,
  styles,
  type,
}: {
  data: SynastryData;
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
  type: typeof TamilType | typeof EnType;
}) {
  return (
    <View style={{ gap: S.md }}>
      {/* Score hero */}
      <View style={styles.scoreHero}>
        <View style={[styles.scoreOrb, { backgroundColor: scoreColor(data.score, C) }]}>
          <Text style={styles.scoreOrbText}>{Math.round(data.score)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scoreLabel, type.heading]}>{data.label}</Text>
          <Text numberOfLines={3} style={[styles.narrative, type.body]}>
            {biText(data.summary, isTamil)}
          </Text>
        </View>
      </View>

      {/* Harmony notes */}
      {data.harmonyNotes.length > 0 && (
        <View style={styles.notesCard}>
          <Text style={[styles.notesTitle, type.subheading]}>
            {isTamil ? "இணக்க அம்சங்கள்" : "Harmony"}
          </Text>
          {data.harmonyNotes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={styles.noteBullet}>{"✦"}</Text>
              <Text style={[styles.noteText, type.body]}>{biText(n, isTamil)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tension notes */}
      {data.tensionNotes.length > 0 && (
        <View style={[styles.notesCard, styles.tensionCard]}>
          <Text style={[styles.notesTitle, type.subheading]}>
            {isTamil ? "சவால் அம்சங்கள்" : "Challenges"}
          </Text>
          {data.tensionNotes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={[styles.noteBullet, { color: C.alert }]}>{"▲"}</Text>
              <Text style={[styles.noteText, type.body]}>{biText(n, isTamil)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Key aspects */}
      {data.keyAspects.length > 0 && (
        <View style={styles.notesCard}>
          <Text style={[styles.notesTitle, type.subheading]}>
            {isTamil ? "முக்கிய கோண அமைப்புகள்" : "Key aspects"}
          </Text>
          {data.keyAspects.map((a, i) => (
            <View key={i} style={styles.aspectRow}>
              <View style={styles.aspectPairChip}>
                <Text style={styles.aspectPairText}>{a.pair}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aspectType, type.caption]}>{a.aspect} · {a.tone}</Text>
                <Text style={[styles.noteText, type.body]}>{biText(a.note, isTamil)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Timing indicators */}
      {data.timingIndicators.length > 0 && (
        <View style={styles.notesCard}>
          <Text style={[styles.notesTitle, type.subheading]}>
            {isTamil ? "நேர அறிகுறிகள்" : "Timing indicators"}
          </Text>
          {data.timingIndicators.map((t, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={[styles.aspectPlanet, type.caption]}>{t.planet}</Text>
              <Text style={[styles.noteText, type.body]}>{biText(t.description, isTamil)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function scoreColor(score: number, C: ColorTokens): string {
  if (score >= 70) return C.green;
  if (score >= 45) return C.gold;
  return C.alert;
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: S.sm,
      paddingHorizontal: S.lg,
      paddingVertical: S.md,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    backIcon: { padding: S.xs },
    backArrow: { fontSize: 20, color: C.textSecond },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
    headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 1 },
    content: { padding: S.lg, gap: S.md, paddingBottom: S.xl },
    gatePanel: { flex: 1, padding: S.lg, justifyContent: "center", gap: S.md },
    gateTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary },
    gateBody: { fontSize: 15, color: C.textSecond, lineHeight: 22 },
    primaryBtn: {
      backgroundColor: C.gold,
      borderRadius: RADIUS.chip,
      paddingVertical: S.sm,
      alignItems: "center",
      marginTop: S.xs,
    },
    primaryBtnText: { color: C.parchment, fontWeight: "700", fontSize: 15 },
    backBtn: { alignItems: "center", marginTop: S.xs },
    backBtnText: { color: C.textTertiary, fontSize: 14 },
    emptyPanel: { gap: S.sm, paddingVertical: S.md },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
    emptyBody: { fontSize: 14, color: C.textSecond, lineHeight: 21 },
    section: { gap: S.xs },
    sectionLabel: { fontSize: 11, fontWeight: "600", color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
    chipRow: { gap: S.xs, paddingVertical: S.xs },
    chip: {
      paddingHorizontal: S.sm,
      paddingVertical: 5,
      borderRadius: RADIUS.chip,
      backgroundColor: C.parchment,
      borderWidth: 1,
      borderColor: C.divider,
    },
    chipActive: { backgroundColor: C.gold, borderColor: C.gold },
    chipText: { fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.parchment, fontWeight: "600" },
    memberGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    memberCard: {
      width: "30%",
      alignItems: "center",
      gap: 4,
      padding: S.sm,
      borderRadius: RADIUS.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.divider,
    },
    memberCardActive: { borderColor: C.gold, backgroundColor: C.surfaceAlt ?? C.surface },
    memberInitial: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    memberInitialActive: { backgroundColor: C.gold },
    memberInitialText: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
    memberName: { fontSize: 12, fontWeight: "600", color: C.textPrimary, textAlign: "center" },
    memberNameActive: { color: C.gold },
    memberRel: { fontSize: 10, color: C.textTertiary, textAlign: "center" },
    loadingRow: { flexDirection: "row", alignItems: "center", gap: S.sm, paddingVertical: S.sm },
    loadingText: { fontSize: 14, color: C.textSecond },
    scoreHero: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: S.md,
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      padding: S.md,
      borderWidth: 1,
      borderColor: C.divider,
    },
    scoreOrb: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    scoreOrbText: { fontSize: 18, fontWeight: "800", color: "#fff" },
    scoreLabel: { fontSize: 15, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
    narrative: { fontSize: 13, color: C.textSecond, lineHeight: 20 },
    notesCard: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      padding: S.md,
      gap: S.xs,
      borderWidth: 1,
      borderColor: C.divider,
    },
    tensionCard: { borderLeftWidth: 3, borderLeftColor: C.alert },
    notesTitle: { fontSize: 13, fontWeight: "700", color: C.textPrimary, marginBottom: S.xs },
    noteRow: { flexDirection: "row", gap: S.xs, alignItems: "flex-start" },
    noteBullet: { fontSize: 12, color: C.gold, marginTop: 2, width: 14 },
    noteText: { fontSize: 13, color: C.textPrimary, lineHeight: 20, flex: 1 },
    aspectRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start", marginBottom: S.xs },
    aspectPairChip: {
      backgroundColor: C.divider,
      borderRadius: RADIUS.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      alignSelf: "flex-start",
    },
    aspectPairText: { fontSize: 11, fontWeight: "700", color: C.textPrimary },
    aspectType: { fontSize: 11, color: C.gold, fontWeight: "600", marginBottom: 2 },
    aspectPlanet: { fontSize: 12, fontWeight: "700", color: C.gold, minWidth: 60, marginTop: 2 },
  });
}
