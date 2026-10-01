"use client";

import { ProjectDetailTemplate } from "./project-detail-template";
import { ADELAIDE_HILLS_ID } from "./project-seed";

// Project detail, Option 1 (route /pages/project-detail - the canonical project route): the project
// page template showing Adelaide Hills Bushland Survey. Every project uses the same template at
// /pages/project-list/<id>/project-details (project-detail-template.tsx). The layout switcher on the
// Prototype tools bar compares it with the older Option 2 layout.
export default function ProjectDetailPage() {
  return <ProjectDetailTemplate projectId={ADELAIDE_HILLS_ID} basePath="/pages/project-detail" layoutSwitcher />;
}
