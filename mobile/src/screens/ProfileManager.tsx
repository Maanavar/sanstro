import { useState, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiGet, apiDelete } from "@/api/client";
import type { BirthProfileResponse } from "@/lib/types";
import { clearPrimarySelection, getPrimaryProfileId } from "@/lib/userPrefs";

interface ProfileManagerScreenProps {
  onProfileSelect?: (profileId: string) => void;
}

export function ProfileManagerScreen({ onProfileSelect }: ProfileManagerScreenProps) {
  const C = useColors();
  const { showError } = useToast();
  const confirm = useConfirm();
  const [profiles, setProfiles] = useState<BirthProfileResponse[]>([]);
  const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);

  function profileScopeLabel(profile: BirthProfileResponse): string {
    return profile.familyMemberId ? "Family-linked profile" : "Standalone account profile";
  }

  function deleteWarning(profile: BirthProfileResponse): string | null {
    const warnings: string[] = [];
    if (profile.birthProfileId === primaryProfileId) {
      warnings.push("This is your active profile used in Life Areas and personal dashboard views.");
    }
    if (profile.familyMemberId) {
      warnings.push("This profile is linked to a Family Vault member, so deleting it will remove that member's profile from Family views too.");
    }
    return warnings.length > 0 ? warnings.join(" ") : null;
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
    getPrimaryProfileId().then(setPrimaryProfileId);
  }, []);

  async function loadProfiles() {
    try {
      setLoading(true);
      setError("");
      const response = await apiGet<{ data: BirthProfileResponse[] }>("/api/v1/birth-profiles");
      setProfiles(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile(profile: BirthProfileResponse) {
    const warning = deleteWarning(profile);
    const ok = await confirm({
      title: "Delete Profile?",
      body: warning
        ? `Delete "${profile.displayName}"? This cannot be undone.\n\n${warning}`
        : `Delete "${profile.displayName}"? This cannot be undone.`,
      confirmLabel: "Delete",
      style: "destructive",
    });
    if (!ok) return;
    try {
      setDeleting(profile.birthProfileId);
      await apiDelete(`/api/v1/birth-profiles/${profile.birthProfileId}`);
      const currentPrimaryProfileId = await getPrimaryProfileId();
      if (currentPrimaryProfileId === profile.birthProfileId) {
        await clearPrimarySelection();
        setPrimaryProfileId(null);
      }
      setProfiles((current) => current.filter((p) => p.birthProfileId !== profile.birthProfileId));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete profile");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: C.alert, marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity onPress={loadProfiles} style={{ padding: 12, backgroundColor: C.surfaceAlt, borderRadius: 8 }}>
          <Text>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: C.textSecond, textAlign: "center" }}>
          No birth profiles yet. Create your first profile to get started.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
        Your Birth Profiles ({profiles.length}/10)
      </Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.birthProfileId}
        renderItem={({ item: profile }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: C.divider,
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>{profile.displayName}</Text>
            <Text style={{ fontSize: 12, color: C.textSecond, marginBottom: 4 }}>
              Born: {profile.birthDateLocal}
              {profile.birthTimeLocal && ` at ${profile.birthTimeLocal}`}
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecond, marginBottom: 4 }}>{profile.birthPlace}</Text>
            <Text style={{ fontSize: 11, color: C.textTertiary, marginBottom: 12 }}>{profileScopeLabel(profile)}</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {onProfileSelect && (
                <TouchableOpacity
                  onPress={() => onProfileSelect(profile.birthProfileId)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: C.divider,
                    borderRadius: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 12 }}>Select</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => deleteProfile(profile)}
                disabled={deleting === profile.birthProfileId}
                style={{
                  flex: 1,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: C.alert,
                  borderRadius: 6,
                  alignItems: "center",
                  opacity: deleting === profile.birthProfileId ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 12, color: C.alert }}>
                  {deleting === profile.birthProfileId ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View
            style={{
              backgroundColor: C.surfaceAlt,
              borderRadius: 8,
              padding: 12,
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: C.textSecond, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>What shows here: </Text>
              This list includes every saved birth profile on this account. Family uses only family-linked profiles, and Life Areas uses your active primary profile.
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecond }}>
              <Text style={{ fontWeight: "600" }}>Profile Limit: </Text>
              You can create up to 10 birth profiles. Delete profiles you no longer need to make room for new ones.
            </Text>
          </View>
        }
      />
    </View>
  );
}

