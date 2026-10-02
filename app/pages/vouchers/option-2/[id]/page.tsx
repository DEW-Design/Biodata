import { staticBatchIds } from "@/app/pages/_shared/vouchers/vm-data";
import { VmBatchRoute } from "@/app/pages/_shared/vouchers/vm-routes";

// /pages/vouchers/option-2/<batch> - Option 2 of a batch: a row per field, coloured by where it stands; with ?record=<id>, one record.
export function generateStaticParams() {
  return staticBatchIds().map((id) => ({ id }));
}

export default function Page() {
  return <VmBatchRoute option="2" />;
}
