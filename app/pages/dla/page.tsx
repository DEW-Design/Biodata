"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { DlaAllList, DlaBanner } from "@/app/pages/_shared/dla/dla-list";
import { dlaStatusOrder, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { DlaShell } from "@/app/pages/_shared/dla/dla-shell";
import { useFeatureAccess } from "@/lib/use-feature-access";

// /pages/dla - the Data Licencing Agreement (DLA) list, the same "list -> deep dive" pattern as
// Projects/DSA (CONTEXT.md, "List -> deep dive"). Column 2 is the My requests / All requests
// switcher (the scope, `?scope=`; a reviewer opens on All, everyone else on My); main is one table
// of every status with a status filter and a Status column (`?status=` seeds the filter). A row opens
// /pages/dla/<id>. Built from the Master Flows wireframe (Figma YMproGZfrFB5jUqPHPxMhk, node
// 33:43259); the My/All scope and all-statuses table were rolled in from /proto/collection-sidebar's
// "My Items" - see the DLA entries in CONTEXT.md.
export default function DlaPage() {
  return (
    <Suspense fallback={null}>
      <DlaList />
    </Suspense>
  );
}

function DlaList() {
  const params = useSearchParams();
  const canReview = useFeatureAccess("dlaApproval");
  const scope = useAgreementScope(canReview ? "all" : "mine");
  const statusParam = params.get("status") ?? "";
  const initialStatuses = statusParam.split(",").filter((s): s is DlaStatus => (dlaStatusOrder as string[]).includes(s));

  return (
    <DlaShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* key: switching scope or following a status link starts a fresh search, filter and page. */}
        <DlaAllList key={`${scope}:${statusParam}`} scope={scope} initialStatuses={initialStatuses} banner={<DlaBanner />} />
      </div>
    </DlaShell>
  );
}
