/**
 * Life Focus Phase 4: the picker tells the server where a write came from, and
 * a first-run Escape/backdrop dismissal (which saves nothing) is still counted.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateLifeMode } from "@vinaadi/shared/api";
import { track } from "@/lib/analytics";
import { dt, LIFE_FOCUS } from "@/lib/dashboard-i18n";
import { LifeModePicker, lifeModeLabel } from "./life-mode-picker";

vi.mock("@vinaadi/shared/api", () => ({
  updateLifeMode: vi.fn(() => Promise.resolve({ mode: "BALANCED" })),
}));
vi.mock("@/lib/api", () => ({}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

function renderPicker(firstRun: boolean, onClose = vi.fn()) {
  render(
    <LifeModePicker
      lang="en"
      currentMode="BALANCED"
      blockedModes={[]}
      firstRun={firstRun}
      onClose={onClose}
      onSelected={() => {}}
    />,
  );
  return onClose;
}

beforeEach(() => {
  vi.mocked(updateLifeMode).mockClear();
  vi.mocked(track).mockClear();
});

describe("LifeModePicker — Phase 4 surfaces", () => {
  it("sends Skip from the first-run picker, the only surface allowed to", () => {
    renderPicker(true);
    fireEvent.click(screen.getByText(dt(LIFE_FOCUS.skip, "en")));
    expect(updateLifeMode).toHaveBeenCalledWith("BALANCED", "SKIP", "FIRST_RUN_PICKER");
    expect(track).not.toHaveBeenCalled();
  });

  it("tags a first-run choice as the first-run picker", async () => {
    renderPicker(true);
    fireEvent.click(screen.getByText(lifeModeLabel("CAREER", "en")));
    await waitFor(() =>
      expect(updateLifeMode).toHaveBeenCalledWith("CAREER", "SELECT", "FIRST_RUN_PICKER"),
    );
  });

  it("tags a later change as plain web", async () => {
    renderPicker(false);
    fireEvent.click(screen.getByText(lifeModeLabel("CAREER", "en")));
    await waitFor(() => expect(updateLifeMode).toHaveBeenCalledWith("CAREER", "SELECT", "WEB"));
  });

  it("counts a first-run Escape as a dismissal without saving anything", async () => {
    const onClose = renderPicker(true);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(track).toHaveBeenCalledWith("life_focus_first_run_dismissed", { surface: "web" });
    expect(updateLifeMode).not.toHaveBeenCalled();
  });

  it("does not count closing the picker after onboarding", async () => {
    const onClose = renderPicker(false);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(track).not.toHaveBeenCalled();
  });
});
