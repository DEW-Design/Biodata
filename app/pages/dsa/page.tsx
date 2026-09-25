"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { DsaAllList, DsaBanner } from "@/app/pages/_shared/dsa/dsa-list";
import { dsaStatusOrder, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";

// /pages/dsa - the Data Sharing Agreement (DSA) list, step one of the list -> deep dive pattern
// (CONTEXT.md, "List -> deep dive"). Column 2 is the My agreements / All agreements switcher (the
// scope, `?scope=`); main is one table of every status with a status filter and a Status column
// (`?status=` seeds the filter, so banner links still land on a status). A row opens
// /pages/dsa/<id>. Built from the Master Flows lo-fi (Figma yzQY87GXoyGGGPJDnh1hmi, node 3:15901)
// fitted into the shell; the My/All scope and all-statuses table were rolled in from
// /proto/collection-sidebar's "My Items" - see the DSA entries in CONTEXT.md.
export default function DsaPage() {
  return (
    <Suspense fallback={null}>
      <DsaList />
    </Suspense>
  );
}

function DsaList() {
  const params = useSearchParams();
  const scope = useAgreementScope("all");
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is DsaStatus => (dsaStatusOrder as string[]).includes(s));

  return (
    <DsaShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* key: switching scope or following a status link starts a fresh search, filter and page. */}
        <DsaAllList key={`${scope}:${statusParam}`} scope={scope} initialStatuses={initialStatuses} banner={<DsaBanner />} />
      </div>
    </DsaShell>
  );
}
