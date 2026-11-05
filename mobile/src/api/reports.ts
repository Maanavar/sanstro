/**
 * Reports: spending an included report or a bought credit, and reading back
 * what was delivered.
 *
 * Buying is NOT here. Apple and Google require their own purchase flow for
 * digital goods, so a report credit is bought through the store the same way
 * Premium is (`app/premium.tsx`), or on the web. What this screen does is
 * spend what the account already has — which is the half that was missing
 * everywhere until report delivery shipped.
 *
 * The download is not a wrapper: it is raw PDF bytes, so it goes through
 * `fetchWithAuth` in `app/reports/index.tsx` rather than the JSON client.
 */
export type {
  CreateReportRequest,
  CreateReportResponse,
  KindAllowance,
  Report,
  ReportAllowance,
  ReportKind,
} from "@vinaadi/shared/api/reports";
export {
  createReport,
  getReportAllowance,
  listReports,
  reportDownloadPath,
  REPORT_SKU,
} from "@vinaadi/shared/api/reports";
