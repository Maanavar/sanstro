import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useMyConsents } from "@/hooks/useMyConsents";
import { useToast } from "@/context/ToastContext";
import { ErrorCard } from "@/components/ErrorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { deleteFamilyMember, getFamilyMember, updateFamilyMember } from "@/api/familyVault";
import { buildMemberPatch, isEmptyPatch, type BirthEdit, type PlaceEdit } from "@/lib/familyMemberEdit";
import { listBirthProfiles } from "@/api/charts";
import { getNotificationPreferences } from "@/api/notifications";
import { accountKey } from "@/lib/queryKeys";
import { formatPlaceLabel, usePlaceSuggestions } from "@/lib/placeSearch";
import { FAMILY_RELATIONSHIPS, type FamilyRelationship } from "@vinaadi/shared/familyMember";
import { BirthDetailsFields } from "@/components/BirthDetailsFields";
import {
  birthDetailsChanged,
  buildBirthDetailsPayload,
  emptyBirthDetailsForm,
  hasBirthErrors,
  seedBirthDetailsForm,
  validateBirthDetails,
  type BirthDetailsFormState,
  type BirthFormErrors,
} from "@/lib/birthDetailsForm";

/**
 * Edit one family member (audit Part 3). Mobile could not edit a member at all,
 * which is also why the per-member alert opt-in (F5) had nowhere to live: the
 * web edit modal had the toggle and mobile had no equivalent screen.
 *
 * Scope: the membership facts (name, relationship, alerts), *where they live
 * now* (which only changes the daily clock), and the birth date, time and place
 * — correcting which recasts the chart (`recalculate`). The birth block is the
 * shared `<BirthDetailsFields>`, the same one the add-member screen uses.
 * Deleting the member is here too, since the vault screen has no other way to
 * undo an addition.
 *
 * All new Tamil pending a native review.
 */

const RELATIONSHIP_LABEL: Record<FamilyRelationship, { ta: string; en: string }> = {
  self: { ta: "தான்", en: "Self" },
  spouse: { ta: "துணைவர்", en: "Spouse" },
  child: { ta: "குழந்தை", en: "Child" },
  parent: { ta: "பெற்றோர்", en: "Parent" },
  sibling: { ta: "உடன்பிறந்தவர்", en: "Sibling" },
  grandparent: { ta: "தாத்தா / பாட்டி", en: "Grandparent" },
  other: { ta: "மற்றவர்", en: "Other" },
};

type PlaceChoice = { label: string; lat: number; lng: number; timezone: string } | null;

