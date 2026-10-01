"use client";

import { useState } from "react";
import { Download01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { ProjectIngestionChip } from "@/app/pages/_shared/dataset-upload/project-ingestion";
import { UploadDatasetButton } from "@/app/pages/_shared/upload-dataset-button";
import { useUserRole } from "@/lib/use-user-role";

// Actions on ONE project, at the top right of the project-detail gradient card. Uploading a dataset
// is project-specific (every dataset belongs to a project), so it lives here and not in the
// Projects list's Actions group. "Upload dataset" is a visible button because it is the recurring
// task; the "..." menu holds the quieter ones (Export CSV). A guest still sees both and gets the
// sign-up invite on click, the same visible-but-gated rule as the header's Add menu. "Upload dataset"
// opens the project's upload page (/pages/project-list/<id>/upload) for every signed-in role. While a
// dataset is being ingested, its progress chip sits first in the row (project-ingestion.tsx), for
// signed-in roles only: a public user can't upload, so an upload's progress isn't theirs to see (and
// with no chip, the Prototype tools bar has no "Upload result" tool for them either). They still see
// "Upload dataset", which opens the sign-up prompt.
export function ProjectCardActions({ projectId, projectCode }: { projectId: string; projectCode: string }) {
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<"export" | null>(null);


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

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        {!isGuest && <ProjectIngestionChip projectId={projectId} />}
        <UploadDatasetButton projectId={projectId} />
        <Dropdown.Root>
          <Dropdown.DotsButton aria-label="More project actions" className="p-1 text-white/80 hover:text-white" />
          <Dropdown.Popover placement="bottom right">
            <Dropdown.Menu aria-label="More project actions" onAction={(key) => key === "export" && exportCsv()}>
              <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
      <SignUpPromptModal
        isOpen={gate === "export"}
        onOpenChange={(open) => !open && setGate(null)}
        icon={Download01}
        title="Sign up to export data"
        description="Exporting records needs a free BioData SA account. Create one to download project and record data."
      />
    </>
  );
}
