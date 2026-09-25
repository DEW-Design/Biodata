"use client";

import type { ReactNode } from "react";
import { BarChart01, Download01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { toast } from "@/components/application/toast/toast";

// Column 2's "Actions" group, folded into the real DSA/DLA shells from /proto/collection-sidebar's
// own "Actions" baseline (see CONTEXT.md) - Export CSV and Create report, below the status list.
// Shared between dsa-shell.tsx/dla-shell.tsx since the wrapper/label/button styling and the
// "Create report" action are identical either way; each shell still supplies its own CSV export
// (the columns genuinely differ between an agreement and a request).

export function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const csv = [header, ...rows].map((line) => line.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const actionRowClassName =
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-quaternary outline-focus-ring transition-colors duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:outline-2";

export function ActionRow({ icon: Icon, children, onClick }: { icon: typeof Download01; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={actionRowClassName}>
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  );
}

function CreateReportButton() {
  return (
    <ActionRow
      icon={BarChart01}
      onClick={() => toast.brand("Reports aren't wired up yet", { description: "Report generation isn't stored in this preview - see CONTEXT.md's Admin IA cross-check." })}
    >
      Create report
    </ActionRow>
  );
}

/**
 * The whole "Actions" group - a label, Export CSV (via `onExportCsv`), and Create report. Matches
 * `StatusNav`'s own structure exactly (`flex flex-col gap-1` wrapper + a `mb-3`, unpadded label),
 * not just the label's own margin - the wrapper needs the same `gap-1` too, since `StatusNav`'s
 * label-to-first-row gap is actually `gap-1` (4px) plus the label's `mb-3` (12px) = 16px, not
 * `mb-3` alone. Copying only the margin without the wrapper's gap left this group's own label-to-
 * button gap at 12px against the status list's 16px - flagged directly by the user off a
 * screenshot as inconsistent. The same `gap-1` also makes the Export CSV/Create report rows match
 * the status list's own row-to-row spacing, not just the top gap.
 */
export function ActionsGroup({ onExportCsv, children, showCreateReport = true, withTopRule = true }: { onExportCsv: () => void; /** Off when the group is the first thing in the column. */ withTopRule?: boolean; /** Extra rows shown first, e.g. the Projects page's "Upload dataset". */ children?: ReactNode; showCreateReport?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-1", withTopRule && "mt-4 border-t border-secondary pt-4")}>
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Actions</p>
      {children}
      <ActionRow icon={Download01} onClick={onExportCsv}>
        Export CSV
      </ActionRow>
      {showCreateReport && <CreateReportButton />}
    </div>
  );
}
