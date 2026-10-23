import type { Metadata } from "next";
import type { ReactNode } from "react";

// An embeddable widget, not a page anyone should land on from search. Without
// this it inherited the homepage's canonical and title (GRW-02); the full-page
// panchangam at /panchangam/<date> is the indexable version.
export const metadata: Metadata = {
  title: "Panchangam Widget",
  robots: { index: false, follow: true },
};

export default function PanchangamWidgetLayout({ children }: { children: ReactNode }) {
  return children;
}
