import { staticTaxonIds } from "@/app/pages/_shared/taxonomy/tx-data";
import { TxRecordRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy/<id> - one species: its details tabs and its synonyms. Server wrapper so the static
// export lists every id up front (the NSX species, and the ids a new taxon takes).
export function generateStaticParams() {
  return staticTaxonIds().map((id) => ({ id }));
}

export default function Page() {
  return <TxRecordRoute />;
}
