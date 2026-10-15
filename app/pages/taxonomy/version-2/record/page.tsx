import { TxV2RecordRoute } from "@/app/pages/_shared/taxonomy/tx-routes";

// /pages/taxonomy/version-2/record?id=<path> - a taxon's page at any rank. The id is the taxon's path of names, so the page
// is one static route (the static export cannot list the taxa appended later).
export default function Page() {
  return <TxV2RecordRoute />;
}
