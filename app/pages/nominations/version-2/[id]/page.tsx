import { staticNominationIds } from "@/app/pages/_shared/nominations/nomination-data";
import NominationDetailPage from "../../[id]/nomination-detail-page";

// Version 2 of a nomination's record page (nomination-version.tsx). Same static ids as version 1.
export function generateStaticParams() {
  return staticNominationIds().map((id) => ({ id }));
}

export default function Page() {
  return <NominationDetailPage version={2} />;
}
