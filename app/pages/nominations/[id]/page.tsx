import { staticNominationIds } from "@/app/pages/_shared/nominations/nomination-data";
import NominationDetailPage from "./nomination-detail-page";

// Server wrapper so the static export can pre-render every id: the seeds plus the next ids a new
// nomination would get. The page itself is a client component.
export function generateStaticParams() {
  return staticNominationIds().map((id) => ({ id }));
}

export default function Page() {
  return <NominationDetailPage />;
}
