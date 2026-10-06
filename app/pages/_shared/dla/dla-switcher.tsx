"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { useDlaScope } from "@/app/pages/_shared/dla/dla-scope";
import { requestorName } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { useRoleHref } from "@/lib/use-role-href";
import { DLA_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a request's record page: a searchable switcher over the requests the DLA list
// shows this role (the same scope rule as `DlaAllList`: a reviewer opens on all, everyone else on their
// own, and `?scope=` wins when it is in the URL), by request ID with the requestor's organisation beside
// it, with the current one ticked and a "View all requests" bar to the list. Picking a request opens it.
export function DlaSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const dlas = useDlas();
  const { scope } = useDlaScope();

  const items = useMemo(
    () =>
      dlas
        .filter((d) => scope === "all" || requestorName(d.requestor) === CURRENT_USER_NAME)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((d) => ({ id: d.id, label: d.id, addon: d.requestor.organisation || undefined })),
    [dlas, scope],
  );

  return (
    <BreadcrumbSwitcher
      label={DLA_SECTION_LABEL}
      ariaLabel="Switch request"
      placeholder="Search requests"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`/pages/dla/${id}`))}
      viewAllLabel="View all requests"
      onViewAll={() => router.push(roleHref("/pages/dla"))}
    />
  );
}
