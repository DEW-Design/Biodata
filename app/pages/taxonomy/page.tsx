import { TxListRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy - Taxonomy Management: every rank from Order to Infraspecies ("?kingdom=Flora|Fauna", "?q=" to open on a search), with
// "Update taxonomy" opening Append, Rename, Combine or Split. The designer's version 2 (14 Oct 2026); version 1, species only, was retired on 26 Oct 2026.
export default function Page() {
  return <TxListRoute />;
}
