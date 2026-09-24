"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DlaListContent } from "@/app/pages/_shared/dla/dla-list";
import { dlaStatusOrder, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";

// /pages/dla - the Data Licencing Agreement (DLA) list, the same "list -> deep dive" pattern as
// Projects/DSA (CONTEXT.md, "List -> deep dive"): column 2 picks a status bucket, main is a table,
// a row opens /pages/dla/<id>. Built from the Master Flows wireframe (Figma
// YMproGZfrFB5jUqPHPxMhk, node 33:43259) fitted into the shell - see the DLA entry in CONTEXT.md
// for what changed and why.
export default function DlaPage() {
  return (
    <Suspense fallback={null}>
      <DlaList />
    </Suspense>
  );
}

function DlaList() {
  const requested = useSearchParams().get("status");
  const status: DlaStatus = dlaStatusOrder.find((s) => s === requested) ?? "active";

  return (
    <DlaShell activeStatus={status}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* key: switching bucket starts a fresh search and page. */}
        <DlaListContent key={status} status={status} />
      </div>
    </DlaShell>
  );
}
