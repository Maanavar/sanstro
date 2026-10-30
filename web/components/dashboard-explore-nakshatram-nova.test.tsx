/**
 * Smoke test for the "Full nakshatra guide" card added to the signed-in
 * Nakshatram detail screen — verifies it renders real, marketing-grade
 * section text (not blank/undefined) once the backend's thin card data
 * loads, for a star that has both Tamil and English rich content (Ashwini).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { NakshatraCardData } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn(async (path: string) => {
    const match = path.match(/\/content\/nakshatra\/(\d+)/);
    const number = match ? Number(match[1]) : 1;
    const card: NakshatraCardData = {
      number,
      nameTa: "அஸ்வினி",
      nameEn: "Aswini",
      deityTa: "அஸ்வினி குமாரர்கள்",
      deityEn: "Ashwini Kumaras",
      symbolTa: "குதிரைத் தலை",
      symbolEn: "Horse head",
      rulingPlanet: "KETU",
      profile: { ta: "சுருக்கமான குணம்.", en: "A short profile." },
      strengths: [{ ta: "துடிப்பு", en: "Dynamism" }],
      cautions: [{ ta: "அவசரம் தவிர்", en: "Avoid haste" }],
      compatibleGroups: [],
      ganam: { ta: "தேவ கணம்", en: "Deva Gana" },
      yoni: { ta: "குதிரை", en: "Horse" },
    };
    return { success: true, data: card };
  }),
}));

import { DashboardExploreNakshatramNova } from "./dashboard-explore-nakshatram-nova";

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const noop = () => {};

describe("DashboardExploreNakshatramNova — Full nakshatra guide", () => {
  it("renders real section text for Ashwini (number 1) once data loads", async () => {
    renderWithQueryClient(
      <DashboardExploreNakshatramNova
        lang="en"
        initialNumber={1}
        ownNumber={1}
        ownPada={2}
        personalDailyGuidance={null}
        memberCharts={[]}
        onBack={noop}
        onExit={noop}
        onOpenAskVinaadi={noop}
      />,
    );

    await waitFor(() => expect(screen.getByText("Full nakshatra guide")).toBeInTheDocument());

    // First section (Personality — in depth) is defaultOpen; its real
    // English copy (not the thin backend profile) should already be visible.
    // Note: tamilizeAstroEnglish normalizes "Ashwini" -> "Aswini" spelling.
    expect(screen.getByText(/Aswini is the first among the 27 nakshatras/)).toBeInTheDocument();

    // A collapsed section should reveal its own real content once expanded.
    fireEvent.click(screen.getByText("Career & skills"));
    expect(screen.getByText(/Aswini natives excel in technical fields/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dasha journey"));
    expect(screen.getByText(/Aswini natives are born during Ketu dasha/)).toBeInTheDocument();
  });

  it("renders the guide in Tamil when lang=ta", async () => {
    renderWithQueryClient(
      <DashboardExploreNakshatramNova
        lang="ta"
        initialNumber={1}
        ownNumber={1}
        ownPada={2}
        personalDailyGuidance={null}
        memberCharts={[]}
        onBack={noop}
        onExit={noop}
        onOpenAskVinaadi={noop}
      />,
    );

    await waitFor(() => expect(screen.getByText("முழுமையான நட்சத்திர வழிகாட்டி")).toBeInTheDocument());
    expect(screen.getByText(/அஸ்வினி நட்சத்திரம் 27 நட்சத்திரங்களில்/)).toBeInTheDocument();
  });
});

describe("DashboardExploreNakshatramNova — In your family", () => {
  // The owner row used to render on every star, so all 27 read as the owner's.
  const ownerRow = /^You( —|$)/;

  it("does not place the owner on a star that is not theirs", async () => {
    renderWithQueryClient(
      <DashboardExploreNakshatramNova lang="en" initialNumber={2} ownNumber={1} ownPada={2} personalDailyGuidance={null} memberCharts={[]} onBack={noop} onExit={noop} onOpenAskVinaadi={noop} />,
    );
    await waitFor(() => expect(screen.getByText("In your family")).toBeInTheDocument());
    expect(screen.queryByText(ownerRow)).toBeNull();
    expect(screen.getByText(/No one in your family was born under/)).toBeInTheDocument();
  });

  it("places the owner on their own birth star", async () => {
    renderWithQueryClient(
      <DashboardExploreNakshatramNova lang="en" initialNumber={1} ownNumber={1} ownPada={2} personalDailyGuidance={null} memberCharts={[]} onBack={noop} onExit={noop} onOpenAskVinaadi={noop} />,
    );
    await waitFor(() => expect(screen.getByText("In your family")).toBeInTheDocument());
    expect(screen.getByText(ownerRow)).toBeInTheDocument();
    expect(screen.getByText(/No one else at home shares/)).toBeInTheDocument();
  });
});

describe("DashboardExploreNakshatramNova — breadcrumb", () => {
  it("'Understand' leaves for the tab on one click; the hub crumb opens the list", async () => {
    const onBack = vi.fn();
    const onExit = vi.fn();
    renderWithQueryClient(
      <DashboardExploreNakshatramNova lang="en" initialNumber={1} ownNumber={1} ownPada={2} personalDailyGuidance={null} memberCharts={[]} onBack={onBack} onExit={onExit} onOpenAskVinaadi={noop} />,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Understand" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Understand" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Natchathiram" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
