import { getApiClient } from "./client";

export type ReportPurchaseData = {
  status: string;
  reference_id: string;
  product_id: string;
};

/**
 * Queue a pay-per-use report purchase (waitlist until payment goes live).
 * Backend: POST /api/v1/reports/purchase (app/api/reports.py::purchase_report —
 * body {product_id, chart_id?}, requires the X-Vinaadi-CSRF header, which the
 * web/mobile clients attach to every mutating request).
 */
export function purchaseReport(
  productId: string,
  chartId?: string,
): Promise<ReportPurchaseData> {
  return getApiClient().post("/reports/purchase", {
    product_id: productId,
    chart_id: chartId,
  }) as Promise<ReportPurchaseData>;
}
