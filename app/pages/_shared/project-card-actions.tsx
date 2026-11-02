"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart01, ChevronDown, Download01, Paperclip, Upload01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { toast } from "@/components/application/toast/toast";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { ProjectIngestionChip } from "@/app/pages/_shared/dataset-upload/project-ingestion";
import { uploadPath } from "@/app/pages/_shared/project-routes";
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
//
// Where the page can take attachments in bulk (the project page, `onUploadAttachments`), the button is "Upload" with a menu
// of the two uploads (designer, 25 Oct 2026): Upload dataset, and Upload attachments (bulk-attach-modal.tsx). A guest gets
// the sign-up prompt for either.
export function ProjectCardActions({
  projectId,
  projectCode,
  onUploadAttachments,
}: {
  projectId: string;
  projectCode: string;
  /** Opens the bulk attachments upload. When given, the button becomes an "Upload" menu holding it beside Upload dataset. */
  onUploadAttachments?: () => void;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<"upload" | "attachments" | "export" | "report" | null>(null);

  const upload = () => (isGuest ? setGate("upload") : router.push(roleHref(uploadPath(projectId))));

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
        {onUploadAttachments ? (
          <Dropdown.Root>
            <Button color="secondary" size="sm" iconLeading={Upload01} iconTrailing={ChevronDown}>
              Upload
            </Button>
            <Dropdown.Popover placement="bottom right" className="w-56">
              <Dropdown.Menu
                aria-label="Upload"
                onAction={(key) => (key === "dataset" ? upload() : isGuest ? setGate("attachments") : onUploadAttachments())}
              >
                <Dropdown.Item id="dataset" label="Upload dataset" />
                <Dropdown.Item id="attachments" label="Upload attachments" />
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        ) : (
          <Button color="secondary" size="sm" iconLeading={Upload01} onPress={upload}>
            Upload dataset
          </Button>
        )}
        <Dropdown.Root>
          <Dropdown.DotsButton aria-label="More project actions" onDark className="p-1" />
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
        isOpen={gate === "attachments"}
        onOpenChange={(open) => !open && setGate(null)}
        icon={Paperclip}
        title="Sign up to upload attachments"
        description="Create a free BioData SA account to add photos, documents, recordings and links to a project's records."
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
