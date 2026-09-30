import { staticProjectIds } from "@/app/pages/_shared/project-routes";
import UploadRoute from "./upload-route";

// Server wrapper so every project's upload page is pre-rendered for the GitHub Pages static export;
// the page itself is a client component (upload-route.tsx).
export function generateStaticParams() {
  return staticProjectIds().map((id) => ({ id }));
}

export default function Page() {
  return <UploadRoute />;
}
