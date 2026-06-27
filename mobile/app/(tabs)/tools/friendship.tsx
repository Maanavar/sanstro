import React, { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Lock, Users } from "lucide-react-native";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { listFamilyVaults, getFamilyVaultToday } from "@/api/familyVault";
import { getPorutham } from "@/api/tools";
import type { FamilyMemberDayView } from "@/api/familyVault";
import { NAKSHATRA_LIST } from "@vinaadi/shared";

function nakshatraNumberFromName(name: string): number | null {
  const lower = name.toLowerCase().replace(/\s+/g, "");
  const match = NAKSHATRA_LIST.find(
    (n) =>
      n.name.en.toLowerCase().replace(/\s+/g, "") === lower ||
      n.name.ta === name ||
      n.slug.replace(/-/g, "") === lower,
  );
  return match?.number ?? null;
}

function scoreColor(score: number, C: ColorTokens): string {
  if (score >= 8) return C.green;
  if (score >= 5) return C.amber;
  return C.maroon;
}

type MemberPickerProps = {
  label: string;
  members: FamilyMemberDayView[];
  selected: FamilyMemberDayView | null;
  onSelect: (m: FamilyMemberDayView) => void;
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
};

function MemberPicker({ label, members, selected, onSelect, isTamil, C, styles }: MemberPickerProps) {
  return (
    <View style={styles.pickerSection}>
      <Text style={[styles.pickerLabel, isTamil ? TamilType.caption : EnType.caption]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
        {members.map((m) => {
          const isSel = selected?.memberId === m.memberId;
          return (
            <TouchableOpacity
              key={m.memberId}
              style={[styles.memberChip, isSel && { backgroundColor: C.saffron, borderColor: C.saffron }]}
              onPress={() => { Haptics.selectionAsync(); onSelect(m); }}
              activeOpacity={0.85}
            >
              <View style={[styles.memberAvatar, isSel && { backgroundColor: `${C.surface}30` }]}>
                <Text style={[styles.memberAvatarText, isSel && { color: C.surface }]}>
                  {m.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[
                styles.memberName,
                { fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold" },
                isSel && { color: C.surface },
              ]} numberOfLines={1}>
                {m.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function FriendshipCompatibilityScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";

  const [vaultId, setVaultId] = useState<string | null>(null);
  const [person1, setPerson1] = useState<FamilyMemberDayView | null>(null);
  const [person2, setPerson2] = useState<FamilyMemberDayView | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  const { data: vaultList, isLoading: vaultLoading } = useQuery({
    queryKey: ["family-vaults"],
    queryFn: listFamilyVaults,
    enabled: tier !== "guest",
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const first = vaultList?.data?.items?.[0];
    if (first) setVaultId(first.familyVaultId);
  }, [vaultList]);

  const { data: vaultToday, isLoading: membersLoading } = useQuery({
    queryKey: ["family-vault-today", vaultId],
    queryFn: () => getFamilyVaultToday(vaultId!),
    enabled: !!vaultId,
    staleTime: 1000 * 60 * 60,
  });

  const members = vaultToday?.data?.members ?? [];

  const n1 = person1 ? nakshatraNumberFromName((person1 as any).nakshatraName ?? "") : null;
  const n2 = person2 ? nakshatraNumberFromName((person2 as any).nakshatraName ?? "") : null;

  const { data: result, isLoading: checking, isError, refetch } = useQuery({
    queryKey: ["friendship-compat", person1?.memberId, person2?.memberId],
    queryFn: () => {
      if (!n1 || !n2) throw new Error("Nakshatra not found");
      return getPorutham({ boyNakshatraNumber: n1, girlNakshatraNumber: n2 });
    },
    enabled: submitted && !!person1 && !!person2,
    staleTime: 0,
  });

  function handleCheck() {
    if (!person1 || !person2 || person1.memberId === person2.memberId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(true);
    sheetRef.current?.expand();
  }

  const compat = result?.data;
  const canCheck = !!person1 && !!person2 && person1.memberId !== person2.memberId;

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} C={C} styles={styles} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "குடும்ப சேமிப்பு உருவாக்க உள்நுழைக." : "Sign in to access your Family Vault."}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.ctaBtnText}>{isTamil ? "உள்நுழைக" : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header isTamil={isTamil} C={C} styles={styles} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.subtitle, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "இரண்டு குடும்ப உறுப்பினர்களை தேர்ந்தெடுத்து பொருத்தம் காண்க"
            : "Select two family members to check their compatibility"}
        </Text>

        {(vaultLoading || membersLoading) && (
          <><SkeletonCard height={80} /><SkeletonCard height={80} /></>
        )}

        {!vaultLoading && !membersLoading && members.length === 0 && (
          <View style={styles.emptyCard}>
            <Users size={40} color={C.textTertiary} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? "குடும்ப சேமிப்பு இல்லை" : "No Family Vault found"}
            </Text>
            <Text style={[styles.emptyDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "Family Vault-ல் உறுப்பினர்களை சேர்க்கவும்." : "Add members in your Family Vault first."}
            </Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/family-vault" as any)}>
              <Text style={styles.ctaBtnText}>{isTamil ? "குடும்ப சேமிப்பு திற" : "Open Family Vault"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {members.length >= 2 && (
          <>
            <MemberPicker
              label={isTamil ? "முதல் நபர்" : "First Person"}
              members={members}
              selected={person1}
              onSelect={setPerson1}
              isTamil={isTamil}
              C={C}
              styles={styles}
            />
            <MemberPicker
              label={isTamil ? "இரண்டாம் நபர்" : "Second Person"}
              members={members}
              selected={person2}
              onSelect={setPerson2}
              isTamil={isTamil}
              C={C}
              styles={styles}
            />

            {person1 && person2 && person1.memberId === person2.memberId && (
              <Text style={[styles.errorMsg, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "இரண்டு வேறு நபர்களை தேர்ந்தெடுக்கவும்" : "Please select two different people"}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.ctaBtn, !canCheck && styles.ctaDisabled]}
              onPress={handleCheck}
              disabled={!canCheck}
              activeOpacity={0.85}
            >
              <Heart size={18} color={C.surface} strokeWidth={2} />
              <Text style={styles.ctaBtnText}>
                {isTamil ? "பொருத்தம் கணக்கிட" : "Check Compatibility"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: C.divider, width: 40 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
          {checking ? (
            <><SkeletonCard height={120} /><SkeletonCard height={80} /></>
          ) : isError ? (
            <ErrorCard
              message={isTamil ? "நட்சத்திர விவரங்கள் கிடைக்கவில்லை" : "Could not load nakshatra details"}
              onRetry={refetch}
            />
          ) : compat ? (
            <>
              <View style={[styles.scoreHero, { backgroundColor: scoreColor(compat.totalScore, C) }]}>
                <Text style={styles.pairNames}>
                  {person1?.name} & {person2?.name}
                </Text>
                <Text style={styles.scoreNum}>{compat.totalScore} / {compat.maxScore}</Text>
                <Text style={styles.scoreLabel}>
                  {isTamil ? compat.summary.ta : compat.summary.en}
                </Text>
              </View>

              {compat.kutas.map((k) => (
                <View key={k.name} style={styles.kutaRow}>
                  <View style={styles.kutaLeft}>
                    <Text style={[styles.kutaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                      {isTamil ? k.nameTa : k.name}
                    </Text>
                    <Text style={styles.kutaScore}>{k.score}/{k.maxScore}</Text>
                  </View>
                  <View style={[
                    styles.kutaChip,
                    {
                      backgroundColor:
                        k.score === k.maxScore ? C.greenLight
                        : k.score === 0 ? C.alertLight
                        : C.cautionLight,
                    },
                  ]}>
                    <Text style={[
                      styles.kutaChipText,
                      {
                        color:
                          k.score === k.maxScore ? C.green
                          : k.score === 0 ? C.alert
                          : C.caution,
                      },
                    ]}>
                      {k.score === k.maxScore
                        ? (isTamil ? "பொருந்தும்" : "Match")
                        : k.score === 0
                        ? (isTamil ? "பொருந்தாது" : "No match")
                        : (isTamil ? "நடுத்தரம்" : "Partial")}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Header({ isTamil, C, styles }: { isTamil: boolean; C: ColorTokens; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "நட்பு பொருத்தம்" : "Friendship Compatibility"}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
    headerTitle: { color: C.textPrimary, flex: 1, textAlign: "center" },
    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },
    subtitle: { color: C.textSecond },

    pickerSection: { gap: S.xs },
    pickerLabel: { color: C.textSecond },
    pickerRow: { gap: S.sm, paddingRight: S.base },
    memberChip: {
      flexDirection: "row", alignItems: "center", gap: S.xs,
      paddingHorizontal: S.md, paddingVertical: S.sm,
      borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.divider,
      backgroundColor: C.surface,
    },
    memberAvatar: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
    },
    memberAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.goldOnLight },
    memberName: { fontSize: 13, lineHeight: 18, color: C.textPrimary, maxWidth: 90 },

    ctaBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: S.sm,
      backgroundColor: C.saffron, borderRadius: RADIUS.button,
      height: 52,
    },
    ctaDisabled: { opacity: 0.4 },
    ctaBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },

    errorMsg: { color: C.alert, textAlign: "center" },

    emptyCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.xl,
      alignItems: "center", gap: S.md,
    },
    emptyTitle: { fontSize: 16, color: C.textPrimary, textAlign: "center" },
    emptyDesc: { color: C.textSecond, textAlign: "center" },

    guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
    guestTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
    guestDesc: { color: C.textSecond, textAlign: "center" },

    sheetBg: { backgroundColor: C.parchment },
    sheetScroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
    pairNames: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: `${C.surface}CC`, marginBottom: S.xs },
    scoreHero: {
      borderRadius: RADIUS.card, padding: S.xl,
      alignItems: "center", gap: S.xs, marginBottom: S.sm,
    },
    scoreNum: { fontFamily: "Inter_800ExtraBold", fontSize: 48, color: C.surface, lineHeight: 56 },
    scoreLabel: { fontFamily: "NotoSansTamil_700Bold", fontSize: 18, lineHeight: 26, color: C.surface, textAlign: "center" },
    kutaRow: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    kutaLeft: { flex: 1, gap: 2 },
    kutaName: { fontSize: 14, lineHeight: 20, color: C.textPrimary },
    kutaScore: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
    kutaChip: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 4 },
    kutaChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  });
}
