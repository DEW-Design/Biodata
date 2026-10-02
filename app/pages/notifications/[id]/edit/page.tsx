import { staticNtIds } from "@/app/pages/_shared/notifications/nt-data";
import { NtEditRoute } from "@/app/pages/_shared/notifications/nt-routes";

// /pages/notifications/<id>/edit - edit a notification.
export function generateStaticParams() {
  return staticNtIds().map((id) => ({ id }));
}

export default function Page() {
  return <NtEditRoute />;
}
