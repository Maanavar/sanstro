"use client";

import type React from "react";
import { useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { isBirthDateWithinBounds } from "@/lib/birth-date";
import type { Tab } from "@/lib/dashboard-tabs";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { parseLatitude, parseLongitude } from "@/lib/validation";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  BirthProfileResponse,
  FamilyAggregateMember,
  FamilyVaultListItem,
} from "@/lib/types";
import type { useFamilyData } from "@/hooks/useFamilyData";
import type { usePersonalData } from "@/hooks/usePersonalData";

import type { EditMemberState } from "./dashboard-edit-member-modal";
import type { ConfirmDialogState } from "./modal-shell";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self: "1.00", spouse: "1.00", child: "0.75",
  parent: "1.15", sibling: "0.75", grandparent: "1.15", other: "1.00",
};

export type BirthFormState = {
  ownerUserId: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
  relationshipToOwner: Relationship;
  calculateNow: boolean;
  maritalStatus: string;
  employmentType: string;
  children: string;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

export type MemberFormState = {
  displayName: string;
  relationshipToOwner: Relationship;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  currentPlace: string;
  currentLatitude: string;
  currentLongitude: string;
  currentTimezone: string;
  memberWeight: string;
  calculateNow: boolean;
  birthTimeSource: string;
  birthTimeConfidenceMinutes: string;
};

const defaultBirthForm: BirthFormState = {
  ownerUserId: "", displayName: "", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
  currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "",
  relationshipToOwner: "self", calculateNow: true,
  maritalStatus: "", employmentType: "", children: "",
  birthTimeSource: "unknown", birthTimeConfidenceMinutes: "0",
};

const defaultMemberForm: MemberFormState = {
  displayName: "", relationshipToOwner: "spouse", birthDateLocal: "", birthTimeLocal: "",
  birthPlace: "", birthLatitude: "", birthLongitude: "", birthTimezone: "",
  currentPlace: "", currentLatitude: "", currentLongitude: "", currentTimezone: "",
  memberWeight: RELATIONSHIP_WEIGHTS.spouse, calculateNow: true,
  birthTimeSource: "unknown", birthTimeConfidenceMinutes: "0",
};

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type ProfileFormsInput = {
  lang: Lang;
  selectedDate: string;
  ownerUserId: string;
  setOwnerUserId: (ownerUserId: string) => void;
  personal: Pick<
    ReturnType<typeof usePersonalData>,
    "birthProfileId" | "setBirthProfileId" | "setChartId" | "refreshPersonalBundle"
  >;
  family: Pick<
    ReturnType<typeof useFamilyData>,
    | "selectedVaultId" | "setSelectedVaultId" | "loadVaults" | "refreshFamilyBundle" | "memberCharts"
    | "familyMembers" | "setFamilyDetail" | "setFamilyAggregate" | "setFamilyComposite"
  >;
  signOut: () => void;
  setStatus: (text: string, tone?: "success" | "error") => void;
  showToast: (message: string, tone?: "success" | "error") => void;
  setActiveTab: (tab: Tab) => void;
  setConfirmDialog: (state: ConfirmDialogState | null) => void;
};

/**
 * The reader's profile and family-membership drafts, their validation and
 * busy flags, and every create / edit / delete with the refreshes it owes.
 * The panes and modals that render them stay with the workspace.
 */
export function useProfileForms({
  lang, selectedDate, ownerUserId, setOwnerUserId, personal, family, signOut,
  setStatus, showToast, setActiveTab, setConfirmDialog,
}: ProfileFormsInput) {
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  // Bumped after a successful save so BirthProfilesManager, which owns its own
  // fetch, reloads instead of showing the values the reader just changed.
  const [birthProfilesReloadToken, setBirthProfilesReloadToken] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [busyCreateProfile, setBusyCreateProfile] = useState(false);
  const [busyAddMember, setBusyAddMember] = useState(false);
  const [busyEditingMember, setBusyEditingMember] = useState(false);
  const [busyEditingProfile, setBusyEditingProfile] = useState(false);
  const [deletingVaultId, setDeletingVaultId] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState("");

  // ── Form validation ───────────────────────────────────────

  function validateBirthForm(form: BirthFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.birthDateLocal = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.birthDateLocal = t("err_date_out_of_range", lang);
    }
    if (!form.birthPlace.trim()) errors.birthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.birthTimezone = t("err_tz_required", lang);
    // parseLatitude/parseLongitude, not truthiness — a coordinate of exactly 0
    // (equator/prime meridian) is valid (DASH-03).
    if (parseLatitude(form.birthLatitude) === null) errors.birthLatitude = t("err_lat_required", lang);
    if (parseLongitude(form.birthLongitude) === null) errors.birthLongitude = t("err_lng_required", lang);
    return errors;
  }

  function validateMemberForm(form: MemberFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.memberDisplayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.memberBirthDate = t("err_date_required", lang);
    else if (!isBirthDateWithinBounds(form.birthDateLocal)) {
      errors.memberBirthDate = t("err_date_out_of_range", lang);
    }
    if (!form.birthPlace.trim()) errors.memberBirthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.memberTimezone = t("err_tz_required", lang);
    return errors;
  }

  // ── Form handlers ─────────────────────────────────────────

  async function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateBirthForm(birthForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusyCreateProfile(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
        method: "POST",
        body: JSON.stringify({
          ownerUserId: birthForm.ownerUserId || undefined,
          relationshipToOwner: birthForm.relationshipToOwner,
          displayName: birthForm.displayName,
          birthDateLocal: birthForm.birthDateLocal,
          birthTimeLocal: birthForm.birthTimeLocal || undefined,
          birthPlace: birthForm.birthPlace,
          birthLatitude: parseNumber(birthForm.birthLatitude),
          birthLongitude: parseNumber(birthForm.birthLongitude),
          birthTimezone: birthForm.birthTimezone,
          currentPlace: birthForm.currentPlace || undefined,
          currentLatitude: birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
          currentLongitude: birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
          currentTimezone: birthForm.currentTimezone || undefined,
          calculateNow: birthForm.calculateNow,
          maritalStatus: birthForm.maritalStatus || undefined,
          employmentType: birthForm.employmentType || undefined,
          children: birthForm.children || undefined,
          birthTimeSource: birthForm.birthTimeSource || undefined,
          birthTimeConfidenceMinutes: birthForm.birthTimeConfidenceMinutes
            ? parseInt(birthForm.birthTimeConfidenceMinutes, 10)
            : undefined,
        }),
      });
      personal.setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) personal.setChartId(response.data.chartId);
      showToast(`${birthForm.displayName} – ${t("toast_profile_created", lang)}`);
      setStatus(`Profile created – ${response.data.birthProfileId.slice(0, 8)}`);
      // A calculated chart lands on Family & Charts, not Today — that tab
      // opens on "Your chart in two/five minutes" (dashboard-family-charts-
      // hybrid.tsx), the plain-language reading, above every score and table
      // on the page. Today is a live dashboard built for a returning reader;
      // shown first, it is the jargon wall neither persona has context for
      // yet. `calculateNow` can be turned off (deferred to rectification), in
      // which case there is no reading yet and Today — which still finishes
      // the rest of onboarding — is the more useful landing.
      setActiveTab(response.data.chartId ? "family" : "personal");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyCreateProfile(false); }
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateMemberForm(memberForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusyAddMember(true);
    try {
      // T19: a family space is useful only once there is someone else to add.
      // Do not make its creation a second onboarding gate; create it on the
      // first member submission and keep the person moving toward a result.
      let targetVaultId = family.selectedVaultId;
      if (!targetVaultId) {
        const vaultResponse = await apiFetchJson<ApiEnvelope<{
          familyVaultId: string; ownerUserId: string;
        }>>(
          "/api/v1/family-vaults",
          {
            method: "POST",
            body: JSON.stringify({
              ownerUserId: ownerUserId || undefined,
              name: lang === "ta" ? "உங்கள் குடும்பம்" : "Your family",
              defaultLanguage: "ta-en",
            }),
          },
        );
        targetVaultId = vaultResponse.data.familyVaultId;
        setOwnerUserId(vaultResponse.data.ownerUserId);
        family.setSelectedVaultId(targetVaultId);
        await family.loadVaults(vaultResponse.data.ownerUserId);
      }
      const response = await apiFetchJson<ApiEnvelope<{ familyMemberId: string; displayName: string }>>(
        `/api/v1/family-vaults/${targetVaultId}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            ownerUserId, familyVaultId: targetVaultId,
            relationshipToOwner: memberForm.relationshipToOwner,
            displayName: memberForm.displayName,
            birthDateLocal: memberForm.birthDateLocal,
            birthTimeLocal: memberForm.birthTimeLocal,
            birthPlace: memberForm.birthPlace,
            birthLatitude: parseNumber(memberForm.birthLatitude),
            birthLongitude: parseNumber(memberForm.birthLongitude),
            birthTimezone: memberForm.birthTimezone,
            currentPlace: memberForm.currentPlace || undefined,
            currentLatitude: memberForm.currentLatitude ? parseNumber(memberForm.currentLatitude) : undefined,
            currentLongitude: memberForm.currentLongitude ? parseNumber(memberForm.currentLongitude) : undefined,
            currentTimezone: memberForm.currentTimezone || undefined,
            calculateNow: memberForm.calculateNow,
            memberWeight: parseNumber(memberForm.memberWeight, 1),
            birthTimeSource: memberForm.birthTimeSource || undefined,
            birthTimeConfidenceMinutes: memberForm.birthTimeConfidenceMinutes
              ? parseInt(memberForm.birthTimeConfidenceMinutes, 10)
              : undefined,
          }),
        }
      );
      showToast(`${response.data.displayName} added to your family.`);
      setStatus(`${response.data.displayName} added to your family.`);
      setMemberForm(defaultMemberForm);
      await family.loadVaults(ownerUserId);
      await family.refreshFamilyBundle(targetVaultId, selectedDate);
      setActiveTab("personal");
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyAddMember(false); }
  }

  async function handleSaveEdit() {
    if (!editMember) return;
    setBusyEditingMember(true);
    try {
      // Birth fields: `|| undefined` omits an empty one, which the API reads as
      // "leave alone" — right, because none of them is nullable on a saved
      // profile.
      //
      // Current location is the opposite case and must NOT use `|| undefined`:
      // "" is the sentinel that clears it back to the birth place, and omitting
      // it made the field a one-way door. The four move together — a place
      // without coordinates is not a location.
      const clearingCurrent = !editMember.currentPlace;
      const body = {
        displayName: editMember.displayName,
        birthDateLocal: editMember.birthDateLocal || undefined,
        birthTimeLocal: editMember.birthTimeLocal || undefined,
        birthPlace: editMember.birthPlace || undefined,
        birthLatitude: editMember.birthLatitude ? parseNumber(editMember.birthLatitude) : undefined,
        birthLongitude: editMember.birthLongitude ? parseNumber(editMember.birthLongitude) : undefined,
        birthTimezone: editMember.birthTimezone || undefined,
        currentPlace: editMember.currentPlace,
        currentLatitude: clearingCurrent || !editMember.currentLatitude ? undefined : parseNumber(editMember.currentLatitude),
        currentLongitude: clearingCurrent || !editMember.currentLongitude ? undefined : parseNumber(editMember.currentLongitude),
        currentTimezone: clearingCurrent ? undefined : (editMember.currentTimezone || undefined),
        recalculate: true,
      };
      const url = editMember.scope === "member"
        ? `/api/v1/family-vaults/${editMember.familyVaultId}/members/${editMember.memberId}`
        : `/api/v1/birth-profiles/${editMember.birthProfileId}`;
      await apiFetchJson<unknown>(url, {
        method: "PATCH",
        body: JSON.stringify(
          editMember.scope === "member"
            ? { ...body, relationshipToOwner: editMember.relationshipToOwner, memberWeight: parseNumber(editMember.memberWeight, 1) }
            : body,
        ),
      });
      showToast(`${editMember.displayName} updated.`);
      setStatus(`${editMember.displayName} updated.`);
      setEditMember(null);
      // Both scopes can touch a family-linked profile, and a profile edit can
      // change the name and DOB the family views read, so refresh either way.
      setBirthProfilesReloadToken((n) => n + 1);
      if (family.selectedVaultId) {
        await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
      }
      // A profile edit can be the owner's own, and it may have recalculated the
      // chart, so the personal bundle has to be refetched rather than reused.
      if (editMember.scope === "profile" && editMember.birthProfileId === personal.birthProfileId) {
        await personal.refreshPersonalBundle(personal.birthProfileId, selectedDate, true, { forceChart: true, forceDay: true });
      }
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error"); setStatus(msg, "error");
    } finally { setBusyEditingMember(false); }
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyEditingProfile(true);
    try {
      const existingId = personal.birthProfileId;
      if (existingId) {
        // Update existing profile — never create a duplicate
        const updated = await apiFetchJson<ApiEnvelope<{ data: BirthProfileCreateResponseData }>>(`/api/v1/birth-profiles/${existingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            displayName: birthForm.displayName,
            birthDateLocal: birthForm.birthDateLocal,
            birthTimeLocal: birthForm.birthTimeLocal,
            birthPlace: birthForm.birthPlace,
            birthLatitude: parseNumber(birthForm.birthLatitude),
            birthLongitude: parseNumber(birthForm.birthLongitude),
            birthTimezone: birthForm.birthTimezone,
            // "" is the clear sentinel, so this one is sent as-is rather than
            // `|| undefined` — omitting it means "leave alone", which made the
            // owner's own current location unremovable once set.
            currentPlace: birthForm.currentPlace,
            currentLatitude: birthForm.currentPlace && birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
            currentLongitude: birthForm.currentPlace && birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
            currentTimezone: birthForm.currentPlace ? (birthForm.currentTimezone || undefined) : undefined,
            maritalStatus: birthForm.maritalStatus || undefined,
            employmentType: birthForm.employmentType || undefined,
            children: birthForm.children || undefined,
            recalculate: true,
          }),
        });
        const profileId = (updated as any).data?.birthProfileId ?? existingId;
        const chartId = (updated as any).data?.chartId;
        if (chartId) personal.setChartId(chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile updated.`);
        // Profile edits change the chart — this is the one path that must
        // bypass the session-cached /charts/calculate result (DASH-04).
        await personal.refreshPersonalBundle(profileId, selectedDate, true, { forceChart: true, forceDay: true });
      } else {
        // First-time creation
        const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
          method: "POST",
          body: JSON.stringify({
            ownerUserId: birthForm.ownerUserId || undefined,
            relationshipToOwner: birthForm.relationshipToOwner,
            displayName: birthForm.displayName,
            birthDateLocal: birthForm.birthDateLocal,
            birthTimeLocal: birthForm.birthTimeLocal,
            birthPlace: birthForm.birthPlace,
            birthLatitude: parseNumber(birthForm.birthLatitude),
            birthLongitude: parseNumber(birthForm.birthLongitude),
            birthTimezone: birthForm.birthTimezone,
            currentPlace: birthForm.currentPlace || undefined,
            currentLatitude: birthForm.currentLatitude ? parseNumber(birthForm.currentLatitude) : undefined,
            currentLongitude: birthForm.currentLongitude ? parseNumber(birthForm.currentLongitude) : undefined,
            currentTimezone: birthForm.currentTimezone || undefined,
            calculateNow: true,
            maritalStatus: birthForm.maritalStatus || undefined,
            employmentType: birthForm.employmentType || undefined,
            children: birthForm.children || undefined,
          }),
        });
        personal.setBirthProfileId(response.data.birthProfileId);
        if (response.data.chartId) personal.setChartId(response.data.chartId);
        setShowEditProfile(false);
        showToast(`${birthForm.displayName} profile created.`);
        await personal.refreshPersonalBundle(response.data.birthProfileId, selectedDate, true, { forceChart: true, forceDay: true });
      }
    } catch (error) {
      const msg = getFriendlyErrorMessage(error);
      showToast(msg, "error");
    } finally { setBusyEditingProfile(false); }
  }

  // The three destructive flows below confirm through the in-design
  // ConfirmDialog (bilingual, destructive-styled) instead of browser
  // confirm() popups (DASH-05). Vault deletion — the most destructive —
  // additionally requires typing the vault name.

  function handleDeleteProfile() {
    const existingId = personal.birthProfileId;
    if (!existingId) return;
    const name = birthForm.displayName || (lang === "ta" ? "இந்த ஜாதகம்" : "this profile");
    setConfirmDialog({
      title: t("btn_delete_profile", lang),
      body: t("confirm_delete_profile_body", lang).replace("%s", name),
      confirmLabel: t("btn_delete_profile", lang),
      onConfirm: () => {
        setBusyEditingProfile(true);
        void apiFetchJson<unknown>(`/api/v1/birth-profiles/${existingId}`, { method: "DELETE" })
          .then(() => {
            // Sign out and redirect — user must not stay on the dashboard
            // after deleting their profile.
            signOut();
          })
          .catch((error) => {
            showToast(getFriendlyErrorMessage(error), "error");
            setBusyEditingProfile(false);
          });
      },
    });
  }

  function handleDeleteMember(memberId: string, displayName: string) {
    setConfirmDialog({
      title: `${t("btn_remove", lang)} — ${displayName}`,
      body: t("confirm_remove_member", lang),
      confirmLabel: t("btn_remove", lang),
      onConfirm: () => {
        setDeletingMemberId(memberId);
        void (async () => {
          try {
            await apiFetchJson<unknown>(`/api/v1/family-vaults/${family.selectedVaultId}/members/${memberId}`, { method: "DELETE" });
            const removedMsg = t("toast_member_removed", lang).replace("%s", displayName);
            showToast(removedMsg);
            setStatus(removedMsg);
            await family.loadVaults(ownerUserId);
            await family.refreshFamilyBundle(family.selectedVaultId, selectedDate);
          } catch (error) {
            const msg = getFriendlyErrorMessage(error);
            showToast(msg, "error"); setStatus(msg, "error");
          } finally {
            setDeletingMemberId("");
          }
        })();
      },
    });
  }

  function handleDeleteVault(vaultId: string, vaultName: string) {
    setConfirmDialog({
      title: `${t("btn_delete", lang)} — ${vaultName}`,
      body: t("confirm_delete_vault", lang),
      confirmLabel: t("btn_delete", lang),
      typeToConfirm: vaultName,
      onConfirm: () => {
        setDeletingVaultId(vaultId);
        void (async () => {
          try {
            await apiFetchJson<unknown>(`/api/v1/family-vaults/${vaultId}`, { method: "DELETE" });
            const deletedMsg = t("toast_vault_deleted", lang).replace("%s", vaultName);
            showToast(deletedMsg);
            setStatus(deletedMsg);
            if (family.selectedVaultId === vaultId) {
              family.setSelectedVaultId("");
              family.setFamilyDetail(null);
              family.setFamilyAggregate(null);
              family.setFamilyComposite(null);
            }
            await family.loadVaults(ownerUserId);
          } catch (error) {
            const msg = getFriendlyErrorMessage(error);
            showToast(msg, "error"); setStatus(msg, "error");
          } finally {
            setDeletingVaultId("");
          }
        })();
      },
    });
  }

  function handleSelectVault(item: FamilyVaultListItem) {
    family.setSelectedVaultId(item.familyVaultId);
    setOwnerUserId(item.ownerUserId);
    setBirthForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
  }

  function handleEditFamilyMember(member: FamilyAggregateMember) {
    const mc = family.memberCharts.find((x) => x.memberId === member.familyMemberId);
    const bp = mc?.chart.birthProfile;
    // Guard: member charts may still be loading — don't open with empty fields
    if (!bp) return;
    // Relationship and weight are columns on the FamilyMember row, so they are
    // read from the vault's own member list — NOT from `bp`. `chart.birthProfile`
    // carries a `relationshipToOwner` that the backend cannot populate for a
    // persisted profile (the column is not on that table); it reported "self"
    // for everyone, this modal PATCHed that back over the real relationship,
    // and a member tagged "self" is then excluded from `memberCharts`, which
    // empties the member picker on every tab. Seeded from the truth here so the
    // save is a no-op when the reader does not touch the dropdown.
    const row = family.familyMembers.find((fm) => fm.familyMemberId === member.familyMemberId);
    setEditMember({
      scope: "member",
      birthProfileId: bp.birthProfileId,
      familyVaultId: family.selectedVaultId,
      memberId: member.familyMemberId,
      displayName: member.displayName,
      relationshipToOwner: (row?.relationshipToOwner as Relationship) ?? "other",
      memberWeight: member.memberWeight.toFixed(2),
      birthDateLocal: bp.birthDateLocal ?? "",
      birthTimeLocal: bp.birthTimeLocal ?? "",
      birthPlace: bp.birthPlace ?? "",
      birthLatitude: bp.birthLatitude?.toString() ?? "",
      birthLongitude: bp.birthLongitude?.toString() ?? "",
      birthTimezone: bp.birthTimezone ?? "",
      currentPlace: bp.currentPlace ?? "",
      currentLatitude: bp.currentLatitude?.toString() ?? "",
      currentLongitude: bp.currentLongitude?.toString() ?? "",
      currentTimezone: bp.currentTimezone ?? "",
    });
  }

  /** Open the editor on a bare birth profile, from Setup -> all birth profiles.
   *
   *  Deliberately routed to /birth-profiles even for a family-linked profile,
   *  rather than to the member endpoint: this list edits birth DATA, and
   *  relationship/weight are membership facts that belong to the Family surface
   *  where the rest of the vault is visible. The backend mirrors display name
   *  and date of birth back onto the FamilyMember row, so the family views stay
   *  correct either way. */
  function handleEditBirthProfile(profile: BirthProfileResponse) {
    setEditMember({
      scope: "profile",
      birthProfileId: profile.birthProfileId,
      familyVaultId: "",
      memberId: "",
      displayName: profile.displayName,
      relationshipToOwner: (profile.relationshipToOwner as Relationship) ?? "other",
      memberWeight: "1.00",
      birthDateLocal: profile.birthDateLocal ?? "",
      birthTimeLocal: profile.birthTimeLocal ?? "",
      birthPlace: profile.birthPlace ?? "",
      birthLatitude: profile.birthLatitude?.toString() ?? "",
      birthLongitude: profile.birthLongitude?.toString() ?? "",
      birthTimezone: profile.birthTimezone ?? "",
      currentPlace: profile.currentPlace ?? "",
      currentLatitude: profile.currentLatitude?.toString() ?? "",
      currentLongitude: profile.currentLongitude?.toString() ?? "",
      currentTimezone: profile.currentTimezone ?? "",
    });
  }

  return {
    birthForm, setBirthForm, memberForm, setMemberForm, editMember, setEditMember,
    birthProfilesReloadToken, showEditProfile, setShowEditProfile, formErrors, setFormErrors,
    busyCreateProfile, busyAddMember, busyEditingMember, busyEditingProfile, deletingVaultId, deletingMemberId,
    handleCreateProfile, handleAddMember, handleSaveEdit, handleSaveProfile, handleDeleteProfile,
    handleDeleteMember, handleDeleteVault, handleSelectVault, handleEditFamilyMember, handleEditBirthProfile,
  };
}
