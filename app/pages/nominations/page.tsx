"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NominationList } from "@/app/pages/_shared/nominations/nomination-list";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { nominationStatusOrder, type NominationStatus } from "@/app/pages/_shared/nominations/nomination-data";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/nominations - sensitive species nominations, the list step of "list -> record". Built from
// the Master Flows lo-fi (Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936), which only drew the form;
// the list, record page and review steps follow the DLA pattern (context/decisions/2026-09-28-09-nominate-sensitive-species-built-per-direct-request-from.md, "Nominate Sensitive
// Species"). A role with the All view switches between All and My nominations (`?scope=`; All is its
// organisation's, or everyone's for the BioData Admin); a Registered User only ever sees their own. `?status=` seeds the status filter.
export default function NominationsPage() {
  return (
    <Suspense fallback={null}>
      <Nominations />
    </Suspense>
  );
}

function Nominations() {
  const params = useSearchParams();
  const canReview = useFeatureAccess("nominationReview");
  const { scope, organisation } = useNominationScope();
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is NominationStatus => (nominationStatusOrder as string[]).includes(s));

  return (
    <NominationShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <NominationList key={`${scope}:${statusParam}`} scope={scope} organisation={organisation} initialStatuses={initialStatuses} canReview={canReview} />
      </div>
    </NominationShell>
  );
}
