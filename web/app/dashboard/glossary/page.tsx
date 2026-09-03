import type { Metadata } from "next";

import { GlossaryIndex } from "./glossary-index";

export const metadata: Metadata = {
  title: "Glossary | Vinaadi AI",
};

// The page stays a server component only so it can export `metadata`; every
// rendered string lives in `GlossaryIndex`, which needs the active language
// from `LangContext`. See that file for why the split is not optional.
export default function DashboardGlossaryPage() {
  return <GlossaryIndex />;
}
