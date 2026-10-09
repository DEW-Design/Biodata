"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { NominationVersionProvider } from "@/app/pages/_shared/nominations/nomination-version";
import { SpeciesSensitivityRecord } from "@/app/pages/_shared/nominations/species-sensitivity-record";
import { speciesBySlug } from "@/app/pages/_shared/nominations/species-sensitivity";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/nominations/version-2/species-sensitivity/<species> - one species' data release risk and user access level, edited
// in place. BioData Super Admin only. See species-sensitivity-record.tsx.
export default function SpeciesSensitivityRecordPage() {
  return (
    <NominationVersionProvider version={2}>
      <Suspense fallback={null}>
        <Record />
      </Suspense>
    </NominationVersionProvider>
  );
}

function Record() {
  const { slug } = useParams<{ slug: string }>();
  const species = speciesBySlug(slug);
  const canConfigure = useFeatureAccess("speciesSensitivity");
  return (
    <NominationShell speciesId={canConfigure ? species?.id : undefined} breadcrumbCurrent={species?.commonName ?? "Species sensitivity"}>
      {canConfigure ? (
        <SpeciesSensitivityRecord slug={slug} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <h1 className="text-lg font-semibold text-primary">Species sensitivity</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">Only the BioData Super Admin sets a species&apos; data release risk and user access level.</p>
        </div>
      )}
    </NominationShell>
  );
}
