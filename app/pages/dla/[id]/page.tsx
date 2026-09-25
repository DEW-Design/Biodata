import { staticDlaIds } from "@/app/pages/_shared/dla/dla-data";
import DlaDetailPage from "./dla-detail-page";

// Server wrapper so the route can be pre-rendered for the GitHub Pages static export, which needs
// every dynamic id listed up front: the seeds plus the next ids a new one would get (see
// staticDlaIds). The page itself stays a client component (dla-detail-page.tsx).
export function generateStaticParams() {
  return staticDlaIds().map((id) => ({ id }));
}

export default function Page() {
  return <DlaDetailPage />;
}
