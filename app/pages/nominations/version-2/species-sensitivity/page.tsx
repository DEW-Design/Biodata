"use client";

import { Suspense } from "react";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { NominationVersionProvider } from "@/app/pages/_shared/nominations/nomination-version";
import { SpeciesSensitivityList } from "@/app/pages/_shared/nominations/species-sensitivity-list";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/nominations/version-2/species-sensitivity - every species' data release risk and user access level, a BioData Super
// Admin configuration (the designer, 9 Oct 2026). Reached from column 2 of Nominations version 2. Another role keeps the
// shell, with the restriction in main (CONTRACTS 3.7). See species-sensitivity-list.tsx.
export default function SpeciesSensitivityPage() {
  return (
    <NominationVersionProvider version={2}>
      <Suspense fallback={null}>
        <SpeciesSensitivity />
      </Suspense>
    </NominationVersionProvider>
  );
}

function SensitivityRestricted() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">Species sensitivity</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">Only the BioData Super Admin sets a species&apos; data release risk and user access level.</p>
    </div>
  );
}

function SpeciesSensitivity() {
  const canConfigure = useFeatureAccess("speciesSensitivity");
  return <NominationShell breadcrumbCurrent="Species sensitivity">{canConfigure ? <SpeciesSensitivityList /> : <SensitivityRestricted />}</NominationShell>;
}
