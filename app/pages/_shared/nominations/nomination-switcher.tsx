"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { inNominationScope, useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { speciesFor } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useRoleHref } from "@/lib/use-role-href";
import { useNominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { NOMINATION_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a nomination's record page: a searchable switcher over the nominations the list
// shows this role (the same rule as `NominationList`: All is the organisation's submitted nominations, or everyone's for
// the admin, plus their own drafts; My is their own), by species name A-Z with the nomination ID beside it, with
// the current one ticked and a "View all nominations" bar to the list. Picking a nomination opens it.
export function NominationSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nominations = useNominations();
  const { base } = useNominationVersion();
  const { scope, organisation } = useNominationScope();

  const items = useMemo(
    () =>
      nominations
        .filter((n) => inNominationScope(n, scope, organisation))
        .map((n) => ({ id: n.id, label: speciesFor(n.speciesId)?.commonName ?? "Species not chosen", addon: n.id }))
        .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),
    [nominations, scope, organisation],
  );

  return (
    <BreadcrumbSwitcher
      label={NOMINATION_SECTION_LABEL}
      ariaLabel="Switch nomination"
      placeholder="Search nominations"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`${base}/${id}`))}
      viewAllLabel="View all nominations"
      onViewAll={() => router.push(roleHref(base))}
    />
  );
}
