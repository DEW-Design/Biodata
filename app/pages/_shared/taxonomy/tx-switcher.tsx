"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { TX_ROOT } from "@/app/pages/_shared/taxonomy/tx-data";
import { nodeHref, useTaxonNodes } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { useRoleHref } from "@/lib/use-role-href";
import { TAXONOMY_SECTION_LABEL } from "@/lib/registered-user-nav";

// The section crumb of a taxon's record page: a searchable switcher over the taxa the list shows (every rank), A-Z by name with
// the common name beside a species (its rank beside a higher taxon), with the current one ticked and a "View all taxa" bar to the
// list. Picking a taxon opens its page. The id is the taxon's path of names (tx-hierarchy.ts), so the page is one static route.
export function TaxonSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nodes = useTaxonNodes();

  const items = useMemo(
    () =>
      nodes
        .map((n) => ({ id: n.id, label: n.name, addon: n.taxon?.common || n.rank }))
        .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),
    [nodes],
  );

  return (
    <BreadcrumbSwitcher
      label={TAXONOMY_SECTION_LABEL}
      ariaLabel="Switch taxon"
      placeholder="Search taxa"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(nodeHref(id)))}
      viewAllLabel="View all taxa"
      onViewAll={() => router.push(roleHref(TX_ROOT))}
    />
  );
}
