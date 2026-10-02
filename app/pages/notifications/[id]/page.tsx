import { staticNtIds } from "@/app/pages/_shared/notifications/nt-data";
import { NtDetailRoute } from "@/app/pages/_shared/notifications/nt-routes";

// /pages/notifications/<id> - one notification. Server wrapper so the static export lists every id up
// front (the seeds plus the next ids a new notification would get).
export function generateStaticParams() {
  return staticNtIds().map((id) => ({ id }));
}

export default function Page() {
  return <NtDetailRoute />;
}
