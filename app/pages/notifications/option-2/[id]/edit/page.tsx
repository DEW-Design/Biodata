import { staticNtIds } from "@/app/pages/_shared/notifications/nt-data";
import { NtEditRoute } from "@/app/pages/_shared/notifications/nt-routes";

// /pages/notifications/option-2/<id>/edit - edit a notification, Option 2.
export function generateStaticParams() {
  return staticNtIds().map((id) => ({ id }));
}

export default function Page() {
  return <NtEditRoute option="2" />;
}
