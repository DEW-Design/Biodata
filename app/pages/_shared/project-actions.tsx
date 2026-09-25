"use client";

import { useState } from "react";
import { Download01, Upload01 } from "@untitledui/icons";
import { toast } from "@/components/application/toast/toast";
import { ActionRow, ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { useUserRole } from "@/lib/use-user-role";

// The Projects section's "Actions" group in column 2 - the same block the DSA and DLA lists carry
// (`ActionsGroup`), with "Upload dataset" first. Uploading is project-specific (every dataset
// belongs to a project), so it lives here on the Projects screen instead of in the header of every
// screen. A guest still sees the group, and both Upload dataset and Export CSV open the sign-up
// invite - the same "visible, gated by click" rule as the header's Add menu and Explore's export.
// Export CSV used to download the whole project list for a guest, drafts and projects under review
// included, while Explore's export was already gated. Create report is left out for guests: it needs
// an account.
export function ProjectActions({ withTopRule = true }: { withTopRule?: boolean }) {
  const role = useUserRole();
  const isGuest = role === "public-user";
  const [gate, setGate] = useState<"upload" | "export" | null>(null);

  return (
    <>
      <ActionsGroup
        showCreateReport={!isGuest}
        withTopRule={withTopRule}
        onExportCsv={() =>
          isGuest
            ? setGate("export")
            : downloadCsv(
                "projects.csv",
                ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"],
                projects.map((p) => [p.code, p.name, p.org, p.status, p.contributorName, p.updated]),
              )
        }
      >
        <ActionRow
          icon={Upload01}
          onClick={() => (isGuest ? setGate("upload") : toast.brand("Dataset upload isn't built yet", { description: "Uploading a dataset to a project isn't wired up in this preview." }))}
        >
          Upload dataset
        </ActionRow>
      </ActionsGroup>
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
    </>
  );
}
