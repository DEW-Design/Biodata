import { TxV2ListRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy/version-2 - Taxonomy Management version 2: every rank from Order to Infraspecies ("?kingdom=Flora|Fauna",
// "?q=" to open on a search), compared with version 1 through the Version tool.
export default function Page() {
  return <TxV2ListRoute />;
}
