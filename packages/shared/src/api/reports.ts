import { getApiClient } from "./client";

// Contract for app/api/reports.py.
//
// `purchaseReport` used to live here: one POST to /reports/purchase that
// returned {status: "queued"} and stored nothing, with a "Join waitlist"
// button in front of it. Payments are live now, so buying a report is
// `startOrderCheckout("jadhagam_report" | "porutham_report")` from ./payments
// — the server prices it from the `products` table — and what that buys is
// spent here.

export type ReportKind = "jadhagam" | "porutham";

/** The SKUs in `products` that grant a report credit. The prices are NOT here:
 *  they are rows (D-08), read through `listPaymentProducts()`. */
export const REPORT_SKU: Record<ReportKind, string> = {
  jadhagam: "jadhagam_report",
  porutham: "porutham_report",
};

export interface Report {
  id: string;
  kind: ReportKind;
  /** The language the document was written in — a fact about the file, not a
   *  display preference. It is never re-rendered. */
  lang: "en" | "ta";
  /** "included" spent a month's Premium inclusion; "credit" spent a bought one. */
  source: "included" | "credit";
  chartId: string | null;
  partnerChartId: string | null;
  /** The date the reading was taken as of. The dasha and the timing windows
   *  inside the document are relative to it. */
  asOfDate: string | null;
  title: string;
  byteSize: number;
  sha256: string;
  createdAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
}

export interface KindAllowance {
  kind: ReportKind;
  /** What the plan includes each month. 1 on Premium, 0 otherwise (ARC-06). */
  includedMonthly: number;
  includedUsed: number;
  includedRemaining: number;
  /** Bought credits in the ledger. */
  credits: number;
  canCreate: boolean;
}

export interface ReportAllowance {
  kinds: KindAllowance[];
}

export interface CreateReportRequest {
  kind: ReportKind;
  chartId: string;
  /** Porutham only: the second chart. Both must be the caller's. */
  partnerChartId?: string;
  lang?: "en" | "ta";
  /** Porutham only. The server defaults it to MARRIAGE. */
  compatibilityContext?: string;
}

export interface CreateReportResponse {
  report: Report;
  /** What is left after this one, so the UI does not have to re-fetch. */
  allowance: KindAllowance;
}

/** GET /reports/allowance — what this account can make right now. */
export function getReportAllowance(): Promise<ReportAllowance> {
  return getApiClient().get("/reports/allowance") as Promise<ReportAllowance>;
}

/** GET /reports — delivered reports, newest first. No PDF bytes. */
export function listReports(limit?: number): Promise<Report[]> {
  const query = limit === undefined ? "" : `?limit=${encodeURIComponent(String(limit))}`;
  return getApiClient().get(`/reports${query}`) as Promise<Report[]>;
}

/**
 * POST /reports — spend an inclusion or a credit on a document.
 *
 * 402 when there is neither: the client's job then is to offer the purchase,
 * not to retry. Requires the X-Vinaadi-CSRF header, which apiFetchJson
 * attaches to every mutating request.
 */
export function createReport(body: CreateReportRequest): Promise<CreateReportResponse> {
  return getApiClient().post("/reports", body) as Promise<CreateReportResponse>;
}

/**
 * The download path for a delivered report. A GET of stored bytes, so it is a
 * URL rather than a wrapper: the browser downloads it, and the stored document
 * comes back unchanged every time.
 */
export function reportDownloadPath(reportId: string): string {
  return `/reports/${encodeURIComponent(reportId)}/download`;
}
