"use client";

import { useState } from "react";
import { BarChart01, Download01 } from "@untitledui/icons";
import { ActionsGroup, downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { useUserRole } from "@/lib/use-user-role";

// The Projects section's "Actions" group in column 2 - the same block the DSA and DLA lists carry
// (`ActionsGroup`). "Upload dataset" is not here: a dataset belongs to one project, so it sits on
// the project-detail card (`ProjectCardActions`). A guest still sees the group, and Export CSV
// opens the sign-up invite - the same "visible, gated by click" rule as the header's Add menu.
// Export CSV used to download the whole project list for a guest, drafts and projects under review
// included, while Explore's export was already gated. Create report is left out for guests (it needs
// an account) unless `sameForEveryone` is set: then a guest sees it too and it opens the sign-up
// invite, so the column reads the same for every persona (project-detail Option 3).
export function ProjectActions({ withTopRule = true, sameForEveryone = false }: { withTopRule?: boolean; sameForEveryone?: boolean }) {
  const role = useUserRole();
  const isGuest = role === "public-user";
  const [gate, setGate] = useState<"export" | "report" | null>(null);

  return (
    <>
      <ActionsGroup
        showCreateReport={!isGuest || sameForEveryone}
        onCreateReport={isGuest ? () => setGate("report") : undefined}
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
