"use client";

import { Suspense } from "react";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { NominationVersionProvider } from "@/app/pages/_shared/nominations/nomination-version";
import { SpeciesSensitivityBulk } from "@/app/pages/_shared/nominations/species-sensitivity-bulk";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/nominations/version-2/species-sensitivity/bulk?species=<slug>,<slug> - change several species' data release at once.
// BioData Super Admin only. See species-sensitivity-bulk.tsx.
export default function SpeciesSensitivityBulkPage() {
  return (
    <NominationVersionProvider version={2}>
      <Suspense fallback={null}>
        <Bulk />
      </Suspense>
    </NominationVersionProvider>
  );
}

function Bulk() {
  const canConfigure = useFeatureAccess("speciesSensitivity");
  return (
    <NominationShell breadcrumbCurrent="Change species">
      {canConfigure ? (
        <SpeciesSensitivityBulk />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <h1 className="text-lg font-semibold text-primary">Species sensitivity</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">Only the BioData Super Admin sets a species&apos; data release risk and user access level.</p>
        </div>
      )}
    </NominationShell>
  );
}
