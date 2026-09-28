"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Clock, Feather, MessageAlertCircle, Plus, SearchMd } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { CURRENT_USER_NAME, sortRows, type AgreementScope, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { ListFilterButton, matchesFilters, monthOptions, optionsFromValues, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import {
  formatShortDate,
  nominationStatusMeta,
  nominationStatusOrder,
  protectionMeta,
  speciesFor,
  type Nomination,
  type NominationStatus,
  type ProtectionScope,
} from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { SPECIES_GROUP_OPTIONS } from "@/app/pages/project-registration/data";
import { useRoleHref } from "@/lib/use-role-href";

// The nominations list: Section header, search and filter, then the table (CONTRACTS 4.2), fitting
// the viewport with rows scrolling under a sticky header. A row opens the record. Every status is in
// one table; the status is a filter, not a place, as on the DLA and DSA lists.

const sortKeys: Record<string, (n: Nomination) => SortValue> = {
  species: (n) => speciesFor(n.speciesId)?.commonName ?? n.speciesId,
  protection: (n) => n.scope,
  nominator: (n) => n.nominator.name,
  status: (n) => nominationStatusOrder.indexOf(n.status),
  updated: (n) => n.updatedAt,
};

const filterGetters: FilterGetters<Nomination> = {
  status: (n) => n.status,
  group: (n) => speciesFor(n.speciesId)?.group ?? "",
  protection: (n) => n.scope,
  nominator: (n) => n.nominator.name,
  updated: (n) => n.updatedAt.slice(0, 7),
};

const REVIEW_STEPS = [
  { title: "You submit", description: "The species, what to protect, and why." },
  { title: "The panel reviews", description: "The sensitive species panel assesses the nomination." },
  { title: "A decision", description: "Accepted, rejected, or returned to you for more information." },
];

/** How a nomination is reviewed, for someone who nominates but doesn't review. Information, so it
 *  sits above the table rather than in column 2, which is for navigation and actions only. */
function ReviewSteps() {
  return (
    <section aria-label="How a nomination is reviewed" className="shrink-0 rounded-lg border border-secondary p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">How a nomination is reviewed</p>
      <Progress.IconsWithText type="number" orientation="horizontal" size="sm" items={REVIEW_STEPS.map((step) => ({ ...step, status: "incomplete" as const }))} />
    </section>
  );
}

/** What needs attention: nominations waiting for the panel (reviewers), or returned to the nominator for more information. */
export function NominationBanner({ canReview }: { canReview: boolean }) {
  const all = useNominations();
  const roleHref = useRoleHref();
  const waiting = all.filter((n) => n.status === "submitted").length;
  const returned = all.filter((n) => n.status === "returned" && n.nominator.name === CURRENT_USER_NAME);
  if (canReview && waiting > 0)
    return (
      <TaskItem
        icon={Clock}
        title="Nominations waiting for review"
        detail={`${waiting} nomination${waiting === 1 ? " is" : "s are"} waiting for the panel to start a review.`}
        status={nominationStatusMeta.submitted.label}
        statusColor={nominationStatusMeta.submitted.badgeColor}
        actionLabel="Review nominations"
        actionHref={roleHref("/pages/nominations?scope=all&status=submitted")}
      />
    );
  if (!canReview && returned.length > 0) {
    const first = returned[0];
    return (
      <TaskItem
        icon={MessageAlertCircle}
        title={returned.length === 1 ? `${speciesFor(first.speciesId)?.commonName ?? first.id} needs more information` : `${returned.length} nominations need more information`}
        detail="The panel returned it to you. Update it and submit it again."
        status={nominationStatusMeta.returned.label}
        statusColor={nominationStatusMeta.returned.badgeColor}
        actionLabel={returned.length === 1 ? "Update nomination" : "View nominations"}
        actionHref={roleHref(returned.length === 1 ? `/pages/nominations/${first.id}` : "/pages/nominations?status=returned")}
      />
    );
  }
  return null;
}

