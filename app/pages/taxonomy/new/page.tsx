import { TxChangeRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy/new?type=<rename|combine|split|append>&from=<id> - a guided taxon change.
export default function Page() {
  return <TxChangeRoute />;
}
