"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NominationList } from "@/app/pages/_shared/nominations/nomination-list";
import { NominationShell } from "@/app/pages/_shared/nominations/nomination-shell";
import { useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { nominationStatusOrder, type NominationStatus } from "@/app/pages/_shared/nominations/nomination-data";
import { useFeatureAccess } from "@/lib/use-feature-access";

// The nominations list (/pages/nominations).
export function NominationsPage() {
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
