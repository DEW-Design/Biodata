import { staticPermissionIds } from "@/app/pages/_shared/user-management/um-data";
import DetailPage from "./detail-page";

// Server wrapper so the route pre-renders for the GitHub Pages static export, which needs every id
// listed up front: the seeds plus the next ids a new record would get.
export function generateStaticParams() {
  return staticPermissionIds().map((id) => ({ id }));
}

export default function Page() {
  return <DetailPage />;
}
