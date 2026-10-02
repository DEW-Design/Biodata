import { TxListRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy - Taxonomy Management: the species list ("?kingdom=Flora|Fauna"), with "Update
// taxonomy" opening a guided taxon change.
export default function Page() {
  return <TxListRoute />;
}
