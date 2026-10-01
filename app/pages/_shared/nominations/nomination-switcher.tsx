"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { CURRENT_USER_NAME, useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { speciesFor } from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useRoleHref } from "@/lib/use-role-href";
import { NOMINATION_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a nomination's record page: a searchable switcher over the nominations the list
// shows this role (the same rule as `NominationList`: the panel sees every submitted nomination and its
// own drafts, everyone else only their own), by species name A-Z with the nomination ID beside it, with
// the current one ticked and a "View all nominations" bar to the list. Picking a nomination opens it.
export function NominationSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nominations = useNominations();
  const canReview = useFeatureAccess("nominationReview");
  const requested = useAgreementScope(canReview ? "all" : "mine");
  const scope = canReview ? requested : "mine";

  const items = useMemo(
    () =>
      nominations
        .filter((n) => (scope === "mine" ? n.nominator.name === CURRENT_USER_NAME : n.status !== "draft" || n.nominator.name === CURRENT_USER_NAME))
        .map((n) => ({ id: n.id, label: speciesFor(n.speciesId)?.commonName ?? "Species not chosen", addon: n.id }))
        .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),
    [nominations, scope],
  );

  return (
    <BreadcrumbSwitcher
      label={NOMINATION_SECTION_LABEL}
      ariaLabel="Switch nomination"
      placeholder="Search nominations"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`/pages/nominations/${id}`))}
      viewAllLabel="View all nominations"
      onViewAll={() => router.push(roleHref("/pages/nominations"))}
    />
  );
}
