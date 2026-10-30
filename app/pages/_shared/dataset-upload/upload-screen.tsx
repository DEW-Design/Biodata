"use client";

import { useRouter } from "next/navigation";
import { toast } from "@/components/application/toast/toast";
import { addDataset } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { UploadForm } from "@/app/pages/_shared/dataset-upload/upload-form";
import { UploadShell, type UploadProject } from "@/app/pages/_shared/dataset-upload/upload-shell";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";

// The upload-dataset screen for one project: the shell and the form. Confirming stages the files for ingestion, shows a toast and returns
// to the project, where the ingestion chip shows its progress. The toast carries a "View report" button that opens the Data Ingestion
// Report on this upload's row. A built-in project is uploaded to at /pages/project-list/<id>/upload and a project made in this browser at
// /pages/project-detail/created/upload?project=<id> (`uploadPath`, project-routes.ts); both draw this. `project` is undefined when the
// address names a project that does not exist.
export function UploadScreen({ projectId, project }: { projectId: string; project: UploadProject | undefined }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const canUpload = useFeatureAccess("datasetUpload");
  const back = () => router.push(roleHref(projectDetailsPath(projectId)));

  return (
    <UploadShell project={project}>
      {project && canUpload && (
        <UploadForm
          project={project}
          onCancel={back}
          onSubmit={(draft) => {
            const dataset = addDataset(project, draft);
            toast.success("Your files are uploaded", {
              description: `${dataset.id} is being added to the project. Follow it on the project page.`,
              actionLabel: "View report",
              onAction: () => router.push(roleHref(`/pages/reports/data-ingestion?q=${dataset.id}`)),
            });
            back();
          }}
        />
      )}
    </UploadShell>
  );
}
