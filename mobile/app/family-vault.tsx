import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { ScoreRing } from "@/components/ScoreRing";
import { listFamilyVaults, getFamilyVaultToday, createFamilyVault } from "@/api/familyVault";
import type { FamilyMemberDayView } from "@/api/familyVault";

const RELATIONSHIP_TA: Record<string, string> = {
  father: "தந்தை", mother: "அம்மா", spouse: "மனைவி / கணவர்",
  son: "மகன்", daughter: "மகள்", sibling: "உடன்பிறந்தவர்",
  self: "நான்", other: "மற்றவர்",
};

function scoreColor(score: number): string {
  if (score >= 7) return C.green;
  if (score >= 4) return C.amber;
  return C.alert;
}

function MemberCard({
  member,
  selected,
  onPress,
  isTamil,
}: {
  member: FamilyMemberDayView;
  selected: boolean;
  onPress: () => void;
  isTamil: boolean;
}) {
  const relLabel = isTamil
    ? (RELATIONSHIP_TA[member.relationship.toLowerCase()] ?? member.relationship)
    : member.relationship;

  return (
    <TouchableOpacity
      style={[styles.memberCard, selected && styles.memberCardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.memberAvatar, { backgroundColor: scoreColor(member.score) + "22" }]}>
        <Text style={[styles.memberInitial, { color: scoreColor(member.score) }]}>
          {member.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[
          styles.memberName,
          isTamil ? TamilType.caption : EnType.caption,
          { color: C.textPrimary, fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" },
        ]}
        numberOfLines={1}
      >
        {member.name}
      </Text>
      <Text style={[styles.memberRel, isTamil ? TamilType.caption : EnType.caption]}>{relLabel}</Text>
    </TouchableOpacity>
  );
}

function MemberDetail({
  member,
  isTamil,
  onAskVinaadi,
}: {
  member: FamilyMemberDayView;
  isTamil: boolean;
  onAskVinaadi: () => void;
}) {
  return (
    <View style={styles.detailCard}>
      {/* Score hero */}
      <View style={styles.detailScoreRow}>
        <ScoreRing score={member.score} size={72} />
        <View style={styles.detailScoreInfo}>
          <Text style={[styles.detailName, isTamil ? TamilType.subheading : EnType.subheading]}>
            {member.name}
          </Text>
          <Text style={[styles.detailLabel, isTamil ? TamilType.caption : EnType.caption]}>
            {member.label}
          </Text>
          {member.chandrashtama && (
            <View style={styles.chandraChip}>
              <Text style={styles.chandraChipText}>
                {isTamil ? "⚠️ சந்திராஷ்டமம்" : "⚠️ Chandrashtama"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Highlight */}
      <Text style={[styles.highlight, isTamil ? TamilType.body : EnType.body]}>
        {isTamil ? member.highlightTa : member.highlightEn}
      </Text>

      {/* Key timings */}
      <View style={styles.timingsRow}>
        <View style={[styles.timingChip, { borderColor: C.green }]}>
          <Text style={[styles.timingLabel, { color: C.green }]}>
            {isTamil ? "நல்ல நேரம்" : "Nalla Neram"}
          </Text>
          <Text style={styles.timingValue}>{member.nallaNeramStart}</Text>
        </View>
        <View style={[styles.timingChip, { borderColor: C.caution }]}>
          <Text style={[styles.timingLabel, { color: C.caution }]}>
            {isTamil ? "ராகு காலம்" : "Rahu Kalam"}
          </Text>
          <Text style={styles.timingValue}>{member.rahuKalamStart}</Text>
        </View>
      </View>

      {/* Ask Vinaadi CTA */}
      <TouchableOpacity style={styles.askBtn} onPress={onAskVinaadi} activeOpacity={0.85}>
        <Text style={[styles.askBtnText, isTamil ? TamilType.body : EnType.body]}>
          {isTamil
            ? `${member.name}-க்கு Ask Vinaadi கேளுங்கள் →`
            : `Ask Vinaadi about ${member.name} →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FamilyVaultScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { tier } = useSession();
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);

  const { data: vaultsData, isLoading: vaultsLoading, isError: vaultsError, refetch: refetchVaults } =
    useQuery({
      queryKey: ["family-vaults"],
      queryFn: listFamilyVaults,
      staleTime: 1000 * 60 * 5,
    });

  const vaults = vaultsData?.data?.items ?? [];
  const firstVault = vaults[0];

  const { data: todayData, isLoading: todayLoading, isError: todayError } = useQuery({
    queryKey: ["family-vault-today", firstVault?.familyVaultId],
    queryFn: () => getFamilyVaultToday(firstVault!.familyVaultId),
    enabled: !!firstVault,
    staleTime: 1000 * 60 * 30,
  });

  const members = todayData?.data?.members ?? [];
  const selectedMember = members[selectedMemberIdx];

  // Premium gate
  if (tier !== "premium") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "குடும்ப Vault" : "Family Vault"}
          </Text>
        </View>
        <View style={styles.gateContainer}>
          <Text style={styles.gateIcon}>🏠</Text>
          <Text style={[styles.gateTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "குடும்ப Vault — Premium" : "Family Vault — Premium Feature"}
          </Text>
          <Text style={[styles.gateSub, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "5 குடும்ப உறுப்பினர்களின் ஜாதகங்களை ஒரே இடத்தில் பார்க்கலாம்."
              : "View up to 5 family members' charts and daily guidance in one place."}
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/premium")}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeBtnText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "Premium-ல் சேருங்கள் →" : "Join Premium →"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function handleCreateVault() {
    Alert.prompt(
      isTamil ? "Vault பெயர்" : "Vault Name",
      isTamil ? "உங்கள் குடும்ப Vault-க்கு பெயர் கொடுங்கள்" : "Give your family vault a name",
      async (name) => {
        if (!name?.trim()) return;
        try {
          await createFamilyVault(name.trim());
          refetchVaults();
        } catch {
          Alert.alert(
            isTamil ? "பிழை" : "Error",
            isTamil ? "Vault உருவாக்க முடியவில்லை." : "Could not create vault."
          );
        }
      },
      "plain-text",
      isTamil ? "என் குடும்பம்" : "My Family"
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "குடும்ப Vault" : "Family Vault"}
        </Text>
        {vaults.length > 0 && (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.addBtn}>{isTamil ? "சேர்க்க +" : "Add +"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {vaultsLoading ? (
        <View style={styles.scroll}>
          <SkeletonCard height={120} />
          <SkeletonCard height={200} />
        </View>
      ) : vaultsError ? (
        <View style={{ padding: S.base }}>
          <ErrorCard
            onRetry={refetchVaults}
            message={isTamil ? "Vault தகவல் கிடைக்கவில்லை." : "Could not load vault."}
          />
        </View>
      ) : vaults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={[styles.emptyTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "குடும்ப Vault இல்லை" : "No Family Vault Yet"}
          </Text>
          <Text style={[styles.emptySub, isTamil ? TamilType.body : EnType.body]}>
            {isTamil
              ? "குடும்ப உறுப்பினர்களின் ஜாதகங்களை ஒன்றாக பார்க்க Vault உருவாக்குங்கள்."
              : "Create a vault to view your family members' charts and daily guidance together."}
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreateVault} activeOpacity={0.85}>
            <Text style={[styles.createBtnText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "Vault உருவாக்கு" : "Create Vault"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Member horizontal scroller */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberScroll}
          >
            {todayLoading
              ? [0, 1, 2].map((i) => (
                  <View key={i} style={styles.memberCardSkeleton}>
                    <SkeletonCard height={100} />
                  </View>
                ))
              : members.map((m, idx) => (
                  <MemberCard
                    key={m.profileId}
                    member={m}
                    selected={idx === selectedMemberIdx}
                    onPress={() => setSelectedMemberIdx(idx)}
                    isTamil={isTamil}
                  />
                ))}
          </ScrollView>

          {/* Selected member detail */}
          {todayError && (
            <View style={{ padding: S.base }}>
              <ErrorCard
                message={isTamil ? "இன்றைய தகவல் கிடைக்கவில்லை." : "Could not load today's data."}
              />
            </View>
          )}
          {selectedMember && (
            <View style={{ padding: S.base }}>
              <MemberDetail
                member={selectedMember}
                isTamil={isTamil}
                onAskVinaadi={() =>
                  router.push({ pathname: "/ask-vinaadi", params: { chartId: selectedMember.chartId } })
                }
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary, flex: 1 },
  addBtn: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.saffron },
  scroll: { padding: S.base, gap: S.base },
  memberScroll: {
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    gap: S.sm,
  },
  memberCard: {
    width: 100,
    alignItems: "center",
    gap: S.xs,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: C.divider,
    padding: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  memberCardSelected: { borderColor: C.saffron },
  memberCardSkeleton: { width: 100 },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { fontFamily: "Inter_700Bold", fontSize: 20 },
  memberName: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  memberRel: { color: C.textTertiary, textAlign: "center", fontSize: 11, lineHeight: 16 },
  detailCard: {
    backgroundColor: "#1A2540",
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailScoreRow: { flexDirection: "row", gap: S.base, alignItems: "center" },
  detailScoreInfo: { flex: 1, gap: S.xs },
  detailName: { color: "#FFFFFF" },
  detailLabel: { color: "rgba(255,255,255,0.70)" },
  chandraChip: {
    backgroundColor: "#FEF5EC",
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.caution,
  },
  chandraChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.caution },
  highlight: { color: "rgba(255,255,255,0.90)", lineHeight: 22 },
  timingsRow: { flexDirection: "row", gap: S.sm },
  timingChip: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: S.sm,
    gap: S.xs,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  timingLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  timingValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  askBtn: {
    backgroundColor: "rgba(212,97,26,0.18)",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.saffron,
    padding: S.md,
    alignItems: "center",
  },
  askBtnText: { color: C.amber },
  gateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
    gap: S.base,
  },
  gateIcon: { fontSize: 56, marginBottom: S.sm },
  gateTitle: { color: C.textPrimary, textAlign: "center" },
  gateSub: { color: C.textSecond, textAlign: "center", lineHeight: 22 },
  upgradeBtn: {
    backgroundColor: C.gold,
    borderRadius: RADIUS.button,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    marginTop: S.sm,
  },
  upgradeBtnText: { color: C.textPrimary, fontFamily: "Inter_700Bold" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
    gap: S.base,
  },
  emptyIcon: { fontSize: 56, marginBottom: S.sm },
  emptyTitle: { color: C.textPrimary, textAlign: "center" },
  emptySub: { color: C.textSecond, textAlign: "center", lineHeight: 22 },
  createBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    marginTop: S.sm,
  },
  createBtnText: { color: C.surface, fontFamily: "Inter_700Bold" },
});
