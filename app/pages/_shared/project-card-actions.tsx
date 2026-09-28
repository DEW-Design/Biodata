"use client";

import { useState } from "react";
import { Download01, Upload01 } from "@untitledui/icons";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { projects } from "@/app/pages/_shared/project-list-data";
import { useUserRole } from "@/lib/use-user-role";

// Actions on ONE project, at the top right of the project-detail gradient card. Uploading a dataset
// is project-specific (every dataset belongs to a project), so it lives here and not in the
// Projects list's Actions group. "Upload dataset" is a visible button because it is the recurring
// task; the "..." menu holds the quieter ones (Export CSV). A guest still sees both and gets the
// sign-up invite on click, the same visible-but-gated rule as the header's Add menu.
export function ProjectCardActions({ projectCode }: { projectCode: string }) {
  const isGuest = useUserRole() === "public-user";
  const [gate, setGate] = useState<"upload" | "export" | null>(null);

  const upload = () =>
    isGuest
      ? setGate("upload")
      : toast.brand("Dataset upload isn't built yet", { description: "Uploading a dataset to this project isn't wired up in this preview." });

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
        <Button color="secondary" size="sm" iconLeading={Upload01} onPress={upload}>
          Upload dataset
        </Button>
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
