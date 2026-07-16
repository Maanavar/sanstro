// MKT-20 — "Reviewed by" bylines for guide / verdict pages.
//
// ⚠️ PLACEHOLDER reviewer identity. This is wired in ONE place so every guide
// page reads the same source; swap it for the real astrologer(s) who sign off
// the content before production. It is deliberately a team/desk attribution
// (honest — it is the Vinaadi team) rather than a fabricated individual with
// invented credentials, which would mislead readers if shipped as-is. When a
// named reviewer is available, add them below and return them from getReviewer().

export interface Reviewer {
  name: { en: string; ta: string };
  credential: { en: string; ta: string };
}

const PLACEHOLDER_REVIEWER: Reviewer = {
  name: { en: "Vinaadi Astrology Desk", ta: "விநாடி ஜோதிட குழு" },
  credential: {
    en: "Reviewed against classical Thirukanitham sources",
    ta: "செம்மொழி திருக்கணித நூல்களுடன் சரிபார்க்கப்பட்டது",
  },
};

/** The reviewer to credit for a given guide kind. Currently one desk for all;
 *  split by `kind` once individual specialists sign off specific topics. */
export function getReviewer(_kind?: string): Reviewer {
  return PLACEHOLDER_REVIEWER;
}
