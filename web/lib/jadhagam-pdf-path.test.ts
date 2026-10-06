import { describe, expect, it } from "vitest";

import { jadhagamPdfPath } from "@vinaadi/shared/api/charts";

// The PDF route's URL shape, checked against `export_chart_pdf`
// (app/api/charts.py): GET /charts/{chart_id}/export/pdf with query params
// `asOf`, `lang` and `detail` (FTR-22). Web and mobile both build it here.
describe("jadhagamPdfPath", () => {
  it("leaves the snapshot URL as it was when no detail is asked for", () => {
    expect(jadhagamPdfPath("abc", { lang: "ta", asOf: "2026-10-04" })).toBe("/charts/abc/export/pdf?lang=ta&asOf=2026-10-04");
    expect(jadhagamPdfPath("abc", { lang: "en", detail: "summary" })).toBe("/charts/abc/export/pdf?lang=en");
  });

  it("adds detail=astrologer for the full ledgers", () => {
    expect(jadhagamPdfPath("abc", { lang: "en", detail: "astrologer" })).toBe("/charts/abc/export/pdf?lang=en&detail=astrologer");
  });

  it("encodes the chart id as a path segment", () => {
    expect(jadhagamPdfPath("a/b", { lang: "en" })).toBe("/charts/a%2Fb/export/pdf?lang=en");
  });
});
