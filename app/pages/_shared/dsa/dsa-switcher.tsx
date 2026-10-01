"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { CURRENT_USER_NAME, useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { contactName } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { useRoleHref } from "@/lib/use-role-href";
import { DSA_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of an agreement's record page: a searchable switcher over the agreements the DSA
// list shows (the same scope rule as `DsaAllList`: all, unless `?scope=mine` is in the URL), by
// agreement ID with the data partner beside it, with the current one ticked and a "View all agreements"
// bar to the list. Picking an agreement opens it.
export function DsaSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const dsas = useDsas();
  const scope = useAgreementScope("all");

  const items = useMemo(
    () =>
      dsas
        .filter((d) => scope === "all" || contactName(d.requestedBy) === CURRENT_USER_NAME)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((d) => ({ id: d.id, label: d.id, addon: d.partner || undefined })),
    [dsas, scope],
  );

  return (
    <BreadcrumbSwitcher
      label={DSA_SECTION_LABEL}
      ariaLabel="Switch agreement"
      placeholder="Search agreements"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`/pages/dsa/${id}`))}
      viewAllLabel="View all agreements"
      onViewAll={() => router.push(roleHref("/pages/dsa"))}
    />
  );
}