export function NominationList({ scope, initialStatuses = [], canReview }: { scope: AgreementScope; initialStatuses?: NominationStatus[]; canReview: boolean }) {
  const all = useNominations();
  const roleHref = useRoleHref();
  // Someone else's draft isn't submitted yet, so it isn't the panel's to see.
  const scoped = scope === "mine" ? all.filter((n) => n.nominator.name === CURRENT_USER_NAME) : all.filter((n) => n.status !== "draft" || n.nominator.name === CURRENT_USER_NAME);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({ status: new Set<string>(initialStatuses) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "updated", direction: "descending" });

  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", options: nominationStatusOrder.map((id) => ({ id, label: nominationStatusMeta[id].label })) },
    { id: "group", label: "Species group", options: SPECIES_GROUP_OPTIONS.map((g) => ({ id: g, label: g })) },
    { id: "protection", label: "Protection", options: (Object.keys(protectionMeta) as ProtectionScope[]).map((id) => ({ id, label: protectionMeta[id].label })) },
    { id: "nominator", label: "Nominated by", searchable: true, options: optionsFromValues(scoped.map((n) => n.nominator.name)) },
    { id: "updated", label: "Updated", options: monthOptions(scoped.map((n) => n.updatedAt)) },
  ];

  const query = search.trim().toLowerCase();
  const matching = scoped
    .filter((n) => matchesFilters(n, filters, filterGetters))
    .filter((n) => {
      if (!query) return true;
      const species = speciesFor(n.speciesId);
      return [n.id, species?.commonName ?? "", n.speciesId, n.nominator.name].some((v) => v.toLowerCase().includes(query));
    });
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Sensitive species nominations</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{scope === "mine" ? "Species you nominated, and where each one is in review." : "Every nomination, across every status."}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/nominations/new")}>
              Nominate a new species
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {scoped.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
          <div className="flex max-w-md flex-col items-center gap-4">
            <FeaturedIcon icon={Feather} theme="modern" color="gray" size="lg" />
            <div className="flex flex-col gap-2">
              <h2 className="m-0! text-lg! font-semibold! tracking-normal! text-primary!">{scope === "mine" ? "You haven't nominated a species yet" : "No nominations yet"}</h2>
              <p className="text-sm text-balance text-tertiary">
                Nominate a species when its records could put it at risk, such as nest sites or small populations. The panel decides what gets protected.
              </p>
            </div>
          </div>
          <Button color="primary" iconLeading={Plus} href={roleHref("/pages/nominations/new")}>
            Nominate a new species
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <NominationBanner canReview={canReview} />
          {!canReview && <ReviewSteps />}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="w-full max-w-sm shrink-0">
              <Input
                aria-label="Search nominations"
                size="sm"
                icon={SearchMd}
                placeholder="Search ID, species or nominator"
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch("");
                  setPage(1);
                }}
                clearLabel="Clear search"
              />
            </div>
            <div>
              <ListFilterButton
                sections={filterSections}
                selection={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
              />
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-tertiary">No nominations match your search and filters.</p>
          ) : (
            <TableCard.Root className="flex min-h-48 flex-1 flex-col">
              <Table
                bodyScrollable
                aria-label="Sensitive species nominations"
                sortDescriptor={sort}
                onSortChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
              >
                <Table.Header sticky>
                  <Table.Head id="id" label="Nomination" isRowHeader />
                  <Table.Head id="species" label="Species" allowsSorting />
                  <Table.Head id="protection" label="Protection" allowsSorting />
                  <Table.Head id="nominator" label="Nominated by" allowsSorting />
                  <Table.Head id="status" label="Status" allowsSorting />
                  <Table.Head id="updated" label="Updated" allowsSorting />
                </Table.Header>
                <Table.Body items={paged}>
                  {(n) => {
                    const species = speciesFor(n.speciesId);
                    return (
                      <Table.Row id={n.id} href={roleHref(`/pages/nominations/${n.id}`)} textValue={`${n.id} ${species?.commonName ?? ""}`} className="group data-[href]:cursor-pointer">
                        <Table.Cell>
                          <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{n.id}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-3">
                            {species && <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-8" />}
                            <div className="flex min-w-0 flex-col">
                              <span className="text-sm text-secondary">{species?.commonName ?? "Species not chosen"}</span>
                              {species && <span className="text-xs text-quaternary italic">{species.species}</span>}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-tertiary">{protectionMeta[n.scope].label}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span className="text-sm text-secondary">{n.nominator.name}</span>
                            {n.nominator.organisation && <span className="text-xs text-quaternary">{n.nominator.organisation}</span>}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge size="sm" color={nominationStatusMeta[n.status].badgeColor}>
                            {nominationStatusMeta[n.status].label}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(n.updatedAt)}</span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  }}
                </Table.Body>
              </Table>
              <TableCard.PaginationNumbered
                page={currentPage}
                pageCount={pageCount}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                totalCount={rows.length}
              />
            </TableCard.Root>
          )}
        </div>
      )}
    </div>
  );
}
