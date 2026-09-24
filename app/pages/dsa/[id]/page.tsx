import { seedDsas } from "@/app/pages/_shared/dsa/dsa-data";
import DsaDetailPage from "./dsa-detail-page";

// Server wrapper so the route can be pre-rendered for the GitHub Pages static export, which needs
// every dynamic id listed up front. The page itself stays a client component (dsa-detail-page.tsx).
export function generateStaticParams() {
  return seedDsas.map((dsa) => ({ id: dsa.id }));
}

export default function Page() {
  return <DsaDetailPage />;
}
