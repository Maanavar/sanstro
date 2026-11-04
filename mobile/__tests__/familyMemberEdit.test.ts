/**
 * The mobile member screen's PATCH body (audit Part 3). A PATCH field that is
 * omitted means "leave alone", so sending the whole form would overwrite
 * fields the user never touched — and `currentPlace: ""` is the one value that
 * must survive, because it is the sentinel that clears a current location back
 * to the birth place.
 *
 * Blind spot: this proves the body, not the screen. The screen's own gating
 * (the Save button, the consent-disabled switch) is not rendered here.
 */
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { buildMemberPatch, isEmptyPatch, type MemberEditForm } from "@/lib/familyMemberEdit";
import type { FamilyMember } from "@/api/familyVault";

const member: FamilyMember = {
  familyMemberId: "11111111-1111-1111-1111-111111111111",
  familyVaultId: "22222222-2222-2222-2222-222222222222",
  ownerUserId: "33333333-3333-3333-3333-333333333333",
  displayName: "Test Member",
  relationshipToOwner: "child",
  memberWeight: 0.75,
  genderForTraditionalRules: "female",
  dateOfBirthLocal: "2010-04-05",
  isMinor: true,
  alertsEnabled: false,
  birthProfileId: "44444444-4444-4444-4444-444444444444",
  maritalStatus: null,
  employmentType: null,
};

const form = (over: Partial<MemberEditForm> = {}): MemberEditForm => ({
  name: member.displayName,
  relationship: member.relationshipToOwner,
  alertsEnabled: member.alertsEnabled,
  place: { kind: "unchanged" },
  savedPlace: "",
  ...over,
});

describe("buildMemberPatch", () => {
  it("sends nothing when nothing changed", () => {
    const patch = buildMemberPatch(member, form());
    expect(patch).toEqual({});
    expect(isEmptyPatch(patch)).toBe(true);
  });

  it("sends only the field that changed", () => {
    expect(buildMemberPatch(member, form({ name: "Renamed" }))).toEqual({ displayName: "Renamed" });
    expect(buildMemberPatch(member, form({ alertsEnabled: true }))).toEqual({ alertsEnabled: true });
  });

  it("trims the name, and treats a blank field as no rename", () => {
    expect(buildMemberPatch(member, form({ name: "  Renamed  " }))).toEqual({ displayName: "Renamed" });
    // min_length=1 server-side; a blank field is a user mid-edit.
    expect(buildMemberPatch(member, form({ name: "   " }))).toEqual({});
    expect(buildMemberPatch(member, form({ name: `  ${member.displayName}  ` }))).toEqual({});
  });

  it("sends the matching weight with a new relationship", () => {
    expect(buildMemberPatch(member, form({ relationship: "parent" }))).toEqual({
      relationshipToOwner: "parent",
      memberWeight: 1.15,
    });
    expect(buildMemberPatch(member, form({ relationship: "spouse" }))).toEqual({
      relationshipToOwner: "spouse",
      memberWeight: 1.0,
    });
  });

  it("does not move anyone on typing alone", () => {
    // Typing without picking a suggestion leaves `place` unchanged, so no
    // current-location field is sent: a label without coordinates would pair a
    // new city with the old location.
    expect(buildMemberPatch(member, form({ place: { kind: "unchanged" }, savedPlace: "Madurai, Tamil Nadu, India" }))).toEqual({});
  });

  it("sends all four fields for a picked city", () => {
    expect(
      buildMemberPatch(
        member,
        form({ place: { kind: "picked", label: "Coimbatore, Tamil Nadu, India", lat: 11.0, lng: 76.95, timezone: "Asia/Kolkata" } }),
      ),
    ).toEqual({
      currentPlace: "Coimbatore, Tamil Nadu, India",
      currentLatitude: 11.0,
      currentLongitude: 76.95,
      currentTimezone: "Asia/Kolkata",
    });
  });

  it('clears a current location with "" and no coordinates', () => {
    const patch = buildMemberPatch(member, form({ place: { kind: "cleared" }, savedPlace: "Madurai, Tamil Nadu, India" }));
    expect(patch).toEqual({ currentPlace: "" });
    expect("currentTimezone" in patch).toBe(false);
  });

  it("does not send a clear when there was nothing to clear", () => {
    expect(buildMemberPatch(member, form({ place: { kind: "cleared" }, savedPlace: "" }))).toEqual({});
  });

  it("carries several changes together", () => {
    expect(
      buildMemberPatch(member, form({ name: "Renamed", relationship: "sibling", alertsEnabled: true })),
    ).toEqual({
      displayName: "Renamed",
      relationshipToOwner: "sibling",
      memberWeight: 0.75,
      alertsEnabled: true,
    });
  });

  it("sends no recalculate for a non-birth edit", () => {
    // A rename and a current-location clear must not recast the chart.
    const patch = buildMemberPatch(member, form({ name: "Renamed", place: { kind: "cleared" }, savedPlace: "Madurai" }));
    expect("recalculate" in patch).toBe(false);
    expect("birthDateLocal" in patch).toBe(false);
  });

  it("sends the birth block and recalculate when birth data is corrected", () => {
    const patch = buildMemberPatch(
      member,
      form({
        birth: {
          kind: "changed",
          payload: {
            displayName: "Test Member",
            birthDateLocal: "2010-04-06",
            birthTimeLocal: "09:30:00",
            birthPlace: "Chennai, Tamil Nadu, India",
            birthLatitude: 13.0827,
            birthLongitude: 80.2707,
            birthTimezone: "Asia/Kolkata",
            genderForTraditionalRules: "female",
          },
        },
      }),
    );
    expect(patch).toEqual({
      birthDateLocal: "2010-04-06",
      birthTimeLocal: "09:30:00",
      birthPlace: "Chennai, Tamil Nadu, India",
      birthLatitude: 13.0827,
      birthLongitude: 80.2707,
      birthTimezone: "Asia/Kolkata",
      genderForTraditionalRules: "female",
      recalculate: true,
    });
  });

  it("omits an unknown birth time and a null (other) gender from the birth block", () => {
    const patch = buildMemberPatch(
      member,
      form({
        birth: {
          kind: "changed",
          payload: {
            displayName: "Test Member",
            birthDateLocal: "2010-04-06",
            birthTimeLocal: undefined,
            birthPlace: "Chennai",
            birthLatitude: 13.0827,
            birthLongitude: 80.2707,
            birthTimezone: "Asia/Kolkata",
            genderForTraditionalRules: null,
          },
        },
      }),
    );
    expect("birthTimeLocal" in patch).toBe(false);
    expect("genderForTraditionalRules" in patch).toBe(false);
    expect(patch.recalculate).toBe(true);
  });
});
