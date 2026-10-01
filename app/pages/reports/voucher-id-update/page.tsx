"use client";

import { ReportPage } from "@/app/pages/_shared/reports/report-page";
import { VoucherIdUpdateReport } from "@/app/pages/_shared/reports/voucher-id-update-report";

// /pages/reports/voucher-id-update - the Voucher ID Update Report, one of the reports on the Reports landing page.
// What a role sees inside it is decided by the report (voucher-id-update-report-data.ts `visibleTo`).
export default function VoucherIdUpdateReportPage() {
  return (
    <ReportPage name="Voucher ID Update Report">
      <VoucherIdUpdateReport />
    </ReportPage>
  );
}
