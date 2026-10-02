"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SOURCES, SOURCE_LABEL, vmBatch, type VmSource } from "@/app/pages/_shared/vouchers/vm-data";
import { VmRootProvider, useVmRoot, type VmOption } from "@/app/pages/_shared/vouchers/vm-root";
import { VmBatchPage } from "@/app/pages/_shared/vouchers/vm-batch";
import { VmList } from "@/app/pages/_shared/vouchers/vm-list";
import { VmRecordNotFound, VmRecordPage } from "@/app/pages/_shared/vouchers/vm-record";
import { VmShell } from "@/app/pages/_shared/vouchers/vm-shell";
import { useAllRecords, useVouchersHydrated } from "@/app/pages/_shared/vouchers/vm-store";

// The Voucher Management screens, rendered by app/pages/vouchers' page.tsx files. Each reads the role (useSearchParams), so each renders inside Suspense for the static export.

function ListScreen() {
  const param = useSearchParams().get("source") ?? "";
  const source = (SOURCES as string[]).includes(param) ? (param as VmSource) : "";
  return (
    <VmShell source={source}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <VmList key={source} source={source} />
      </div>
    </VmShell>
  );
}

function BatchScreen() {
  const { id } = useParams<{ id: string }>();
  const recordId = useSearchParams().get("record");
  const root = useVmRoot();
  const batch = vmBatch(id);
  const records = useAllRecords(batch);
  const hydrated = useVouchersHydrated();
  const record = recordId ? records.find((r) => r.id === recordId) : undefined;

  if (!batch)
    return (
      <VmShell breadcrumb={[{ label: `Batch ${id}` }]}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
          <h1 className="text-lg font-semibold text-primary">Batch not found</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">There is no scan batch {id}.</p>
        </div>
      </VmShell>
    );
  const sourceCrumb = { label: SOURCE_LABEL[batch.source], href: `${root}?source=${batch.source}` };
  const batchCrumb = { label: `Batch ${batch.id}`, href: `${root}/${batch.id}` };
  return (
    <VmShell source={batch.source} breadcrumb={recordId ? [sourceCrumb, batchCrumb, { label: recordId }] : [sourceCrumb, { label: batchCrumb.label }]}>
      {/* Decisions live in the browser: wait for them, so a reviewed batch never flashes as unreviewed. */}
      {!hydrated ? null : recordId ? record ? <VmRecordPage key={record.id} batch={batch} record={record} /> : <VmRecordNotFound batch={batch} id={recordId} /> : <VmBatchPage key={batch.id} batch={batch} />}
    </VmShell>
  );
}

export function VmListRoute({ option = "1" }: { option?: VmOption }) {
  return (
    <VmRootProvider option={option}>
      <Suspense fallback={null}>
        <ListScreen />
      </Suspense>
    </VmRootProvider>
  );
}

export function VmBatchRoute({ option = "1" }: { option?: VmOption }) {
  return (
    <VmRootProvider option={option}>
      <Suspense fallback={null}>
        <BatchScreen />
      </Suspense>
    </VmRootProvider>
  );
}
