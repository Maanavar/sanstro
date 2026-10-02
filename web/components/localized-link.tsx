"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLang } from "@/components/lang-context";
import { localizePath } from "@/lib/ta-routes";

/**
 * `next/link` that keeps a Tamil reader on Tamil URLs (GRW-06).
 *
 * On `/ta/...` the language is the URL, so a link to another page that has a
 * Tamil twin must point at the twin — otherwise one click drops the reader onto
 * the English URL and, for a crawler following links, leaves the Tamil pages
 * unlinked from each other. Everything else (English, external, anchors,
 * dashboard, pages with no twin) is passed through untouched.
 *
 * Drop-in: `import { LocalizedLink as Link } from "@/components/localized-link"`.
 */
export function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const [lang] = useLang();
  return <Link href={typeof href === "string" ? localizePath(href, lang) : href} {...props} />;
}
