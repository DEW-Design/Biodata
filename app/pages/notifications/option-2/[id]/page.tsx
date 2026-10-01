import { staticNtIds } from "@/app/pages/_shared/notifications/nt-data";
import { NtDetailRoute } from "@/app/pages/_shared/notifications/nt-routes";

// /pages/notifications/option-2/<id> - one notification, Option 2: How it works beside the email, then History.
export function generateStaticParams() {
  return staticNtIds().map((id) => ({ id }));
}

export default function Page() {
  return <NtDetailRoute option="2" />;
}
