import { staticProjectIds } from "@/app/pages/_shared/project-routes";
import ProjectDetailsRoute from "./project-details-route";

// Server wrapper so every project's page is pre-rendered for the GitHub Pages static export; the
// page itself is a client component (project-details-route.tsx).
export function generateStaticParams() {
  return staticProjectIds().map((id) => ({ id }));
}

export default function Page() {
  return <ProjectDetailsRoute />;
}
