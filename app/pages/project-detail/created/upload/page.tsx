"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createdProjectRow, useCreatedProject } from "@/app/pages/_shared/created-projects-store";
import { UploadScreen } from "@/app/pages/_shared/dataset-upload/upload-screen";

// Upload a dataset to a project created in this browser through Add Project (/pages/project-detail/created/upload?project=<id>), the
// partner of its page at /pages/project-detail/created. A static export cannot build a page for an id that only exists once someone
// creates it, so every created project shares this one route and says which it is in the query; the project is read from localStorage.
export default function CreatedProjectUploadPage() {
  return (
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  );
}

function Route() {
  const id = useSearchParams().get("project") ?? "";
  const { project, hydrated } = useCreatedProject(id || null);
  // Before localStorage has been read the project looks missing: wait rather than flash "not available".
  if (!hydrated) return null;
  const row = project ? createdProjectRow(project) : null;
  return <UploadScreen projectId={id} project={row ? { id: row.id, code: row.code, name: row.name } : undefined} />;
}
