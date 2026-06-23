"use client";

import { useState, useEffect } from "react";
import { apiFetchJson, readErrorMessage, readUserFriendlyError } from "@/lib/api";
import { formatDateLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { BirthProfileResponse } from "@/lib/types";

interface BirthProfilesManagerProps {
  lang: Lang;
  activeProfileId?: string | null;
  onProfileSelect?: (profileId: string) => void;
}

export function BirthProfilesManager({ lang, activeProfileId, onProfileSelect }: BirthProfilesManagerProps) {
  const [profiles, setProfiles] = useState<BirthProfileResponse[]>([]);

  function profileScopeLabel(profile: BirthProfileResponse): string {
    return profile.familyMemberId ? "Family-linked profile" : "Standalone account profile";
  }

  function deleteWarning(profile: BirthProfileResponse): string {
    const warnings: string[] = [];
    if (profile.birthProfileId === activeProfileId) {
      warnings.push("This is your active profile used in Life Areas and personal dashboard views.");
    }
    if (profile.familyMemberId) {
      warnings.push("This profile is linked to a Family Vault member, so deleting it will remove that member's profile from Family views too.");
    }
    return warnings.join(" ");
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

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
      setError(`Failed to delete profile: ${errorInfo.message}`);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
        <p>Loading your birth profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--space-4)", color: "#c62e2e" }}>
        <p>{error}</p>
        <button onClick={loadProfiles} style={{ marginTop: "var(--space-2)" }}>
          Try Again
        </button>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-muted)" }}>
        <p>No birth profiles yet. Create your first profile to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <h3 style={{ marginBottom: "var(--space-3)" }}>
        Your Birth Profiles ({profiles.length}/10)
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
                Born: {formatDateLabel(profile.birthDateLocal)}
                {profile.birthTimeLocal && ` at ${profile.birthTimeLocal}`}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                {profile.birthPlace}
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
                  Select
                </button>
              )}

              <button
                onClick={() => deleteProfile(profile)}
                disabled={deleting === profile.birthProfileId}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-base)",
                  border: "1px solid #c62e2e",
                  background: "transparent",
                  color: "#c62e2e",
                  cursor: deleting === profile.birthProfileId ? "wait" : "pointer",
                  fontSize: "0.875rem",
                  opacity: deleting === profile.birthProfileId ? 0.6 : 1,
                }}
              >
                {deleting === profile.birthProfileId ? "Deleting..." : "Delete"}
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
          <strong>What shows here:</strong> This list includes every saved birth profile on this account. Family uses only family-linked profiles, and Life Areas uses your currently active primary profile.
        </p>
        <p>
          <strong>Profile Limit:</strong> You can create up to 10 birth profiles. Delete profiles you no longer need to make
          room for new ones.
        </p>
      </div>
    </div>
  );
}

