"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { UploadScreen } from "@/app/pages/_shared/dataset-upload/upload-screen";

// /pages/project-list/[id]/upload - upload a dataset to a built-in project (a project made in this browser is uploaded to at
// /pages/project-detail/created/upload, because a static export has no page for an id that does not exist yet). The screen is
// `UploadScreen`: confirming stages the files for ingestion and returns to the project, where the ingestion chip shows its progress.
export default function UploadRoute() {
  return (
    <Suspense fallback={null}>
      <Upload />
    </Suspense>
  );
}

function Upload() {
  const { id } = useParams<{ id: string }>();
  const found = searchEvents.find((e) => e.id === id && e.type === "Project");
  return <UploadScreen projectId={id} project={found ? { id: found.id, code: found.code, name: found.name } : undefined} />;
}
