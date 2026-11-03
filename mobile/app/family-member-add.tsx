import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/context/ToastContext";
import { BirthDetailsFields } from "@/components/BirthDetailsFields";
import {
  buildBirthDetailsPayload,
  emptyBirthDetailsForm,
  hasBirthErrors,
  validateBirthDetails,
  type BirthDetailsFormState,
  type BirthFormErrors,
} from "@/lib/birthDetailsForm";
import { addFamilyMember } from "@/api/familyVault";
import { ApiError } from "@/api/client";
import { accountKey } from "@/lib/queryKeys";
import { FAMILY_RELATIONSHIPS, defaultWeightFor, type FamilyRelationship } from "@vinaadi/shared/familyMember";

/**
 * Add a family member — the first mobile surface that creates one, and so the
 * first that needs the whole birth-input block (name, DOB, gender, time, place).
 * The block is `<BirthDetailsFields>`, shared with the member-edit screen; the
 * server casts the chart from the same `FamilyMemberCreate` payload the web
 * "Add member" form posts.
 *
 * A member is never "self" — that is the owner's own profile — so the owner
 * relationship is left out of the picker.
 */

// Everyone but "self": the owner is not a member of their own vault.
const ADDABLE_RELATIONSHIPS = FAMILY_RELATIONSHIPS.filter((r) => r !== "self");

const RELATIONSHIP_LABEL: Record<FamilyRelationship, { ta: string; en: string }> = {
  self: { ta: "தான்", en: "Self" },
  spouse: { ta: "துணைவர்", en: "Spouse" },
  child: { ta: "குழந்தை", en: "Child" },
  parent: { ta: "பெற்றோர்", en: "Parent" },
  sibling: { ta: "உடன்பிறந்தவர்", en: "Sibling" },
  grandparent: { ta: "தாத்தா / பாட்டி", en: "Grandparent" },
  other: { ta: "மற்றவர்", en: "Other" },
};

export default function FamilyMemberAddScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ vaultId?: string }>();
  const vaultId = typeof params.vaultId === "string" ? params.vaultId : "";

  const [relationship, setRelationship] = useState<FamilyRelationship>("spouse");
  const [form, setForm] = useState<BirthDetailsFormState>(emptyBirthDetailsForm);
  const [errors, setErrors] = useState<BirthFormErrors>({});
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<BirthDetailsFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    if (saving || !vaultId) return;
    const found = validateBirthDetails(form, { requireName: true });
    setErrors(found);
    if (hasBirthErrors(found)) return;
    Haptics.selectionAsync();
    setSaving(true);
    try {
      await addFamilyMember(vaultId, {
        relationshipToOwner: relationship,
        memberWeight: defaultWeightFor(relationship),
        calculateNow: true,
        ...buildBirthDetailsPayload(form),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["family-vault-today", vaultId] }),
        queryClient.invalidateQueries({ queryKey: accountKey("family-vaults") }),
        queryClient.invalidateQueries({ queryKey: accountKey("birth-profiles") }),
      ]);
      showSuccess(
        isTamil ? `${form.displayName.trim()} சேர்க்கப்பட்டார்` : `${form.displayName.trim()} added`,
      );
      router.back();
    } catch (err) {
      // Surface the server's own message for the cases a reader can act on —
      // chiefly the tier member-cap ("Family Vault limit reached …") and a
      // duplicate — rather than a generic failure.
      const message =
        err instanceof ApiError
          ? err.getUserMessage()
          : isTamil
            ? "சேர்க்க முடியவில்லை"
            : "Could not add the member";
      showError(message);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "உறுப்பினரைச் சேர்" : "Add member"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Relationship */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isTamil ? "உறவு" : "Relationship"}</Text>
          <View style={styles.chipRow}>
            {ADDABLE_RELATIONSHIPS.map((rel) => {
              const active = rel === relationship;
              return (
                <TouchableOpacity
                  key={rel}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRelationship(rel);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive, { fontFamily: T.caption.fontFamily }]}>
                    {isTamil ? RELATIONSHIP_LABEL[rel].ta : RELATIONSHIP_LABEL[rel].en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Birth details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{isTamil ? "பிறந்த விவரம்" : "Birth details"}</Text>
          <BirthDetailsFields value={form} onChange={update} errors={errors} isTamil={isTamil} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnOff]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={C.surface} />
          ) : (
            <Text style={[styles.saveText, { fontFamily: T.subheading.fontFamily }]}>
              {isTamil ? "ஜாதகம் உருவாக்கு" : "Add & create chart"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.footnote, { fontFamily: T.caption.fontFamily }]}>
          {isTamil
            ? "இவரது ஜாதகம் இப்போதே கணிக்கப்படும்."
            : "Their chart is calculated right away."}
        </Text>
      </ScrollView>
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
    headerTitle: { flex: 1, color: C.textPrimary },
    scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
    section: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.card,
      paddingHorizontal: S.base,
      paddingBottom: S.base,
      gap: S.xs,
    },
    sectionHeader: {
      fontFamily: EnFont.SemiBold,
      fontSize: 12,
      color: C.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingTop: S.md,
      paddingBottom: S.xs,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    chip: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: S.md,
      borderRadius: RADIUS.chip,
      borderWidth: 1.5,
      borderColor: C.divider,
    },
    chipActive: { borderColor: C.gold, backgroundColor: C.goldLight },
    chipText: { fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.textPrimary },
    saveBtn: {
      minHeight: 52,
      borderRadius: RADIUS.button,
      backgroundColor: C.saffron,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnOff: { opacity: 0.5 },
    saveText: { color: C.surface },
    footnote: { color: C.textTertiary, textAlign: "center" },
  });
}
