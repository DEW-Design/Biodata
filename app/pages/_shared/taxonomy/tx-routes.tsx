"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CHANGE_META, CHANGE_TYPES, type ChangeType, type Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { TaxonChangeFlow } from "@/app/pages/_shared/taxonomy/tx-flows";
import { SpeciesList, SpeciesRecord } from "@/app/pages/_shared/taxonomy/tx-records";
import { TxShell } from "@/app/pages/_shared/taxonomy/tx-shell";
import { useTaxon } from "@/app/pages/_shared/taxonomy/tx-store";

// The Taxonomy Management screens, rendered by app/pages/taxonomy's page.tsx files. Each reads the
// role (useSearchParams), so each renders inside Suspense for the static export.

const asType = (v: string | null | undefined): ChangeType | null => (CHANGE_TYPES.includes(v as ChangeType) ? (v as ChangeType) : null);

function ListScreen() {
  const k = useSearchParams().get("kingdom");
  const kingdom = k === "Flora" || k === "Fauna" ? (k as Kingdom) : null;
  return (
    <TxShell current={kingdom ?? "all"}>
      <SpeciesList key={kingdom ?? "all"} kingdom={kingdom} />
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
