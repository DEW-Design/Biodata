"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { type Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { TxShell } from "@/app/pages/_shared/taxonomy/tx-shell";
import { useTaxonNodes } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { AppendTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-append";
import { TaxonNodeRecord } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { SplitTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-split";
import { CombineTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-combine";
import { RenameTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-rename";
import { HierarchyList, useNodeCounts } from "@/app/pages/_shared/taxonomy/tx-v2-list";

// The Taxonomy Management screens, rendered by app/pages/taxonomy's page.tsx files: the list of every rank, a taxon's page, and
// Append, Split, Combine and Rename, each on one page (the designer's version 2, 14 Oct 2026; the species-only version 1 was
// retired on 26 Oct 2026). Each reads the role (useSearchParams), so each renders inside Suspense for the static export.

const asKingdom = (k: string | null): Kingdom | null => (k === "Flora" || k === "Fauna" ? k : null);

function ListScreen() {
  const params = useSearchParams();
  const kingdom = asKingdom(params.get("kingdom"));
  const q = params.get("q") ?? "";
  return (
    <TxShell current={kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()}>
      <HierarchyList key={`${kingdom ?? "all"}:${q}`} kingdom={kingdom} initialSearch={q} />
    </TxShell>
  );
}

function RecordScreen() {
  const id = useSearchParams().get("id") ?? "";
  const node = useTaxonNodes().find((n) => n.id === id);
  return (
    <TxShell current={node?.kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent={node ? node.taxon?.common || node.name : undefined} recordId={id}>
      <TaxonNodeRecord key={id} id={id} />
    </TxShell>
  );
}

function SplitScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Split Taxon" formOnePage>
      <SplitTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function CombineScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Combine Taxon" formOnePage>
      <CombineTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function RenameScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Rename Taxon" formOnePage>
      <RenameTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function AppendScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Append Taxon" formOnePage>
      <AppendTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

const wrap = (Screen: () => React.ReactNode) =>
  function Route() {
    return (
      <Suspense>
        <Screen />
      </Suspense>
    );
  };

export const TxListRoute = wrap(ListScreen);
export const TxRecordRoute = wrap(RecordScreen);
export const TxAppendRoute = wrap(AppendScreen);
export const TxSplitRoute = wrap(SplitScreen);
export const TxCombineRoute = wrap(CombineScreen);
export const TxRenameRoute = wrap(RenameScreen);
