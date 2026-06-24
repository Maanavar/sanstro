import React, { useMemo, useState } from "react";
import { AlertTriangle, Moon, Sparkles, Bell } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getNotificationInbox } from "@/api/notifications";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import type { NotificationInboxItem } from "@vinaadi/shared";

const FILTERS = [
  { id: "all",        ta: "அனைத்தும்",  en: "All" },
  { id: "personal",   ta: "தனிப்பட்ட",   en: "Personal" },
  { id: "panchangam", ta: "பஞ்சாங்கம்", en: "Panchangam" },
  { id: "alert",      ta: "எச்சரிக்கை",   en: "Alerts" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

function timeAgo(iso: string | null | undefined, isTamil: boolean): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return isTamil ? `${mins} நிமிடம்` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isTamil ? `${hrs} மணி` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return isTamil ? `${days} நாள்` : `${days}d`;
}

function notifIcon(type: string): LucideIcon {
  if (type === "alert") return AlertTriangle;
  if (type === "panchangam") return Moon;
  if (type === "personal") return Sparkles;
  return Bell;
}

function iconBg(type: string, C: ColorTokens): string {
  if (type === "alert") return C.amber + "55";
  if (type === "panchangam") return C.deepIndigo + "22";
  if (type === "personal") return C.goldMethodLight;
  return C.surfaceAlt;
}

export default function NotificationInboxScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [filter, setFilter] = useState<FilterId>("all");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["notification-inbox"],
    queryFn: getNotificationInbox,
    staleTime: 1000 * 60 * 5,
  });

  const items: NotificationInboxItem[] = data?.data ?? [];
  const filtered = filter === "all" ? items : items.filter((n: NotificationInboxItem) => n.type === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "அறிவிப்புகள்" : "Notifications"}
        </Text>
        <TouchableOpacity onPress={() => router.push("/notifications/settings")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, filter === f.id && styles.chipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive, {
              fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular",
            }]}>
              {isTamil ? f.ta : f.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loadingState}>
          <SkeletonCard height={72} />
          <SkeletonCard height={72} />
          <SkeletonCard height={72} />
        </View>
      )}
      {isError && <ErrorCard onRetry={refetch} />}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.notification_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, isTamil ? TamilType.body : EnType.body]}>
                {isTamil ? "இன்னும் அறிவிப்புகள் இல்லை" : "No notifications yet"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = item.read_at === null;
            const isPeyarchi = item.type === "alert" && item.title?.toLowerCase().includes("peyarchi");
            const NotifIcon = notifIcon(item.type);
            return (
              <TouchableOpacity
                style={[styles.notifRow, isUnread && styles.notifUnread]}
                onPress={() => isPeyarchi ? router.push("/transits" as Href) : undefined}
                activeOpacity={isPeyarchi ? 0.75 : 1}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconBg(item.type, C) }]}>
                  <NotifIcon size={18} color={C.textSecond} strokeWidth={1.5} />
                </View>
                <View style={styles.notifBody}>
                  <Text style={[styles.notifTitle, {
                    fontFamily: isUnread
                      ? (isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold")
                      : (isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular"),
                    color: C.textPrimary, fontSize: 14, lineHeight: 20,
                  }]}>
                    {item.title}
                  </Text>
                  {item.body && (
                    <Text style={[styles.notifBodyText, isTamil ? TamilType.caption : EnType.caption]} numberOfLines={2}>
                      {item.body}
                    </Text>
                  )}
                </View>
                <Text style={styles.notifTime}>{timeAgo(item.send_at, isTamil)}</Text>
                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { flex: 1, color: C.textPrimary },
  settingsIcon: { fontSize: 20 },
  filterRow: {
    flexDirection: "row", gap: S.sm, paddingHorizontal: S.base, paddingVertical: S.sm,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  chip: {
    borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: 6,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  chipText: { fontSize: 12, lineHeight: 18, color: C.textSecond },
  chipTextActive: { color: C.surface },
  loadingState: { padding: S.base, gap: S.sm },
  list: { paddingVertical: S.xs },
  emptyState: { alignItems: "center", paddingTop: 60, gap: S.sm },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: C.textTertiary },
  notifRow: {
    flexDirection: "row", alignItems: "flex-start", gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: S.md,
    backgroundColor: C.parchment,
  },
  notifUnread: { backgroundColor: C.goldMethodLight },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  notifBody: { flex: 1, gap: 2 },
  notifTitle: {},
  notifBodyText: { color: C.textSecond },
  notifTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, minWidth: 28, textAlign: "right" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.saffron, marginTop: 6 },
  separator: { height: 1, backgroundColor: C.divider, marginLeft: 60 },
  });
}
