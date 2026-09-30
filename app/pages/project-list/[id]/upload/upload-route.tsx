"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { addDataset } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { UploadForm } from "@/app/pages/_shared/dataset-upload/upload-form";
import { UploadShell } from "@/app/pages/_shared/dataset-upload/upload-shell";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";

// /pages/project-list/[id]/upload - upload a dataset to a project. Confirming stages the files for
// ingestion, shows a toast and returns to the project, where the ingestion chip shows its progress.
// The toast carries no "view the ingestion report" button yet: the report sits under Reports and comes
// with the validation work.
export default function UploadRoute() {
  return (
    <Suspense fallback={null}>
      <Upload />
    </Suspense>
  );
}

function Upload() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const canUpload = useFeatureAccess("datasetUpload");
  const { id } = useParams<{ id: string }>();
  const project = searchEvents.find((e) => e.id === id && e.type === "Project");
  const back = () => router.push(roleHref(projectDetailsPath(id)));

  return (
    <UploadShell project={project}>
      {project && canUpload && (
        <UploadForm
          project={{ id: project.id, code: project.code, name: project.name }}
          onCancel={back}
          onSubmit={(draft) => {
            const dataset = addDataset(project, draft);
            toast.success("Your files are uploaded", { description: `${dataset.id} is being added to the project. Follow it on the project page.` });
            back();
          }}
        />
      )}
    </UploadShell>
  );
}
