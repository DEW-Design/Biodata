"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { BATCHES, SOURCE_LABEL, VM_ROOT } from "@/app/pages/_shared/vouchers/vm-data";
import { useRoleHref } from "@/lib/use-role-href";
import { VOUCHER_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a scan batch's page (and of a record in it): a searchable switcher over every batch the list shows, newest
// first, with its source beside it, the current one ticked and a "View all batches" bar to the list. Picking a batch opens it.
export function BatchSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();

  const items = useMemo(
    () =>
      [...BATCHES]
        .sort((a, b) => b.ranOn.localeCompare(a.ranOn) || b.id.localeCompare(a.id))
        .map((b) => ({ id: b.id, label: `Batch ${b.id}`, addon: SOURCE_LABEL[b.source] })),
    [],
  );

  return (
    <BreadcrumbSwitcher
      label={VOUCHER_SECTION_LABEL}
      ariaLabel="Switch batch"
      placeholder="Search batches"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`${VM_ROOT}/${id}`))}
      viewAllLabel="View all batches"
      onViewAll={() => router.push(roleHref(VM_ROOT))}
    />
  );
}
