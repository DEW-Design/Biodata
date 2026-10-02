import { staticBatchIds } from "@/app/pages/_shared/vouchers/vm-data";
import { VmBatchRoute } from "@/app/pages/_shared/vouchers/vm-routes";

// /pages/vouchers/<batch> - one scan batch; with ?record=<id>, one record's comparison. Server wrapper so
// the static export lists every batch up front.
export function generateStaticParams() {
  return staticBatchIds().map((id) => ({ id }));
}

export default function Page() {
  return <VmBatchRoute />;
}
