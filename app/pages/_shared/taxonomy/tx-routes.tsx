"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CHANGE_META, CHANGE_TYPES, type ChangeType, type Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { TaxonChangeFlow } from "@/app/pages/_shared/taxonomy/tx-flows";
import { SpeciesList, SpeciesRecord } from "@/app/pages/_shared/taxonomy/tx-records";
import { TxShell } from "@/app/pages/_shared/taxonomy/tx-shell";
import { useTaxon } from "@/app/pages/_shared/taxonomy/tx-store";
import { TX_V2_ROOT } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { AppendTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-append";
import { TaxonNodeRecord } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { SplitTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-split";
import { CombineTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-combine";
import { RenameTaxonForm } from "@/app/pages/_shared/taxonomy/tx-v2-rename";
import { HierarchyList, TxVersionTool, useNodeCounts } from "@/app/pages/_shared/taxonomy/tx-v2-list";
import { useTaxonNodes } from "@/app/pages/_shared/taxonomy/tx-hierarchy";

// The Taxonomy Management screens, rendered by app/pages/taxonomy's page.tsx files. Each reads the
// role (useSearchParams), so each renders inside Suspense for the static export.

const asType = (v: string | null | undefined): ChangeType | null => (CHANGE_TYPES.includes(v as ChangeType) ? (v as ChangeType) : null);

function ListScreen() {
  const k = useSearchParams().get("kingdom");
  const kingdom = k === "Flora" || k === "Fauna" ? (k as Kingdom) : null;
  return (
    <TxShell current={kingdom ?? "all"}>
      <TxVersionTool version={1} />
      <SpeciesList key={kingdom ?? "all"} kingdom={kingdom} />
    </TxShell>
  );
}

const asKingdom = (k: string | null): Kingdom | null => (k === "Flora" || k === "Fauna" ? k : null);

/** Version 2: every rank, and Append at any of five (tx-hierarchy.ts). */
function V2ListScreen() {
  const params = useSearchParams();
  const kingdom = asKingdom(params.get("kingdom"));
  const q = params.get("q") ?? "";
  return (
    <TxShell current={kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()}>
      <TxVersionTool version={2} />
      <HierarchyList key={`${kingdom ?? "all"}:${q}`} kingdom={kingdom} initialSearch={q} />
    </TxShell>
  );
}

function V2RecordScreen() {
  const id = useSearchParams().get("id") ?? "";
  const node = useTaxonNodes().find((n) => n.id === id);
  return (
    <TxShell current={node?.kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent={node ? node.taxon?.common || node.name : undefined}>
      <TxVersionTool version={2} />
      <TaxonNodeRecord key={id} id={id} />
    </TxShell>
  );
}

function V2SplitScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Split Taxon" formOnePage>
      <TxVersionTool version={2} />
      <SplitTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function V2CombineScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Combine Taxon" formOnePage>
      <TxVersionTool version={2} />
      <CombineTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function V2RenameScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Rename Taxon" formOnePage>
      <TxVersionTool version={2} />
      <RenameTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function V2AppendScreen() {
  const kingdom = asKingdom(useSearchParams().get("kingdom"));
  return (
    <TxShell current={kingdom ?? "all"} base={TX_V2_ROOT} noun="Taxa" counts={useNodeCounts()} breadcrumbCurrent="Append Taxon" formOnePage>
      <TxVersionTool version={2} />
      <AppendTaxonForm initialKingdom={kingdom} />
    </TxShell>
  );
}

function RecordScreen() {
  const id = decodeURIComponent(useParams<{ id: string }>().id);
  const taxon = useTaxon(id);
  return (
    <TxShell current={taxon?.kingdom ?? "all"} breadcrumbCurrent={taxon ? taxon.common || taxon.scientific : undefined}>
      <SpeciesRecord key={id} id={id} />
    </TxShell>
  );
}

function ChangeScreen() {
  const params = useSearchParams();
  const origin = useTaxon(params.get("from"));
  const type = asType(params.get("type"));
  return (
    <TxShell current={origin?.kingdom ?? "all"} breadcrumbCurrent={type ? CHANGE_META[type].title : "Update taxonomy"} formSidebar>
      <TaxonChangeFlow key={`${type}:${origin?.id ?? ""}`} initialType={type} from={origin?.id ?? null} />
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
export const TxChangeRoute = wrap(ChangeScreen);
export const TxV2ListRoute = wrap(V2ListScreen);
export const TxV2AppendRoute = wrap(V2AppendScreen);
export const TxV2RecordRoute = wrap(V2RecordScreen);
export const TxV2SplitRoute = wrap(V2SplitScreen);
export const TxV2CombineRoute = wrap(V2CombineScreen);
export const TxV2RenameRoute = wrap(V2RenameScreen);
