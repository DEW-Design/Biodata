"use client";

// The four collections that become grouped rows at step 4 (grouped-list.tsx), from the same stores and the same scope rules as
// the real lists: Projects, Data Licencing Agreements, Data Sharing Agreements and Nominations, grouped by status in the status
// order each already has. Row ids and links are the real ones, so a project opens in this tab and a request or agreement opens its
// real page. A status that has no rows has no group. The real lists' filter menu and column sorting are not carried over.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { agreementStatusOrder } from "@/app/pages/_shared/agreement-status";
import { useAllProjects } from "@/app/pages/_shared/created-projects-store";
import { dlaStatusMeta, requestorName } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { dsaStatusMeta } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { nominationStatusMeta, nominationStatusOrder } from "@/app/pages/_shared/nominations/nomination-data";
import { inNominationScope, useNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { useRoleHref } from "@/lib/use-role-href";
import { GroupedList, shortDate, type ListGroup, type ListRow } from "./grouped-list";

const PROJECT_STATUS_ORDER = ["Active", "Under review", "Draft", "Completed"];

function NewButton({ href, children }: { href: string; children: string }) {
  const roleHref = useRoleHref();
  return (
    <Button size="sm" color="primary" iconLeading={Plus} href={roleHref(href)}>
      {children}
    </Button>
  );
}

export function ProjectsGrouped({ scope }: { scope: "all" | "mine" }) {
  const all = useAllProjects();
  const { rows, groups } = useMemo(() => {
    const mine = all.filter((p) => scope !== "mine" || p.contributorName === CURRENT_USER_NAME);
    const rows: ListRow[] = mine.map((p) => ({ id: p.id, group: p.status, ref: p.code, title: p.name, sub: p.org, right: p.contributorName, date: p.updated, href: p.href ?? projectDetailsPath(p.id) }));
    const statuses = [...PROJECT_STATUS_ORDER, ...mine.map((p) => p.status).filter((s) => !PROJECT_STATUS_ORDER.includes(s))];
    const groups: ListGroup[] = statuses.flatMap((s) => {
      const first = mine.find((p) => p.status === s);
      return first ? [{ id: s, label: s, color: first.statusColor }] : [];
    });
    return { rows, groups };
  }, [all, scope]);
  return <GroupedList rows={rows} groups={groups} collapsedByDefault={["Completed"]} searchLabel="Search projects" placeholder="Search projects" action={<NewButton href="/pages/project-registration">New project</NewButton>} />;
}

export function DlaGrouped({ scope, statuses }: { scope: "all" | "mine"; statuses?: string[] }) {
  const dlas = useDlas();
  const { rows, groups } = useMemo(() => {
    const mine = dlas.filter((d) => (scope !== "mine" || requestorName(d.requestor) === CURRENT_USER_NAME) && (!statuses?.length || statuses.includes(d.status)));
    const rows: ListRow[] = mine.map((d) => ({
      id: d.id,
      group: d.status,
      ref: d.id,
      title: requestorName(d.requestor) || "No requestor",
      sub: d.locations.length === 0 ? "No locations" : `${d.locations[0].name}${d.locations.length > 1 ? ` and ${d.locations.length - 1} more` : ""}`,
      right: d.requestor.organisation,
      date: shortDate(d.updatedAt),
      href: `/pages/dla/${d.id}`,
    }));
    const groups: ListGroup[] = agreementStatusOrder.filter((s) => mine.some((d) => d.status === s)).map((s) => ({ id: s, label: dlaStatusMeta[s].label, color: dlaStatusMeta[s].badgeColor }));
    return { rows, groups };
  }, [dlas, scope, statuses]);
  return <GroupedList rows={rows} groups={groups} collapsedByDefault={["closed", "cancelled", "rejected"]} searchLabel="Search requests" placeholder="Search requests" action={<NewButton href="/pages/dla/new">New request</NewButton>} />;
}

export function DsaGrouped({ scope }: { scope: "all" | "mine" }) {
  const dsas = useDsas();
  const { rows, groups } = useMemo(() => {
    const mine = dsas.filter((d) => scope !== "mine" || d.requestedBy.firstName + " " + d.requestedBy.lastName === CURRENT_USER_NAME);
    const rows: ListRow[] = mine.map((d) => ({ id: d.id, group: d.status, ref: d.id, title: d.partner, sub: d.purpose, date: shortDate(d.validTo), href: `/pages/dsa/${d.id}` }));
    const groups: ListGroup[] = agreementStatusOrder.filter((s) => mine.some((d) => d.status === s)).map((s) => ({ id: s, label: dsaStatusMeta[s].label, color: dsaStatusMeta[s].badgeColor }));
    return { rows, groups };
  }, [dsas, scope]);
  return <GroupedList rows={rows} groups={groups} collapsedByDefault={["closed", "cancelled"]} searchLabel="Search agreements" placeholder="Search agreements" action={<NewButton href="/pages/dsa/new">New agreement</NewButton>} />;
}

export function NominationsGrouped({ scope, statuses }: { scope: "all" | "mine"; statuses?: string[] }) {
  const nominations = useNominations();
  const { organisation } = useNominationScope();
  const { rows, groups } = useMemo(() => {
    const visible = nominations.filter((n) => inNominationScope(n, scope, organisation) && (!statuses?.length || statuses.includes(n.status)));
    const rows: ListRow[] = visible.map((n) => ({
      id: n.id,
      group: n.status,
      ref: n.id,
      title: REGISTRATION_SPECIES.find((s) => s.id === n.speciesId)?.commonName ?? n.speciesId,
      sub: n.nominator.name,
      right: n.nominator.organisation,
      date: shortDate(n.updatedAt),
      href: `/pages/nominations/${n.id}`,
    }));
    const groups: ListGroup[] = nominationStatusOrder.filter((s) => visible.some((n) => n.status === s)).map((s) => ({ id: s, label: nominationStatusMeta[s].label, color: nominationStatusMeta[s].badgeColor }));
    return { rows, groups };
  }, [nominations, scope, organisation, statuses]);
  return <GroupedList rows={rows} groups={groups} collapsedByDefault={["accepted", "rejected"]} searchLabel="Search nominations" placeholder="Search nominations" action={<NewButton href="/pages/nominations/new">Nominate a new species</NewButton>} />;
}
