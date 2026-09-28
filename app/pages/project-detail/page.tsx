import { ProjectDetailView } from "./project-detail-view";

// Adelaide Hills Bushland Survey's project page. The view lives in project-detail-view.tsx so the
// per-project route (/pages/project-list/[id]/project-details) can render it too.
export default function ProjectDetailPage() {
  return <ProjectDetailView />;
}
