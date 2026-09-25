import { staticDsaIds } from "@/app/pages/_shared/dsa/dsa-data";
import DsaDetailPage from "./dsa-detail-page";

// Server wrapper so the route can be pre-rendered for the GitHub Pages static export, which needs
// every dynamic id listed up front: the seeds plus the next ids a new one would get (see
// staticDsaIds). The page itself stays a client component (dsa-detail-page.tsx).
export function generateStaticParams() {
  return staticDsaIds().map((id) => ({ id }));
}

export default function Page() {
  return <DsaDetailPage />;
}
