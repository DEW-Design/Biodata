"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload01 } from "@untitledui/icons";
import { Select } from "@/components/base/select/select";
import { FormModal } from "@/components/application/modals/modal";
import { createdProjectRow, useCreatedProjects } from "@/app/pages/_shared/created-projects-store";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { uploadPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";

// The first step of "Add > Dataset" in the header: a dataset always belongs to one project, and the
// upload page is per project (`uploadPath`, project-routes.ts), so picking Dataset asks which project
// before going there. The wireframe (Figma YMproGZfrFB5jUqPHPxMhk node 67:33213) does the same by
// showing a project list beside the upload form. On a project's own pages the current project is
// already chosen. Every project in the preview is offered; a real build would offer only those the
// person can add data to.
export function ChooseProjectModal({ isOpen, onOpenChange, defaultProjectId }: { isOpen: boolean; onOpenChange: (open: boolean) => void; defaultProjectId?: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  // The built-in projects the upload page knows (as before), then the ones made in this browser, so a new project can be uploaded to from here too.
  const created = useCreatedProjects();
  const items = useMemo(
    () =>
      [
        ...searchEvents.filter((e) => e.type === "Project").map((p) => ({ id: p.id, label: p.name, supportingText: p.code })),
        ...created.map(createdProjectRow).map((p) => ({ id: p.id, label: p.name, supportingText: p.code })),
      ].sort((a, b) => a.label.localeCompare(b.label)),
    [created],
  );
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null);
  const [attempted, setAttempted] = useState(false);

  const submit = () => {
    if (!projectId) {
      setAttempted(true);
      return;
    }
    onOpenChange(false);
    router.push(roleHref(uploadPath(projectId)));
  };

  return (
    <FormModal submitIcon={ArrowRight} submitIconTrailing
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setAttempted(false);
      }}
      icon={Upload01}
      title="Which project is this dataset for?"
      description="A dataset always belongs to one project."
      submitLabel="Continue"
      onSubmit={submit}
    >
      <Select.ComboBox
        label="Project"
        isRequired
        // The inline "Choose a project" hint, not the browser's own bubble, which would stop the
        // submit before `submit` runs.
        validationBehavior="aria"
        placeholder="Search projects"
        items={items}
        selectedKey={projectId}
        onSelectionChange={(key) => setProjectId(key as string | null)}
        isInvalid={attempted && !projectId}
        hint={attempted && !projectId ? "Choose a project" : undefined}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select.ComboBox>
    </FormModal>
  );
}
