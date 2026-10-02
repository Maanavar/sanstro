/**
 * The edit modal is now reached from three places (family member tile, member
 * full-profile screen, Setup -> all birth profiles) and writes to two different
 * endpoints. These pin the two behaviours that are invisible until they are
 * wrong:
 *
 *  - `profile` scope must not offer relationship or weight. Neither exists on a
 *    bare birth profile, and a control that silently applies to nothing is
 *    worse than an absent one.
 *  - clearing the current city must empty the coordinates and timezone with it.
 *    A place name paired with the previous city's coordinates is the one state
 *    `resolve_effective_daily_location` cannot detect — it sees three complete
 *    fields and prefers them over the birth place, so the reader is silently
 *    served another city's sunrise under their own city's name.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditMemberModal, type EditMemberState } from "./dashboard-edit-member-modal";

vi.mock("./place-combobox", () => ({
  PlaceCombobox: ({ value, onChange, "aria-label": ariaLabel }: any) => (
    <input
      aria-label={ariaLabel ?? "place"}
      value={value}
      onChange={(e) => onChange(null, e.target.value)}
    />
  ),
}));

function stateFor(scope: "member" | "profile", overrides: Partial<EditMemberState> = {}): EditMemberState {
  return {
    scope,
    birthProfileId: "bp-1",
    familyVaultId: scope === "member" ? "vault-1" : "",
    memberId: scope === "member" ? "member-1" : "",
    displayName: "Test Subject",
    relationshipToOwner: "spouse",
    memberWeight: "1.00",
    birthDateLocal: "1991-07-22",
    birthTimeLocal: "06:30:00",
    birthPlace: "Madurai, Tamil Nadu, India",
    birthLatitude: "9.9252",
    birthLongitude: "78.1198",
    birthTimezone: "Asia/Kolkata",
    currentPlace: "",
    currentLatitude: "",
    currentLongitude: "",
    currentTimezone: "",
    ...overrides,
  };
}

function renderModal(state: EditMemberState, onChange = vi.fn()) {
  render(
    <EditMemberModal
      lang="en"
      editMember={state}
      busySaving={false}
      onClose={() => {}}
      onChange={onChange}
      onSave={() => {}}
    />,
  );
  return onChange;
}

describe("EditMemberModal scope", () => {
  it("offers relationship and weight for a family member", () => {
    renderModal(stateFor("member"));
    expect(screen.queryByLabelText(/relationship/i)).not.toBeNull();
    expect(screen.getByText(/Edit member/i)).toBeTruthy();
  });

  it("hides relationship and weight for a bare birth profile", () => {
    renderModal(stateFor("profile"));
    expect(screen.queryByLabelText(/relationship/i)).toBeNull();
    // The weight field's label is the one membership control left; neither
    // belongs on a record that has no FamilyMember row behind it.
    expect(screen.queryByLabelText(/weight/i)).toBeNull();
    expect(screen.getByText(/Edit birth profile/i)).toBeTruthy();
  });
});

describe("EditMemberModal current location", () => {
  it("clears coordinates and timezone along with the city", () => {
    const onChange = renderModal(
      stateFor("member", {
        currentPlace: "Singapore",
        currentLatitude: "1.3521",
        currentLongitude: "103.8198",
        currentTimezone: "Asia/Singapore",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Clear — use birth place/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPlace: "",
        currentLatitude: "",
        currentLongitude: "",
        currentTimezone: "",
      }),
    );
  });

  it("drops the previous city's coordinates when free text matches nothing", () => {
    const onChange = renderModal(
      stateFor("member", {
        currentPlace: "Singapore",
        currentLatitude: "1.3521",
        currentLongitude: "103.8198",
        currentTimezone: "Asia/Singapore",
      }),
    );

    fireEvent.change(screen.getByLabelText(/Where they live now/i), { target: { value: "Somewhere Else" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPlace: "Somewhere Else",
        currentLatitude: "",
        currentLongitude: "",
        currentTimezone: "",
      }),
    );
  });

  it("shows no clear affordance when there is nothing to clear", () => {
    renderModal(stateFor("member"));
    expect(screen.queryByRole("button", { name: /Clear — use birth place/i })).toBeNull();
  });
});
