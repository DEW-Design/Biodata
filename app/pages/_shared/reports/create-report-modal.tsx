"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { BarChart01 } from "@untitledui/icons";
import { FormModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Select } from "@/components/base/select/select";
import { generateReport } from "@/app/pages/_shared/reports/generated-reports-store";
import { reportBundlesFor } from "@/app/pages/_shared/reports/report-records";
import { ALL_PROJECTS } from "@/app/pages/_shared/reports/report-scope-select";
import { reportsFor } from "@/app/pages/_shared/reports/reports-data";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// Create a report: choose a report, then (for a report that has a project scope) the project, then Generate (designer, 6 Oct
// 2026: "Create a report - choose a report - generate"). Generate adds the report to My reports and goes there. Opened from
// column 2's Actions group and from My reports' empty state, so its open state is shared (`useCreateReportDialog`); the
// dialog itself is drawn once, by the Reports shell. The fields are the real `Select`; the action is `FormModal` (4.1 item 7).
const useDialog = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

export function useCreateReportDialog() {
  return useDialog((s) => s.setOpen);
}

export function CreateReportModal() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const role = useUserRole();
  const open = useDialog((s) => s.open);
  const setOpen = useDialog((s) => s.setOpen);
  const [reportId, setReportId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(ALL_PROJECTS);

  const reports = useMemo(() => [...reportsFor(role)].sort((a, b) => a.title.localeCompare(b.title)), [role]);
  const report = reports.find((r) => r.id === reportId);
  const projects = useMemo(() => reportBundlesFor(role).map((b) => b.project), [role]);
  const projectItems = useMemo(() => [{ id: ALL_PROJECTS, label: "All projects" }, ...projects.map((p) => ({ id: p.id, label: p.name, supportingText: p.code }))], [projects]);

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setReportId(null);
      setProjectId(ALL_PROJECTS);
    }
  };

  return (
    <FormModal
      isOpen={open}
      onOpenChange={close}
      icon={BarChart01}
      iconColor="brand"
      title="Create a report"
      description="Choose a report. Generating it adds it to My reports, where you can open it again."
      submitLabel="Generate"
      submitIcon={BarChart01}
      onSubmit={() => {
        if (!report) return;
        const scope = report.scoped && projects.some((p) => p.id === projectId) ? projectId : ALL_PROJECTS;
        generateReport(report.id, scope);
        toast.success("Report generated", { description: `${report.title} is in My reports.` });
        close(false);
        router.push(roleHref("/pages/reports?scope=mine"));
      }}
    >
      <Select
        label="Report"
        isRequired
        placeholder="Choose a report"
        items={reports.map((r) => ({ id: r.id, label: r.title }))}
        selectedKey={reportId}
        onSelectionChange={(key) => {
          setReportId(key ? String(key) : null);
          setProjectId(ALL_PROJECTS);
        }}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
      {report?.scoped && (
        <Select label="Project" items={projectItems} selectedKey={projectId} onSelectionChange={(key) => key && setProjectId(String(key))}>
          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
      )}
    </FormModal>
  );
}
