import { SENSITIVITY_SPECIES, speciesSlug } from "@/app/pages/_shared/nominations/species-sensitivity";
import SpeciesSensitivityRecordPage from "./species-sensitivity-record-page";

// Server wrapper so the static export pre-renders every species' page.
export function generateStaticParams() {
  return SENSITIVITY_SPECIES.map((s) => ({ slug: speciesSlug(s.id) }));
}

export default function Page() {
  return <SpeciesSensitivityRecordPage />;
}
