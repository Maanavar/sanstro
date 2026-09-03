import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState, GatedState, LoadingState, UnavailableState } from "./state";

describe("shared state components", () => {
  it("gives every state a named, screen-reader-visible region", () => {
    render(
      <>
        <LoadingState />
        <ErrorState />
        <EmptyState />
        <GatedState />
        <UnavailableState />
      </>,
    );

    expect(screen.getByRole("region", { name: "Loading" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Could not load this information" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Nothing here yet" })).toBeVisible();
    expect(screen.getByRole("region", { name: "This feature needs access" })).toBeVisible();
    expect(screen.getByRole("region", { name: "This section is temporarily unavailable" })).toBeVisible();
  });

  it("provides a real, keyboard-accessible retry action", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders Tamil copy when requested", () => {
    render(<EmptyState lang="ta" />);

    expect(screen.getByRole("region", { name: "இன்னும் தகவல் இல்லை" })).toBeVisible();
  });
});
