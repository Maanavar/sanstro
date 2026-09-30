"use client";

import { useState, useEffect } from "react";
import { apiFetchJson, readErrorMessage, readUserFriendlyError } from "@/lib/api";
import { formatClockLabel, formatDateLabelIn } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { BirthProfileResponse } from "@/lib/types";

interface BirthProfilesManagerProps {
  lang: Lang;
  activeProfileId?: string | null;
  onProfileSelect?: (profileId: string) => void;
  /** Opens the shared edit modal on this profile. Omitted = no Edit control. */
  onEditProfile?: (profile: BirthProfileResponse) => void;
  /** Changes after an outside save, so this list refetches rather than showing
   *  the values the reader has just changed. This component owns its own fetch,
   *  so nothing else can invalidate it. */
  reloadToken?: number;
}

export function BirthProfilesManager({ lang, activeProfileId, onProfileSelect, onEditProfile, reloadToken = 0 }: BirthProfilesManagerProps) {
  const [profiles, setProfiles] = useState<BirthProfileResponse[]>([]);

  // This component has always taken `lang` and rendered English regardless.
  // Every string it owns is bilingual now, including the ones behind `confirm()`
  // — a Tamil reader was being asked to approve a permanent deletion in a
  // language the rest of the page was not using.
  function profileScopeLabel(profile: BirthProfileResponse): string {
    if (profile.familyMemberId) return lang === "ta" ? "குடும்பத்துடன் இணைந்தது" : "Family-linked profile";
    return lang === "ta" ? "தனிப்பட்ட விவரம்" : "Standalone account profile";
  }

  function deleteWarning(profile: BirthProfileResponse): string {
    const warnings: string[] = [];
    if (profile.birthProfileId === activeProfileId) {
      warnings.push(lang === "ta"
        ? "இது உங்கள் செயலிலுள்ள விவரம் — வாழ்க்கைத் துறைகள் மற்றும் தனிப்பட்ட காட்சிகள் இதைப் பயன்படுத்துகின்றன."
        : "This is your active profile used in Life Areas and personal dashboard views.");
    }
    if (profile.familyMemberId) {
      warnings.push(lang === "ta"
        ? "இந்த விவரம் ஒரு குடும்ப உறுப்பினருடன் இணைக்கப்பட்டுள்ளது — நீக்கினால் குடும்பக் காட்சிகளிலிருந்தும் அவர் நீங்குவார்."
        : "This profile is linked to a family member, so deleting it will remove that member's profile from Family views too.");
    }
    return warnings.join(" ");
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  async function loadProfiles() {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetchJson<{
        data: BirthProfileResponse[];
        meta: { calculationVersion: string; generatedAt: string };
      }>("/api/v1/birth-profiles");
      setProfiles(response.data || []);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile(profile: BirthProfileResponse) {
    const warning = deleteWarning(profile);
    const message = warning
      ? `Are you sure you want to delete this birth profile? This action cannot be undone.\n\n${warning}`
      : "Are you sure you want to delete this birth profile? This action cannot be undone.";
    if (!confirm(message)) {
      return;
    }

    try {
      setDeleting(profile.birthProfileId);
      await apiFetchJson(`/api/v1/birth-profiles/${profile.birthProfileId}`, { method: "DELETE" });
      setProfiles(profiles.filter((p) => p.birthProfileId !== profile.birthProfileId));
    } catch (err) {
      const errorInfo = readUserFriendlyError(err);
      setError(lang === "ta"
        ? `விவரத்தை நீக்க முடியவில்லை: ${errorInfo.message}`
        : `Failed to delete profile: ${errorInfo.message}`);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
        <p>{lang === "ta" ? "பிறப்பு விவரங்கள் ஏற்றுகிறது…" : "Loading your birth profiles…"}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--space-4)", color: "var(--color-low)" }}>
        <p>{error}</p>
        <button onClick={loadProfiles} style={{ marginTop: "var(--space-2)" }}>
          {lang === "ta" ? "மீண்டும் முயல்" : "Try Again"}
        </button>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-muted)" }}>
        <p>{lang === "ta" ? "இதுவரை பிறப்பு விவரம் இல்லை. தொடங்க முதல் விவரத்தை உருவாக்குங்கள்." : "No birth profiles yet. Create your first profile to get started."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <h3 style={{ marginBottom: "var(--space-3)" }}>
        {lang === "ta" ? `உங்கள் பிறப்பு விவரங்கள் (${profiles.length}/10)` : `Your Birth Profiles (${profiles.length}/10)`}
      </h3>

      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {profiles.map((profile) => (
          <div
            key={profile.birthProfileId}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-base)",
              padding: "var(--space-3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>
                {profile.displayName}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                {lang === "ta" ? "பிறந்தது: " : "Born: "}{formatDateLabelIn(profile.birthDateLocal, lang)}
                {profile.birthTimeLocal ? ` · ${formatClockLabel(profile.birthTimeLocal, lang)}` : ""}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                {profile.birthPlace}
              </p>
              {/* Which place the DAILY timings come from. Shown because it is
                  invisible otherwise — it silently falls back to the birth
                  place, and a reader had no way to tell the fallback from a
                  deliberate choice without opening the editor. */}
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                {lang === "ta" ? "தினசரி நேரங்கள்: " : "Daily timings: "}
                {profile.currentPlace
                  ? profile.currentPlace
                  : `${profile.birthPlace}${lang === "ta" ? " (பிறந்த ஊர்)" : " (birth place)"}`}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "var(--space-1)" }}>
                {profileScopeLabel(profile)}
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", marginLeft: "var(--space-3)" }}>
              {onProfileSelect && (
                <button
                  onClick={() => onProfileSelect(profile.birthProfileId)}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-base)",
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  {lang === "ta" ? "தேர்வு" : "Select"}
                </button>
              )}

              {onEditProfile && (
                <button
                  onClick={() => onEditProfile(profile)}
                  aria-label={lang === "ta" ? `${profile.displayName} விவரம் திருத்து` : `Edit ${profile.displayName}'s details`}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-base)",
                    border: "1px solid var(--color-border-strong)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  {lang === "ta" ? "திருத்து" : "Edit"}
                </button>
              )}

              <button
                onClick={() => deleteProfile(profile)}
                disabled={deleting === profile.birthProfileId}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-base)",
                  border: "1px solid var(--color-low-border)",
                  background: "transparent",
                  color: "var(--color-low)",
                  cursor: deleting === profile.birthProfileId ? "wait" : "pointer",
                  fontSize: "0.875rem",
                  opacity: deleting === profile.birthProfileId ? 0.6 : 1,
                }}
              >
                {deleting === profile.birthProfileId
                  ? (lang === "ta" ? "நீக்குகிறது…" : "Deleting…")
                  : (lang === "ta" ? "நீக்கு" : "Delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "var(--space-4)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-base)",
          background: "var(--color-surface-faint)",
          fontSize: "0.875rem",
          color: "var(--color-muted)",
        }}
      >
        <p>
          <strong>{lang === "ta" ? "இங்கு என்ன தெரிகிறது:" : "What shows here:"}</strong>{" "}
          {lang === "ta"
            ? "இந்தக் கணக்கில் சேமித்த ஒவ்வொரு பிறப்பு விவரமும் இங்கே உள்ளது. குடும்பப் பகுதி குடும்பத்துடன் இணைந்தவற்றை மட்டுமே பயன்படுத்தும்; வாழ்க்கைத் துறைகள் உங்கள் செயலிலுள்ள முதன்மை விவரத்தைப் பயன்படுத்தும்."
            : "This list includes every saved birth profile on this account. Family uses only family-linked profiles, and Life Areas uses your currently active primary profile."}
        </p>
        <p>
          <strong>{lang === "ta" ? "வரம்பு:" : "Profile Limit:"}</strong>{" "}
          {lang === "ta"
            ? "அதிகபட்சம் 10 பிறப்பு விவரங்கள். புதியவற்றுக்கு இடம் தேவைப்பட்டால் தேவையற்றவற்றை நீக்குங்கள்."
            : "You can create up to 10 birth profiles. Delete profiles you no longer need to make room for new ones."}
        </p>
      </div>
    </div>
  );
}

