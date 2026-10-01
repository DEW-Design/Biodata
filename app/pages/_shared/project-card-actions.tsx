"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart01, Download01, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { toast } from "@/components/application/toast/toast";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { ProjectIngestionChip } from "@/app/pages/_shared/dataset-upload/project-ingestion";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// Actions on ONE project, at the top right of the project-detail gradient card. Uploading a dataset
// is project-specific (every dataset belongs to a project), so it lives here and not in the
// Projects list's Actions group. "Upload dataset" is a visible button because it is the recurring
// task; the "..." menu holds the quieter ones (Export CSV, Create report), which used to sit in the Projects
// list's column 2 before the project page lost that column (30 Sept 2026). A guest still sees both and gets the
// sign-up invite on click, the same visible-but-gated rule as the header's Add menu. "Upload dataset"
// opens the project's upload page (/pages/project-list/<id>/upload) for every signed-in role. While a
// dataset is being ingested, its progress chip sits first in the row (project-ingestion.tsx), for
// signed-in roles only: a public user can't upload, so an upload's progress isn't theirs to see (and
// with no chip, the Prototype tools bar has no "Upload result" tool for them either). They still see
// "Upload dataset", which opens the sign-up prompt.
export function ProjectCardActions({ projectId, projectCode }: { projectId: string; projectCode: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<"upload" | "export" | "report" | null>(null);

  const upload = () => (isGuest ? setGate("upload") : router.push(roleHref(`/pages/project-list/${projectId}/upload`)));

  const exportCsv = () => {
    if (isGuest) return setGate("export");
    const p = projects.find((x) => x.code === projectCode);
    if (!p) return;
    downloadCsv(
      `${projectCode}.csv`,
      ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"],
      [[p.code, p.name, p.org, p.status, p.contributorName, p.updated]],
    );
  };

  // Reports are not built yet: a signed-in person is told so, a guest gets the sign-up invite (the same
  // two outcomes as the Actions group's Create report).
  const createReport = () =>
    isGuest ? setGate("report") : toast.brand("Reports aren't wired up yet", { description: "Reports can't be generated in this preview yet." });

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        {!isGuest && <ProjectIngestionChip projectId={projectId} />}
        <Button color="secondary" size="sm" iconLeading={Upload01} onPress={upload}>
          Upload dataset
        </Button>
        <Dropdown.Root>
          <Dropdown.DotsButton aria-label="More project actions" className="p-1 text-white/80 hover:text-white" />
          <Dropdown.Popover placement="bottom right">
            <Dropdown.Menu aria-label="More project actions" onAction={(key) => (key === "export" ? exportCsv() : key === "report" && createReport())}>
              <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
              <Dropdown.Item id="report" label="Create report" icon={BarChart01} />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
      <SignUpPromptModal
        isOpen={gate === "upload"}
        onOpenChange={(open) => !open && setGate(null)}
        icon={Upload01}
        title="Sign up to upload a dataset"
        description="Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record."
      />
      <SignUpPromptModal
        isOpen={gate === "export"}
        onOpenChange={(open) => !open && setGate(null)}
        icon={Download01}
        title="Sign up to export data"
        description="Exporting records needs a free BioData SA account. Create one to download project and record data."
      />
      <SignUpPromptModal
        isOpen={gate === "report"}
        onOpenChange={(open) => !open && setGate(null)}
        icon={BarChart01}
        title="Sign up to create reports"
        description="Reports need a free BioData SA account. Create one to build and save reports on project data."
      />
    </>
  );
}
