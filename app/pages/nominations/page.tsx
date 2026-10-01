"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { NominationList } from "@/app/pages/_shared/nominations/nomination-list";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { nominationStatusOrder, type NominationStatus } from "@/app/pages/_shared/nominations/nomination-data";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/nominations - sensitive species nominations, the list step of "list -> record". Built from
// the Master Flows lo-fi (Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936), which only drew the form;
// the list, record page and review steps follow the DLA pattern (context/decisions/2026-09-28-09-nominate-sensitive-species-built-per-direct-request-from.md, "Nominate Sensitive
// Species"). The panel (nominationReview) switches between All and My nominations (`?scope=`);
// everyone else only ever sees their own. `?status=` seeds the status filter.
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
  const requested = useAgreementScope(canReview ? "all" : "mine");
  const scope = canReview ? requested : "mine";
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is NominationStatus => (nominationStatusOrder as string[]).includes(s));

  return (
    <NominationShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <NominationList key={`${scope}:${statusParam}`} scope={scope} initialStatuses={initialStatuses} canReview={canReview} />
      </div>
    </NominationShell>
  );
}
