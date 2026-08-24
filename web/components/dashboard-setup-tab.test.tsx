import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { BirthFormState, MemberFormState, VaultFormState } from "./dashboard-setup-tab";

/**
 * T4 / A-039. `BEGINNER | BALANCED | TRADITIONAL` has existed for a long time,
 * defaulted to `BALANCED`, and was reachable only from Settings. Every
 * comprehension feature built on top of it — the plain-language layer, the
 * beginner guidance card, the advanced-astrology gate — is downstream of a
 * value nobody was ever asked for. So this question is not a settings control
 * that happens to appear early; it is the gate that decides whether a beginner
 * ever sees any of it.
 *
 * That makes three things load-bearing, and each fails silently:
 *
 *  1. It is asked during onboarding, in the profile form, not only in Settings.
 *  2. It is asked as a question about the *reader* ("How much astrology do you
 *     already know?") — not as a product setting called "Detail level". A
 *     well-meaning copy edit back to the settings register would keep every
 *     assertion below except this one passing.
 *  3. It answers as a real radiogroup with exactly one selection. There is a
 *     permanent axe gate on this repo and these are hand-rolled buttons with
 *     `role="radio"`, not inputs.
 */

vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
  getFeatureFlag: vi.fn(() => null),
  track: vi.fn(),
}));

const birthForm: BirthFormState = {
  ownerUserId: "00000000-0000-0000-0000-000000000000",
  displayName: "",
  birthDateLocal: "",
  birthTimeLocal: "",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "Asia/Kolkata",
  currentPlace: "",
  currentLatitude: "",
  currentLongitude: "",
  currentTimezone: "Asia/Kolkata",
  relationshipToOwner: "self",
  calculateNow: true,
  maritalStatus: "",
  employmentType: "",
  children: "",
  birthTimeSource: "unknown",
  birthTimeConfidenceMinutes: "",
};

const vaultForm: VaultFormState = {
  ownerUserId: "00000000-0000-0000-0000-000000000000",
  name: "",
  defaultLanguage: "en",
};

const memberForm: MemberFormState = {
  displayName: "",
  relationshipToOwner: "spouse",
  birthDateLocal: "",
  birthTimeLocal: "",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "Asia/Kolkata",
  currentPlace: "",
  currentLatitude: "",
  currentLongitude: "",
  currentTimezone: "Asia/Kolkata",
  memberWeight: "1.00",
  calculateNow: true,
  birthTimeSource: "unknown",
  birthTimeConfidenceMinutes: "",
};

beforeEach(() => {
  // Place lookup and profile listing both fire on mount; neither is under test.
  // Left pending rather than rejected — a rejection settles after the test body
  // and warns about an act() update on every case.
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderSetup(
  overrides: {
    birthProfileId?: string;
    userMode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
    onModeChange?: (mode: "BEGINNER" | "BALANCED" | "TRADITIONAL") => void;
  } = {},
) {
  const { DashboardSetupTab } = await import("./dashboard-setup-tab");
  return render(
    <DashboardSetupTab
      lang="en"
      birthProfileId={overrides.birthProfileId ?? ""}
      selectedVaultId=""
      selectedVault={null}
      vaults={[]}
      birthForm={birthForm}
      vaultForm={vaultForm}
      memberForm={memberForm}
      formErrors={{}}
      busy={{ createProfile: false, createVault: false, addMember: false }}
      userMode={overrides.userMode ?? "BALANCED"}
      onNavigate={vi.fn()}
      onBirthFormChange={vi.fn()}
      onVaultFormChange={vi.fn()}
      onMemberFormChange={vi.fn()}
      onFormErrorChange={vi.fn()}
      onCreateProfile={vi.fn()}
      onCreateVault={vi.fn()}
      onAddMember={vi.fn()}
      onSelectVault={vi.fn()}
      onShowEditProfile={vi.fn()}
      onGoToPersonal={vi.fn()}
      onModeChange={overrides.onModeChange ?? vi.fn()}
    />,
  );
}

const QUESTION = /How much astrology do you already know\?/i;

describe("Setup — the detail-level question", () => {
  it("is asked during onboarding, inside the profile form", async () => {
    const { container } = await renderSetup();

    const group = screen.getByRole("radiogroup", { name: QUESTION });
    expect(group).toBeInTheDocument();
    // Inside the create-profile form, so it is answered on the way to a chart
    // rather than sitting somewhere the reader has to go looking for it.
    expect(container.querySelector("#form-profile")?.contains(group)).toBe(true);
  });

  it("is phrased as a question about the reader, not as a product setting", async () => {
    await renderSetup();

    const heading = screen.getByRole("heading", { name: QUESTION });
    expect(heading).toBeInTheDocument();

    // The beginner option describes the reader's situation. "Beginner" as a
    // bare level label is the settings register this deliberately is not.
    expect(
      screen.getByText(/I've heard the words but never studied it/i),
    ).toBeInTheDocument();
  });

  it("offers the three levels as a radiogroup with exactly one selected", async () => {
    await renderSetup({ userMode: "BALANCED" });

    const group = screen.getByRole("radiogroup", { name: QUESTION });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("reports the beginner answer to the caller", async () => {
    const onModeChange = vi.fn();
    await renderSetup({ onModeChange });

    const group = screen.getByRole("radiogroup", { name: QUESTION });
    fireEvent.click(
      within(group).getByRole("radio", { name: /I've heard the words but never studied it/i }),
    );
    expect(onModeChange).toHaveBeenCalledWith("BEGINNER");
  });

  it("stops asking once the chart exists — it is a question, not a form field", async () => {
    await renderSetup({ birthProfileId: "11111111-1111-1111-1111-111111111111" });

    expect(screen.queryByRole("radiogroup", { name: QUESTION })).toBeNull();
  });
});

describe("Setup — family onboarding", () => {
  it("lets a reader add their first family member without creating a vault first", async () => {
    await renderSetup({ birthProfileId: "11111111-1111-1111-1111-111111111111" });

    expect(screen.getByRole("heading", { name: "Add a family member" })).toBeInTheDocument();
    expect(screen.getByText(/create your family automatically when you add the first person/i)).toBeInTheDocument();
  });
});
