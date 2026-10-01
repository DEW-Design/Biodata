import { staticCvIds } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { CvEditRoute } from "@/app/pages/_shared/ctrl-vocab/cv-routes";

// /pages/ctrl-vocab/<id>/edit - edit a vocabulary.
export function generateStaticParams() {
  return staticCvIds().map((id) => ({ id }));
}

export default function Page() {
  return <CvEditRoute />;
}
