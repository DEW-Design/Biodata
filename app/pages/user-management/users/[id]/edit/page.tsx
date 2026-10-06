import { staticUserIds } from "@/app/pages/_shared/user-management/um-data";
import EditUserPage from "./edit-user-page";

// Server wrapper so the route pre-renders for the GitHub Pages static export, which needs every id listed up front.
export function generateStaticParams() {
  return staticUserIds().map((id) => ({ id }));
}

export default function Page() {
  return <EditUserPage />;
}
