import { staticProjectRecordParams } from "@/app/pages/_shared/project-routes";
import ProjectDetailsRoute from "../../project-details-route";

// A record opened on its project's page (from Explore's summary card). Every record is listed for
// the static export.
export function generateStaticParams() {
  return staticProjectRecordParams();
}

export default function Page() {
  return <ProjectDetailsRoute />;
}
