import { seedDlas } from "@/app/pages/_shared/dla/dla-data";
import DlaDetailPage from "./dla-detail-page";

// Server wrapper so the route can be pre-rendered for the GitHub Pages static export, which needs
// every dynamic id listed up front. The page itself stays a client component (dla-detail-page.tsx).
export function generateStaticParams() {
  return seedDlas.map((dla) => ({ id: dla.id }));
}

export default function Page() {
  return <DlaDetailPage />;
}
