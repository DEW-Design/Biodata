import { staticNominationIds } from "@/app/pages/_shared/nominations/nomination-data";
import EditNominationPage from "../../../[id]/edit/edit-nomination-page";

// Version 3's edit route, so editing a nomination stays in version 3. Same static ids as version 1.
export function generateStaticParams() {
  return staticNominationIds().map((id) => ({ id }));
}

export default function Page() {
  return <EditNominationPage version={3} />;
}
