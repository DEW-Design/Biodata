import { staticNominationIds } from "@/app/pages/_shared/nominations/nomination-data";
import EditNominationPage from "./edit-nomination-page";

// Server wrapper for the static export (see ../page.tsx).
export function generateStaticParams() {
  return staticNominationIds().map((id) => ({ id }));
}

export default function Page() {
  return <EditNominationPage />;
}
