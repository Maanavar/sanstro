import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardGlossaryPage from "./page";
import { GLOSSARY } from "@/lib/glossary";

describe("/dashboard/glossary", () => {
  it("renders one index card for every glossary entry", () => {
    const { container } = render(<DashboardGlossaryPage />);

    expect(screen.getByRole("heading", { name: /Glossary/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(container.querySelectorAll("article")).toHaveLength(Object.keys(GLOSSARY).length);
  });

  it("includes the daily terms the tooltip system points readers toward", () => {
    render(<DashboardGlossaryPage />);

    expect(screen.getByRole("heading", { name: /Rahu Kalam/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Panchangam/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Chandrashtama/i })).toBeInTheDocument();
  });
});
