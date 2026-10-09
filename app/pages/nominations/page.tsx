import { NominationsPage } from "@/app/pages/_shared/nominations/nominations-page";

// /pages/nominations - sensitive species nominations, the list step of "list -> record". Built from
// the Master Flows lo-fi (Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936), which only drew the form;
// the list, record page and review steps follow the DLA pattern (context/decisions/2026-09-28-09-nominate-sensitive-species-built-per-direct-request-from.md, "Nominate Sensitive
// Species"). A role with the All view switches between All and My nominations (`?scope=`; All is its
// organisation's, or everyone's for the BioData Admin); a Registered User only ever sees their own. `?status=` seeds the status filter.
// This is version 1; version 2 is at ./version-2 (nomination-version.tsx).
export default function Page() {
  return <NominationsPage version={1} />;
}
