import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModeBadge } from "./mode-badge";

describe("ModeBadge", () => {
  it("renders BEGINNER label in English", () => {
    render(<ModeBadge mode="BEGINNER" lang="en" />);
    expect(screen.getByTitle(/beginner/i)).toBeInTheDocument();
  });

  it("renders BALANCED label in English", () => {
    render(<ModeBadge mode="BALANCED" lang="en" />);
    expect(screen.getByTitle(/balanced/i)).toBeInTheDocument();
  });

  it("renders TRADITIONAL label in English", () => {
    render(<ModeBadge mode="TRADITIONAL" lang="en" />);
    expect(screen.getByTitle(/traditional/i)).toBeInTheDocument();
  });

  it("uses the mode-badge class", () => {
    const { container } = render(<ModeBadge mode="BALANCED" lang="en" />);
    expect(container.querySelector(".mode-badge")).toBeInTheDocument();
  });

  it("renders icon as aria-hidden", () => {
    const { container } = render(<ModeBadge mode="BEGINNER" lang="en" />);
    const icon = container.querySelector("[aria-hidden='true']");
    expect(icon).toBeInTheDocument();
  });
});
