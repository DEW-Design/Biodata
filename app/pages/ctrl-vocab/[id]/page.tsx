import { staticCvIds } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { CvDetailRoute } from "@/app/pages/_shared/ctrl-vocab/cv-routes";

// /pages/ctrl-vocab/<id> - one vocabulary. Server wrapper so the static export lists every id up front
// (the seeds plus the next ids a new vocabulary would get).
export function generateStaticParams() {
  return staticCvIds().map((id) => ({ id }));
}

export default function Page() {
  return <CvDetailRoute />;
}
