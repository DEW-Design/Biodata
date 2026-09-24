"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DsaBanner, DsaListContent } from "@/app/pages/_shared/dsa/dsa-list";
import { dsaStatusOrder, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";
import { DsaShell } from "@/app/pages/_shared/dsa/dsa-shell";

// /pages/dsa - the Data Sharing Agreement (DSA) list, step one of the list -> deep dive pattern
// (CONTEXT.md, "List -> deep dive"): column 2 picks a status bucket, main is a table, a row opens
// /pages/dsa/<id>. Built from the Master Flows lo-fi (Figma yzQY87GXoyGGGPJDnh1hmi, node 3:15901)
// fitted into the shell - see the DSA entry in CONTEXT.md for what changed and why.
export default function DsaPage() {
  return (
    <Suspense fallback={null}>
      <DsaList />
    </Suspense>
  );
}

function DsaList() {
  const requested = useSearchParams().get("status");
  const status: DsaStatus = dsaStatusOrder.find((s) => s === requested) ?? "active";

  return (
    <DsaShell activeStatus={status}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* key: switching bucket starts a fresh search and page. */}
        <DsaListContent key={status} status={status} banner={<DsaBanner />} />
      </div>
    </DsaShell>
  );
}
