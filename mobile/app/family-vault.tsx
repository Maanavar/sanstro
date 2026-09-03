import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, Home } from "lucide-react-native";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "@/context/ToastContext";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { ScoreRing } from "@/components/ScoreRing";
import { listFamilyVaults, getFamilyVaultToday, createFamilyVault } from "@/api/familyVault";
import { getRelationshipSynastry } from "@/api/relationships";
import { biText } from "@/lib/i18n";
import type { FamilyMemberDayView } from "@/api/familyVault";
import type { SynastryAspect, SynastryData } from "@/api/relationships";

const RELATIONSHIP_TA: Record<string, string> = {
  father: "தந்தை", mother: "அம்மா", spouse: "மனைவி / கணவர்",
  son: "மகன்", daughter: "மகள்", sibling: "உடன்பிறந்தவர்",
  self: "நான்", other: "மற்றவர்",
};

function scoreColor(score: number, C: ColorTokens): string {
  if (score >= 7) return C.green;
  if (score >= 4) return C.amber;
  return C.alert;
}
function synastryScoreColor(score: number, C: ColorTokens): string {
  if (score >= 65) return C.green;
  if (score >= 45) return C.amber;
  return C.alert;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}


function isHarmonyTone(tone: string): boolean {
  const normalized = tone.toLowerCase();
  return normalized === "harmony" || normalized === "supportive";
}

function isTensionTone(tone: string): boolean {
  const normalized = tone.toLowerCase();
  return normalized === "tension" || normalized === "challenging";
}

function toneColor(tone: string, C: ColorTokens): string {
  if (isHarmonyTone(tone)) return C.green;
  if (isTensionTone(tone)) return C.alert;
  return C.amber;
}

function toneLabel(tone: string): string {
  if (isHarmonyTone(tone)) return "Support";
  if (isTensionTone(tone)) return "Tension";
  return "Neutral";
}

function prettyAstroLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " - ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
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
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const relLabel = isTamil
    ? (RELATIONSHIP_TA[member.relationship.toLowerCase()] ?? member.relationship)
    : member.relationship;

  return (
    <TouchableOpacity
      style={[styles.memberCard, selected && styles.memberCardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.memberAvatar, { backgroundColor: scoreColor(member.score, C) + "22" }]}>
        <Text style={[styles.memberInitial, { color: scoreColor(member.score, C) }]}>
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
  onOpenSynastry,
}: {
  member: FamilyMemberDayView;
  isTamil: boolean;
  onAskVinaadi: () => void;
  onOpenSynastry: () => void;
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const canCompare = member.relationship.toLowerCase() !== "self";

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
              <AlertTriangle size={10} color={C.caution} strokeWidth={2} />
              <Text style={styles.chandraChipText}>
                {isTamil ? "சந்திராஷ்டமம்" : "Chandrashtama"}
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

      {canCompare && (
        <TouchableOpacity style={styles.synastryBtn} onPress={onOpenSynastry} activeOpacity={0.85}>
          <Text style={[styles.synastryBtnText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? "Compatibility Radar" : "Compatibility Radar"}
          </Text>
        </TouchableOpacity>
      )}
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

type RadarFactor = { key: string; label: string; value: number };

function buildRadarFactors(data: SynastryData): RadarFactor[] {
  const aspects = data.keyAspects ?? [];
  const harmonyCount = data.harmonyNotes?.length ?? 0;
  const tensionCount = data.tensionNotes?.length ?? 0;
  const supportiveAspects = aspects.filter((a) => isHarmonyTone(a.tone)).length;
  const tenseAspects = aspects.filter((a) => isTensionTone(a.tone)).length;
  const totalAspects = Math.max(aspects.length, 1);
  const timingCount = data.timingIndicators?.length ?? 0;

  return [
    { key: "overall", label: "Overall", value: clampPercent(data.score) },
    {
      key: "harmony",
      label: "Harmony",
      value: clampPercent(data.score * 0.55 + harmonyCount * 14 + (supportiveAspects / totalAspects) * 35),
    },
    {
      key: "ease",
      label: "Ease",
      value: clampPercent(78 - tensionCount * 10 - tenseAspects * 8 + data.score * 0.22),
    },
    {
      key: "spark",
      label: "Spark",
      value: clampPercent(45 + aspects.length * 7 + supportiveAspects * 8 - tenseAspects * 4),
    },
    {
      key: "timing",
      label: "Timing",
      value: clampPercent(50 + timingCount * 15 + data.score * 0.25),
    },
    {
      key: "repair",
      label: "Repair",
      value: clampPercent(58 + tensionCount * 6 - tenseAspects * 5 + harmonyCount * 3),
    },
  ];
}

function RadarChart({ factors }: { factors: RadarFactor[] }) {
  const C = useColors();
  const size = 236;
  const center = size / 2;
  const radius = 78;
  const angleStep = (Math.PI * 2) / factors.length;

  function pointAt(index: number, value: number) {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = radius * (value / 100);
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  }

  function pointsAt(scale: number) {
    return factors
      .map((_, index) => {
        const point = pointAt(index, scale * 100);
        return `${point.x},${point.y}`;
      })
      .join(" ");
  }

  const dataPoints = factors
    .map((factor, index) => {
      const point = pointAt(index, factor.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <Polygon
          key={scale}
          points={pointsAt(scale)}
          fill="none"
          stroke={C.divider}
          strokeWidth={scale === 1 ? 1.2 : 0.8}
        />
      ))}
      {factors.map((factor, index) => {
        const outer = pointAt(index, 100);
        const label = pointAt(index, 118);
        return (
          <React.Fragment key={factor.key}>
            <Line x1={center} y1={center} x2={outer.x} y2={outer.y} stroke={C.divider} strokeWidth={0.8} />
            <SvgText
              x={label.x}
              y={label.y}
              fill={C.textSecond}
              fontSize={10}
              fontWeight="600"
              textAnchor="middle"
            >
              {factor.label}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Polygon points={dataPoints} fill={`${C.saffron}30`} stroke={C.saffron} strokeWidth={2.5} />
      {factors.map((factor, index) => {
        const point = pointAt(index, factor.value);
        return <Circle key={factor.key} cx={point.x} cy={point.y} r={3.5} fill={C.saffron} />;
      })}
    </Svg>
  );
}

function NoteCluster({
  title,
  notes,
  isTamil,
  tone,
}: {
  title: string;
  notes: SynastryData["harmonyNotes"];
  isTamil: boolean;
  tone: "harmony" | "tension";
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  if (notes.length === 0) return null;
  const color = tone === "harmony" ? C.green : C.alert;
  return (
    <View style={[styles.notePanel, tone === "tension" && styles.notePanelTension]}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {notes.map((note, index) => (
        <View key={`${title}-${index}`} style={styles.noteRow}>
          <View style={[styles.noteDot, { backgroundColor: color }]} />
          <Text style={[styles.noteText, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            {biText(note, isTamil)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AspectRow({ aspect, isTamil }: { aspect: SynastryAspect; isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const color = toneColor(aspect.tone, C);
  return (
    <View style={styles.aspectRow}>
      <View style={[styles.aspectDot, { backgroundColor: color }]} />
      <View style={styles.aspectBody}>
        <Text style={styles.aspectTitle}>
          {prettyAstroLabel(aspect.pair)} / {prettyAstroLabel(aspect.aspect)}
        </Text>
        <Text style={[styles.aspectNote, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
          {biText(aspect.note, isTamil)}
        </Text>
      </View>
      <View style={[styles.toneChip, { borderColor: color, backgroundColor: `${color}18` }]}>
        <Text style={[styles.toneChipText, { color }]}>{toneLabel(aspect.tone)}</Text>
      </View>
    </View>
  );
}

function SynastryRadarSheet({
  member,
  data,
  isLoading,
  isError,
  onRetry,
  isTamil,
}: {
  member: FamilyMemberDayView | null;
  data: SynastryData | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isTamil: boolean;
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const factors = useMemo(() => (data ? buildRadarFactors(data) : []), [data]);
  const scoreColorValue = data ? synastryScoreColor(data.score, C) : C.saffron;

  return (
    <>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetEyebrow}>Synastry</Text>
          <Text style={[styles.sheetTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {member ? `Compatibility with ${member.name}` : "Compatibility Radar"}
          </Text>
        </View>
        {data && (
          <View style={[styles.sheetScoreBadge, { borderColor: scoreColorValue }]}>
            <Text style={[styles.sheetScoreValue, { color: scoreColorValue }]}>{data.score}</Text>
            <Text style={styles.sheetScoreLabel}>{data.label}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <>
          <SkeletonCard height={220} />
          <SkeletonCard height={96} />
          <SkeletonCard height={140} />
        </>
      ) : isError ? (
        <ErrorCard
          onRetry={onRetry}
          message={isTamil ? "Compatibility load failed." : "Could not load compatibility."}
        />
      ) : data ? (
        <>
          <View style={styles.radarPanel}>
            <View style={styles.radarChartWrap}>
              <RadarChart factors={factors} />
            </View>
            <View style={styles.radarLegend}>
              {factors.map((factor) => (
                <View key={factor.key} style={styles.radarMetricRow}>
                  <View style={styles.radarMetricMeta}>
                    <Text style={styles.radarMetricLabel}>{factor.label}</Text>
                    <Text style={styles.radarMetricValue}>{factor.value}</Text>
                  </View>
                  <View style={styles.radarTrack}>
                    <View style={[styles.radarFill, { width: `${factor.value}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.summaryPanel}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={[styles.summaryText, isTamil ? TamilType.body : EnType.body]}>
              {biText(data.summary, isTamil)}
            </Text>
          </View>

          <NoteCluster title="Harmony signals" notes={data.harmonyNotes ?? []} isTamil={isTamil} tone="harmony" />
          <NoteCluster title="Care points" notes={data.tensionNotes ?? []} isTamil={isTamil} tone="tension" />

          {(data.keyAspects ?? []).length > 0 && (
            <View style={styles.summaryPanel}>
              <Text style={styles.sectionTitle}>Key aspects</Text>
              {(data.keyAspects ?? []).map((aspect, index) => (
                <AspectRow key={`${aspect.pair}-${aspect.aspect}-${index}`} aspect={aspect} isTamil={isTamil} />
              ))}
            </View>
          )}

          {(data.timingIndicators ?? []).length > 0 && (
            <View style={styles.summaryPanel}>
              <Text style={styles.sectionTitle}>Timing indicators</Text>
              {(data.timingIndicators ?? []).map((item, index) => (
                <View key={`${item.planet}-${index}`} style={styles.timingRow}>
                  <Text style={styles.timingPlanet}>{prettyAstroLabel(item.planet)}</Text>
                  <Text style={[styles.timingText, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
                    {biText(item.description, isTamil)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.sheetEmptyText}>Pick a family member to compare charts.</Text>
      )}
    </>
  );
}

export default function FamilyVaultScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { showError } = useToast();
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { tier } = useSession();
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);
  const [synastryMember, setSynastryMember] = useState<FamilyMemberDayView | null>(null);
  const synastrySheetRef = useRef<BottomSheet>(null);
  const synastrySnapPoints = useMemo(() => ["58%", "92%"], []);

  // Vault name input sheet state
  const [vaultNameSheetOpen, setVaultNameSheetOpen] = useState(false);
  const [vaultNameInput, setVaultNameInput] = useState("");
  const vaultNameSheetRef = useRef<BottomSheet>(null);
  const vaultNameSnapPoints = useMemo(() => ["35%"], []);

  const {
    data: vaultsData,
    isLoading: vaultsLoading,
    isFetching: vaultsFetching,
    isError: vaultsError,
    refetch: refetchVaults,
  } = useQuery({
      queryKey: ["family-vaults"],
      queryFn: listFamilyVaults,
      staleTime: 1000 * 60 * 5,
    });

  const vaults = vaultsData?.data?.items ?? [];
  const firstVault = vaults[0];

  const {
    data: todayData,
    isLoading: todayLoading,
    isFetching: todayFetching,
    isError: todayError,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ["family-vault-today", firstVault?.familyVaultId],
    queryFn: () => getFamilyVaultToday(firstVault!.familyVaultId),
    enabled: !!firstVault,
    staleTime: 1000 * 60 * 30,
  });


  const synastryMemberId = synastryMember?.memberId;
  const {
    data: synastryData,
    isLoading: synastryLoading,
    isFetching: synastryFetching,
    isError: synastryError,
    refetch: refetchSynastry,
  } = useQuery({
    queryKey: ["relationship-synastry", firstVault?.familyVaultId, synastryMemberId],
    queryFn: () => getRelationshipSynastry(synastryMemberId!, firstVault!.familyVaultId),
    enabled: !!firstVault && !!synastryMemberId,
    staleTime: 1000 * 60 * 30,
  });
  const members = todayData?.data?.members ?? [];
  const selectedMember = members[selectedMemberIdx];
  const isRefreshing = vaultsFetching || todayFetching;
  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={() => {
        refetchVaults();
        if (firstVault) refetchToday();
      }}
      tintColor={C.saffron}
    />
  );


  function handleOpenSynastry(member: FamilyMemberDayView) {
    if (!firstVault) return;
    setSynastryMember(member);
    Haptics.selectionAsync();
    synastrySheetRef.current?.expand();
  }
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
          <Home size={56} color={C.gold} strokeWidth={1} style={{ marginBottom: S.sm }} />
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
    setVaultNameInput(isTamil ? "என் குடும்பம்" : "My Family");
    setVaultNameSheetOpen(true);
    vaultNameSheetRef.current?.snapToIndex(0);
  }

  async function submitCreateVault() {
    const name = vaultNameInput.trim();
    if (!name) return;
    vaultNameSheetRef.current?.close();
    setVaultNameSheetOpen(false);
    try {
      await createFamilyVault(name);
      refetchVaults();
    } catch {
      showError(isTamil ? "Vault உருவாக்க முடியவில்லை" : "Could not create vault.");
    }
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
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={refreshControl}>
          <SkeletonCard height={120} />
          <SkeletonCard height={200} />
        </ScrollView>
      ) : vaultsError ? (
        <ScrollView contentContainerStyle={{ padding: S.base }} refreshControl={refreshControl}>
          <ErrorCard
            onRetry={refetchVaults}
            message={isTamil ? "Vault தகவல் கிடைக்கவில்லை." : "Could not load vault."}
          />
        </ScrollView>
      ) : vaults.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer} refreshControl={refreshControl}>
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
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
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
                    key={m.memberId}
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
                onOpenSynastry={() => handleOpenSynastry(selectedMember)}
              />
            </View>
          )}
        </ScrollView>
      )}
      <BottomSheet
        ref={synastrySheetRef}
        snapPoints={synastrySnapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.synastrySheetBg}
        handleIndicatorStyle={styles.synastrySheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.synastrySheetScroll}>
          <SynastryRadarSheet
            member={synastryMember}
            data={synastryData?.data ?? null}
            isLoading={synastryLoading || (synastryFetching && !synastryData)}
            isError={synastryError}
            onRetry={() => { refetchSynastry(); }}
            isTamil={isTamil}
          />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Vault name input sheet — replaces Alert.prompt (iOS-only) */}
      <BottomSheet
        ref={vaultNameSheetRef}
        index={-1}
        snapPoints={vaultNameSnapPoints}
        enablePanDownToClose
        onClose={() => setVaultNameSheetOpen(false)}
        backgroundStyle={styles.synastrySheetBg}
        handleIndicatorStyle={styles.synastrySheetHandle}
      >
        <View style={styles.vaultInputSheet}>
          <Text style={styles.vaultInputTitle}>
            {isTamil ? "Vault பெயர்" : "Vault Name"}
          </Text>
          <Text style={styles.vaultInputBody}>
            {isTamil ? "உங்கள் குடும்ப Vault-க்கு பெயர் கொடுங்கள்" : "Give your family vault a name"}
          </Text>
          <TextInput
            style={styles.vaultInput}
            value={vaultNameInput}
            onChangeText={setVaultNameInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submitCreateVault}
            placeholderTextColor={C.textTertiary}
          />
          <TouchableOpacity style={styles.vaultInputSubmit} onPress={submitCreateVault}>
            <Text style={styles.vaultInputSubmitText}>
              {isTamil ? "உருவாக்கு" : "Create"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
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
    backgroundColor: C.darkBg,
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
  detailName: { color: C.indigoText },
  detailLabel: { color: C.indigoText, opacity: 0.7 },
  chandraChip: {
    backgroundColor: C.goldMethodLight,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.caution,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
  },
  chandraChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.caution },
  highlight: { color: C.indigoText, opacity: 0.9, lineHeight: 22 },
  timingsRow: { flexDirection: "row", gap: S.sm },
  timingChip: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: S.sm,
    gap: S.xs,
    backgroundColor: C.indigoText + "14",
  },
  timingLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  timingValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.indigoText },
  askBtn: {
    backgroundColor: C.saffron + "2E",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.saffron,
    padding: S.md,
    alignItems: "center",
  },
  askBtnText: { color: C.amber },
  synastryBtn: {
    backgroundColor: C.indigoText + "1A",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.indigoText + "47",
    padding: S.md,
    alignItems: "center",
  },
  synastryBtnText: { color: C.indigoText, fontFamily: "Inter_700Bold" },
  synastrySheetBg: { backgroundColor: C.parchment },
  synastrySheetHandle: { backgroundColor: C.divider, width: 42 },
  synastrySheetScroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: S.md, marginBottom: S.sm },
  sheetEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0,
    color: C.saffron,
    textTransform: "uppercase",
  },
  sheetTitle: { color: C.textPrimary, marginTop: 2 },
  sheetScoreBadge: {
    minWidth: 74,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    backgroundColor: C.surface,
    paddingHorizontal: S.sm,
    paddingVertical: S.xs,
    alignItems: "center",
  },
  sheetScoreValue: { fontFamily: "Inter_800ExtraBold", fontSize: 24, lineHeight: 28 },
  sheetScoreLabel: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.textTertiary },
  radarPanel: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.base,
    gap: S.md,
  },
  radarChartWrap: { alignItems: "center" },
  radarLegend: { gap: S.sm },
  radarMetricRow: { gap: S.xs },
  radarMetricMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  radarMetricLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSecond },
  radarMetricValue: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textPrimary },
  radarTrack: { height: 6, borderRadius: 4, backgroundColor: C.surfaceAlt, overflow: "hidden" },
  radarFill: { height: 6, borderRadius: 4, backgroundColor: C.saffron },
  summaryPanel: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.base,
    gap: S.sm,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.textPrimary },
  summaryText: { color: C.textSecond },
  notePanel: {
    backgroundColor: C.green + "22",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.green + "33",
    padding: S.base,
    gap: S.sm,
  },
  notePanelTension: { backgroundColor: C.alert + "22", borderColor: C.alert + "33" },
  noteRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  noteDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  noteText: { color: C.textSecond, flex: 1 },
  aspectRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: S.sm,
    paddingVertical: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  aspectDot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
  aspectBody: { flex: 1, gap: 3 },
  aspectTitle: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textPrimary },
  aspectNote: { color: C.textSecond },
  toneChip: { borderRadius: RADIUS.chip, borderWidth: 1, paddingHorizontal: S.sm, paddingVertical: 3 },
  toneChipText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  timingRow: { gap: S.xs, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.divider },
  timingPlanet: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.saffron },
  timingText: { color: C.textSecond },
  sheetEmptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecond, textAlign: "center" },
  gateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
    gap: S.base,
  },
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
  vaultInputSheet: {
    flex: 1,
    paddingHorizontal: S.xl,
    paddingTop: S.lg,
    paddingBottom: S["2xl"],
    gap: S.md,
  },
  vaultInputTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: C.textPrimary,
  },
  vaultInputBody: {
    fontSize: 14,
    color: C.textSecond,
    lineHeight: 20,
  },
  vaultInput: {
    height: 48,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: S.lg,
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: C.parchment,
    marginTop: S.sm,
  },
  vaultInputSubmit: {
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  vaultInputSubmitText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.indigoText,
  },
  });
}
