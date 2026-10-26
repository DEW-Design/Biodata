import { NominationsPage } from "@/app/pages/_shared/nominations/nominations-page";

// /pages/nominations - sensitive species nominations, the list step of "list -> record". Built from
// the Master Flows lo-fi (Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936), which only drew the form;
// the list, record page and review steps follow the DLA pattern (context/decisions/2026-09-28-09-nominate-sensitive-species-built-per-direct-request-from.md, "Nominate Sensitive
// Species"). A role with the All view switches between All and My nominations (`?scope=`; All is its
// organisation's, or everyone's for the BioData Admin); a Registered User only ever sees their own. `?status=` seeds the status filter.
// A species or a location is nominated, each attribute and area with its reason. Every nomination, an admin's too, is submitted and
// reviewed by the panel (the designer, 26 Oct 2026); a BioData Admin or Super Admin edits any submitted one, and rates what is protected
// (the designer's version 3, 12 Oct 2026, kept on 26 Oct 2026).
export default function Page() {
  return <NominationsPage />;
}