export default function FamilyMemberScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const { me } = useMyConsents();
  const params = useLocalSearchParams<{ memberId?: string; vaultId?: string }>();
  const memberId = typeof params.memberId === "string" ? params.memberId : "";
  const vaultId = typeof params.vaultId === "string" ? params.vaultId : "";

  const {
    data: memberData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: accountKey("family-member", vaultId, memberId),
    queryFn: () => getFamilyMember(vaultId, memberId),
    enabled: !!vaultId && !!memberId,
    staleTime: 60 * 1000,
  });
  const member = memberData?.data ?? null;

  // The member row carries no location: "where they live now" is a birth-profile
  // field, and the web modal reads it from the profile list the same way.
  const { data: profilesData } = useQuery({
    queryKey: accountKey("birth-profiles"),
    queryFn: listBirthProfiles,
    enabled: !!member?.birthProfileId,
    staleTime: 5 * 60 * 1000,
  });
  const profile = useMemo(
    () => (profilesData?.data ?? []).find((p) => p.birthProfileId === member?.birthProfileId) ?? null,
    [profilesData, member?.birthProfileId],
  );

  // The owner's transport channel. A per-member alert opt-in is honoured on
  // whatever channel the owner has — and when that is "none", the digest still
  // reaches the in-app bell but is never pushed or emailed. The toggle says so
  // rather than quietly promising a buzz the transport will not deliver.
  const { data: notifPrefsData } = useQuery({
    queryKey: accountKey("notification-preferences"),
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });
  const channelIsNone = notifPrefsData?.data?.notification_channel === "none";

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationship>("other");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeChoice, setPlaceChoice] = useState<PlaceChoice>(null);
  const [placeCleared, setPlaceCleared] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Birth block (date, time, place, gender) — seeded from the profile once it
  // arrives. `seededBirth` is the untouched snapshot, so a save that does not
  // touch these fields sends nothing, and a round-trip back to the saved values
  // is not treated as a change.
  const [birthForm, setBirthForm] = useState<BirthDetailsFormState>(emptyBirthDetailsForm);
  const [seededBirth, setSeededBirth] = useState<BirthDetailsFormState>(emptyBirthDetailsForm);
  const [birthSeeded, setBirthSeeded] = useState(false);
  const [birthErrors, setBirthErrors] = useState<BirthFormErrors>({});

  // Seeded once. Re-seeding on every fetch would throw away what the user is
  // typing the moment a background refetch lands.
  useEffect(() => {
    if (seeded || !member) return;
    setName(member.displayName);
    setRelationship(
      (FAMILY_RELATIONSHIPS as readonly string[]).includes(member.relationshipToOwner)
        ? (member.relationshipToOwner as FamilyRelationship)
        : "other",
    );
    setAlertsEnabled(member.alertsEnabled);
    setSeeded(true);
  }, [member, seeded]);

  useEffect(() => {
    if (profile && !placeCleared && !placeChoice && placeQuery === "") {
      setPlaceQuery(profile.currentPlace ?? "");
    }
    // Only to adopt the saved value once the profile arrives; the user's own
    // typing is never overwritten because `placeQuery` is non-empty by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Seed the birth block once from the saved profile. Like `seeded` above, this
  // must not re-run on a background refetch or it would discard an in-progress
  // correction.
  useEffect(() => {
    if (birthSeeded || !profile) return;
    const seed = seedBirthDetailsForm(profile);
    setBirthForm(seed);
    setSeededBirth(seed);
    setBirthSeeded(true);
  }, [profile, birthSeeded]);

  function updateBirth(patch: Partial<BirthDetailsFormState>) {
    setBirthForm((prev) => ({ ...prev, ...patch }));
    setBirthErrors({});
  }

  // Did the reader touch the birth block at all? Compared against the untouched
  // seed, so returning to the saved values re-arms the "no change" state.
  const birthFormTouched = JSON.stringify(birthForm) !== JSON.stringify(seededBirth);
  // A birth edit that is both valid and actually different — the only thing that
  // recasts the chart. An invalid in-progress edit is not sent; `handleSave`
  // surfaces the errors instead.
  const birthEdit: BirthEdit = (() => {
    if (!birthFormTouched || hasBirthErrors(validateBirthDetails(birthForm, { requireName: false }))) {
      return { kind: "unchanged" };
    }
    const next = buildBirthDetailsPayload(birthForm);
    const original = seededBirth.selected ? buildBirthDetailsPayload(seededBirth) : null;
    return original && !birthDetailsChanged(original, next)
      ? { kind: "unchanged" }
      : { kind: "changed", payload: next };
  })();

  const savedPlace = profile?.currentPlace ?? "";
  const { suggestions, loading: placeLoading, clear: clearSuggestions } = usePlaceSuggestions(
    placeQuery,
    !placeCleared && placeQuery !== savedPlace,
  );

  const updatesAllowed = me?.consents?.updates !== false;
  // Typing alone must not move anyone: a location is a place AND coordinates,
  // so only a picked suggestion (or an explicit clear) counts as a change.
  const placeEdit: PlaceEdit = placeCleared
    ? { kind: "cleared" }
    : placeChoice
      ? { kind: "picked", ...placeChoice }
      : { kind: "unchanged" };
  const patch = member
    ? buildMemberPatch(member, { name, relationship, alertsEnabled, place: placeEdit, savedPlace, birth: birthEdit })
    : {};
  // `birthFormTouched` keeps Save live even while a birth edit is mid-correction
  // and invalid, so `handleSave` can show the field errors rather than leaving
  // the button dead with no explanation.
  const dirty = !isEmptyPatch(patch) || birthFormTouched;

  function pickSuggestion(place: { name: string; admin1Name: string | null; countryName: string; lat: number; lng: number; timezone: string }) {
    Haptics.selectionAsync();
    const label = formatPlaceLabel(place as Parameters<typeof formatPlaceLabel>[0]);
    setPlaceQuery(label);
    setPlaceChoice({ label, lat: place.lat, lng: place.lng, timezone: place.timezone });
    setPlaceCleared(false);
    clearSuggestions();
  }

  function clearPlace() {
    Haptics.selectionAsync();
    setPlaceQuery("");
    setPlaceChoice(null);
    setPlaceCleared(true);
    clearSuggestions();
  }

  async function handleSave() {
    if (!member || saving || !dirty) return;
    // A touched birth block must be valid before anything is sent — the chart is
    // recast from it. Name is validated elsewhere (the Who section), so it is
    // not required here.
    if (birthFormTouched) {
      const found = validateBirthDetails(birthForm, { requireName: false });
      if (hasBirthErrors(found)) {
        setBirthErrors(found);
        return;
      }
    }
    // Nothing actually changed once validated (e.g. typed then reverted).
    if (isEmptyPatch(patch)) {
      router.back();
      return;
    }
    Haptics.selectionAsync();
    setSaving(true);
    try {
      await updateFamilyMember(vaultId, memberId, patch);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountKey("family-member", vaultId, memberId) }),
        queryClient.invalidateQueries({ queryKey: accountKey("birth-profiles") }),
        queryClient.invalidateQueries({ queryKey: ["family-vault-today", vaultId] }),
      ]);
      showSuccess(isTamil ? "மாற்றங்கள் சேமிக்கப்பட்டன" : "Changes saved");
      router.back();
    } catch {
      showError(isTamil ? "சேமிக்க முடியவில்லை" : "Could not save the changes");
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!member || deleting) return;
    Haptics.selectionAsync();
    Alert.alert(
      isTamil ? `${member.displayName} நீக்கவா?` : `Remove ${member.displayName}?`,
      isTamil
        ? "இவரது ஜாதகமும் குடும்பப் பார்வையிலிருந்து இவரது விவரங்களும் நீக்கப்படும்."
        : "Their chart and their details are removed from your family views.",
      [
        { text: isTamil ? "வேண்டாம்" : "Cancel", style: "cancel" },
        {
          text: isTamil ? "நீக்கு" : "Remove",
          style: "destructive",
          onPress: () => void runDelete(),
        },
      ],
    );
  }

  async function runDelete() {
    setDeleting(true);
    try {
      await deleteFamilyMember(vaultId, memberId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["family-vault-today", vaultId] }),
        queryClient.invalidateQueries({ queryKey: accountKey("birth-profiles") }),
      ]);
      showSuccess(isTamil ? "உறுப்பினர் நீக்கப்பட்டார்" : "Member removed");
      router.back();
    } catch {
      showError(isTamil ? "நீக்க முடியவில்லை" : "Could not remove the member");
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "உறுப்பினரைத் திருத்து" : "Edit member"}
        </Text>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonCard height={120} />
          <SkeletonCard height={180} />
        </ScrollView>
      ) : isError || !member ? (
        <View style={{ padding: S.base }}>
          <ErrorCard
            onRetry={() => void refetch()}
            message={isTamil ? "உறுப்பினர் விவரம் கிடைக்கவில்லை." : "Could not load this member."}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Who */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{isTamil ? "யார்" : "Who"}</Text>
            <Text style={[styles.fieldLabel, { fontFamily: T.caption.fontFamily }]}>
              {isTamil ? "பெயர்" : "Name"}
            </Text>
            <TextInput
              style={[styles.input, { fontFamily: T.body.fontFamily }]}
              value={name}
              onChangeText={setName}
              placeholder={isTamil ? "பெயர்" : "Name"}
              placeholderTextColor={C.textTertiary}
              accessibilityLabel={isTamil ? "பெயர்" : "Name"}
            />
            <Text style={[styles.fieldLabel, { fontFamily: T.caption.fontFamily }]}>
              {isTamil ? "உறவு" : "Relationship"}
            </Text>
            <View style={styles.chipRow}>
              {FAMILY_RELATIONSHIPS.map((rel) => {
                const active = rel === relationship;
                return (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => { Haptics.selectionAsync(); setRelationship(rel); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive, { fontFamily: T.caption.fontFamily }]}>
                      {isTamil ? RELATIONSHIP_LABEL[rel].ta : RELATIONSHIP_LABEL[rel].en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Alerts for this person (F5) */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{isTamil ? "எச்சரிக்கைகள்" : "Alerts"}</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { fontFamily: T.body.fontFamily }]}>
                  {isTamil ? "இவருக்கான எச்சரிக்கைகள்" : "Alerts for this person"}
                </Text>
                <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                  {isTamil
                    ? "நாளை இவருக்கு சந்திராஷ்டமம் அல்லது பிறந்த நட்சத்திர நாள் எனில் மாலையில் ஒரு நினைவூட்டல். கட்டணமில்லை."
                    : "An evening reminder when their Chandrashtamam or birth-star day falls tomorrow. Free."}
                </Text>
                {!updatesAllowed && (
                  <Text style={[styles.help, { fontFamily: T.caption.fontFamily, color: C.saffron }]}>
                    {isTamil
                      ? "இதற்கு முதலில் “புதுப்பிப்புகள் & எச்சரிக்கைகள்” ஒப்புதல் தேவை — அறிவிப்பு அமைப்புகளில்."
                      : "Needs the “Updates & alerts” permission first — in Notification settings."}
                  </Text>
                )}
                {updatesAllowed && alertsEnabled && channelIsNone && (
                  <Text style={[styles.help, { fontFamily: T.caption.fontFamily, color: C.saffron }]}>
                    {isTamil
                      ? "இவை உங்கள் ஆப் அறிவிப்புகளில் மட்டும் தோன்றும். தொலைபேசியிலும் பெற, அறிவிப்பு அமைப்புகளில் Push அல்லது Email-ஐ இயக்கவும்."
                      : "These appear only in your in-app alerts. Turn on Push or Email in Notification settings to also get them on your phone."}
                  </Text>
                )}
              </View>
              <Switch
                value={alertsEnabled}
                // Disabled rather than silently useless: without the updates
                // consent nothing is ever sent, so an "on" switch would be a
                // promise the server cannot keep.
                disabled={!updatesAllowed}
                onValueChange={(v) => { Haptics.selectionAsync(); setAlertsEnabled(v); }}
                trackColor={{ false: C.divider, true: C.gold }}
                accessibilityLabel={isTamil ? "இவருக்கான எச்சரிக்கைகள்" : "Alerts for this person"}
              />
            </View>
          </View>

          {/* Where they live now */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{isTamil ? "இப்போது வசிக்கும் ஊர்" : "Where they live now"}</Text>
            <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
              {isTamil
                ? "தினசரி நேரங்களுக்கு மட்டும் (ராகு காலம், நல்ல நேரம்). ஜாதகம் மாறாது. காலியாக விட்டால் பிறந்த ஊரே பயன்படும்."
                : "Sets the daily timings only (Rahu Kalam, nalla neram). Does not change the chart. Left empty, the birth place is used."}
            </Text>
            <TextInput
              style={[styles.input, { fontFamily: T.body.fontFamily }]}
              value={placeQuery}
              onChangeText={(text) => { setPlaceQuery(text); setPlaceChoice(null); setPlaceCleared(false); }}
              placeholder={isTamil ? "ஊரைத் தேடுங்கள்" : "Search for a city"}
              placeholderTextColor={C.textTertiary}
              autoCorrect={false}
              accessibilityLabel={isTamil ? "இப்போது வசிக்கும் ஊர்" : "Where they live now"}
            />
            {placeLoading && <ActivityIndicator size="small" color={C.saffron} style={{ alignSelf: "flex-start" }} />}
            {suggestions.map((place) => (
              <TouchableOpacity
                key={place.geonameId}
                style={styles.suggestion}
                onPress={() => pickSuggestion(place)}
                activeOpacity={0.8}
              >
                <Text style={[styles.suggestionText, { fontFamily: T.body.fontFamily }]} numberOfLines={1}>
                  {formatPlaceLabel(place)}
                </Text>
              </TouchableOpacity>
            ))}
            {placeChoice ? (
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                {`${placeChoice.timezone} · ${placeChoice.lat.toFixed(2)}, ${placeChoice.lng.toFixed(2)}`}
              </Text>
            ) : !placeCleared && profile?.currentTimezone ? (
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>{profile.currentTimezone}</Text>
            ) : null}
            {!placeCleared && (savedPlace !== "" || placeQuery !== "") && (
              // The only way back to birth-place timings. Without it a current
              // location is a one-way door: settable, changeable, never removable.
              <TouchableOpacity onPress={clearPlace} style={styles.linkBtn}>
                <Text style={[styles.linkText, { fontFamily: T.caption.fontFamily }]}>
                  {isTamil ? "நீக்கி பிறந்த ஊரைப் பயன்படுத்து" : "Clear — use birth place"}
                </Text>
              </TouchableOpacity>
            )}
            {placeCleared && (
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                {isTamil ? "பிறந்த ஊரே பயன்படுத்தப்படும்." : "The birth place will be used."}
              </Text>
            )}
          </View>

          {/* Birth details — editable; a change here recasts the chart. */}
          {profile && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{isTamil ? "பிறந்த விவரம்" : "Birth details"}</Text>
              <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                {isTamil
                  ? "தேதி, நேரம் அல்லது இடத்தைத் திருத்தினால் ஜாதகம் மீண்டும் கணிக்கப்படும்."
                  : "Correcting the date, time or place recasts the chart."}
              </Text>
              <BirthDetailsFields
                value={birthForm}
                onChange={updateBirth}
                errors={birthErrors}
                isTamil={isTamil}
                showName={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnOff]}
            onPress={handleSave}
            disabled={!dirty || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color={C.textPrimary} />
              : <Text style={[styles.saveText, { fontFamily: T.subheading.fontFamily }]}>
                  {isTamil ? "சேமி" : "Save"}
                </Text>}
          </TouchableOpacity>

          {/* Remove */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{isTamil ? "நீக்குதல்" : "Remove"}</Text>
            <TouchableOpacity style={styles.row} onPress={confirmDelete} disabled={deleting}>
              <View style={styles.iconBox}><Trash2 size={20} color={C.alert} strokeWidth={1.5} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { fontFamily: T.body.fontFamily, color: C.alert }]}>
                  {isTamil ? "இவரை Vault-இல் இருந்து நீக்கு" : "Remove from the vault"}
                </Text>
                <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
                  {isTamil ? "இவரது ஜாதகமும் நீக்கப்படும்." : "Their chart goes with them."}
                </Text>
              </View>
              {deleting ? <ActivityIndicator size="small" color={C.alert} /> : null}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    headerTitle: { flex: 1, color: C.textPrimary },
    scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
    section: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      paddingHorizontal: S.base, paddingBottom: S.base, gap: S.xs,
    },
    sectionHeader: {
      fontFamily: EnFont.SemiBold, fontSize: 12, color: C.textTertiary,
      textTransform: "uppercase", letterSpacing: 0.6, paddingTop: S.md, paddingBottom: S.xs,
    },
    fieldLabel: { fontSize: 12, color: C.textTertiary, marginTop: S.xs },
    input: {
      minHeight: 48, borderRadius: RADIUS.button, borderWidth: 1.5, borderColor: C.divider,
      paddingHorizontal: S.md, color: C.textPrimary, fontSize: 15, backgroundColor: C.parchment,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    chip: {
      minHeight: 44, justifyContent: "center", paddingHorizontal: S.md,
      borderRadius: RADIUS.chip, borderWidth: 1.5, borderColor: C.divider,
    },
    chipActive: { borderColor: C.gold, backgroundColor: C.goldLight },
    chipText: { fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.textPrimary },
    row: { flexDirection: "row", alignItems: "center", gap: S.md, paddingVertical: S.md, minHeight: 52 },
    iconBox: { width: 28, alignItems: "center" },
    label: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    help: { fontSize: 13, lineHeight: 19, color: C.textSecond, marginTop: 2 },
    suggestion: {
      minHeight: 44, justifyContent: "center",
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    suggestionText: { fontSize: 14, color: C.textPrimary },
    linkBtn: { minHeight: 44, justifyContent: "center" },
    linkText: { fontSize: 13, color: C.saffron, textDecorationLine: "underline" },
    saveBtn: {
      minHeight: 52, borderRadius: RADIUS.button, backgroundColor: C.gold,
      alignItems: "center", justifyContent: "center",
    },
    saveBtnOff: { opacity: 0.5 },
    saveText: { color: C.textPrimary },
  });
}
