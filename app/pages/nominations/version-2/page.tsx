import { NominationsPage } from "@/app/pages/_shared/nominations/nominations-page";

// /pages/nominations/version-2 (the designer, 9 Oct 2026): the nominations list as in version 1, and for the BioData Super
// Admin a Species register in column 2 and each species' data release risk on the list. See nomination-version.tsx.
export default function Page() {
  return <NominationsPage version={2} />;
}
