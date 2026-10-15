"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Tabs, type SortDescriptor } from "react-aria-components";
import { Clock, Feather, MessageAlertCircle, Plus, SearchLg, Calendar, Flag01, Lock01, User01, ChevronDown, MarkerPin01, MarkerPin04 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tab, TabList } from "@/components/application/tabs/tabs";
import { geoExtentSummary } from "@/app/pages/project-registration/geo-extent-picker";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ExplainerCard } from "@/app/pages/_shared/explainer-card";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { CURRENT_USER_NAME, sortRows, type AgreementScope, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { inNominationScope } from "@/app/pages/_shared/nominations/nomination-scope";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { monthOptions, optionsFromValues, useListFilter, type FilterGetters, type FilterSection } from "@/app/pages/_shared/list-filter";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import {
  formatShortDate,
  nominationStatusMeta,
  nominationStatusOrder,
  kindOf,
  nominationSubject,
  protectionMeta,
  speciesFor,
  type Nomination,
  type NominationKind,
  type NominationStatus,
  type ProtectionScope,
} from "@/app/pages/_shared/nominations/nomination-data";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { SPECIES_GROUP_OPTIONS } from "@/app/pages/project-registration/data";
import { useRoleHref } from "@/lib/use-role-href";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useNominationVersion } from "@/app/pages/_shared/nominations/nomination-version";
import { NOMINATION_SECTION_LABEL } from "@/lib/registered-user-nav";
import { RiskBadge } from "@/app/pages/_shared/nominations/nomination-rating-fields";
import { ACCESS_LEVEL_ORDER, RELEASE_RISK_ORDER, accessLevelMeta, currentSpeciesRating, ratingSummary, releaseRiskMeta, type Rating } from "@/app/pages/_shared/nominations/nomination-rating";

// The nominations list: Section header, search and filter, then the table (CONTRACTS 4.2), fitting
// the viewport with rows scrolling under a sticky header. A row opens the record. Every status is in
// one table; the status is a filter, not a place, as on the DLA and DSA lists.
// Version 2 (the designer, 12 Oct 2026):
// - A species or a location is nominated: "Nominate" opens a menu, Sensitive species or Sensitive location, each the same form
//   and steps (version 2's /new, ?kind=location). Version 1 keeps "Nominate a new species".
// - Underline tabs, Species and Locations, each its own table with its own search and filter; All and My stay in column 2.
// - For both admin roles, Data release risk and User access level columns: a species' current rating, its accepted nominations'
//   ratings merged (the highest, where it is rated by attribute), a location's once it is accepted, else "Not rated". The Status
//   column is wide enough for its longest badge, "Returned for more information" (it ran into Updated before).

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
  return <ExplainerCard id="how-a-nomination-is-reviewed" title="How a nomination is reviewed" steps={REVIEW_STEPS} />;
}

/** What needs attention: nominations waiting for the panel (reviewers), or returned to the nominator for more information. */
export function NominationBanner({ canReview }: { canReview: boolean }) {
  const all = useNominations();
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();
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
        actionHref={roleHref(`${base}?scope=all&status=submitted`)}
      />
    );
  if (!canReview && returned.length > 0) {
    const first = returned[0];
    return (
      <TaskItem
        icon={MessageAlertCircle}
        title={returned.length === 1 ? `${nominationSubject(first)} needs more information` : `${returned.length} nominations need more information`}
        detail="The panel returned it to you. Update it and submit it again."
        status={nominationStatusMeta.returned.label}
        statusColor={nominationStatusMeta.returned.badgeColor}
        actionLabel={returned.length === 1 ? "Update nomination" : "View nominations"}
        actionHref={roleHref(returned.length === 1 ? `${base}/${first.id}` : `${base}?status=returned`)}
      />
    );
  }
  return null;
}

/** The list. Version 2 holds which tab is open; the table and its search and filter are `ListBody`,
 *  remounted per tab so each kind keeps its own columns and filter. */
export function NominationList({ scope, organisation, initialStatuses = [], canReview }: { scope: AgreementScope; organisation: string | null; initialStatuses?: NominationStatus[]; canReview: boolean }) {
  const { version } = useNominationVersion();
  const all = useNominations();
  const [tab, setTab] = useState<NominationKind>("species");
  const inScope = all.filter((n) => inNominationScope(n, scope, organisation));
  const count = (kind: NominationKind) => inScope.filter((n) => kindOf(n) === kind).length;

  const tabs =
    version >= 2 ? (
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as NominationKind)} className="shrink-0">
        <TabList aria-label="Nomination kind" type="underline" size="md">
          <Tab id="species" label="Species" icon={Feather} badge={count("species")} />
          <Tab id="location" label="Locations" icon={MarkerPin04} badge={count("location")} />
        </TabList>
      </Tabs>
    ) : null;

  return (
    <ListBody
        key={tab}
        kind={tab}
        tabs={tabs}
        scope={scope}
        organisation={organisation}
        initialStatuses={initialStatuses}
        canReview={canReview}
      />
  );
}

/** Version 2's create action: one button, a menu of the two kinds. */
function NominateMenu() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const { base } = useNominationVersion();
  return (
    <Dropdown.Root>
      <Button color="primary" iconLeading={Plus} iconTrailing={ChevronDown}>
        Nominate
      </Button>
      <Dropdown.Popover placement="bottom end" className="w-56">
        <Dropdown.Menu aria-label="Nominate" onAction={(key) => router.push(roleHref(key === "location" ? `${base}/new?kind=location` : `${base}/new`))}>
          <Dropdown.Item id="species" label="Sensitive species" icon={Feather} />
          <Dropdown.Item id="location" label="Sensitive location" icon={MarkerPin01} />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

const NOT_RATED = -1;

function ListBody({
  kind,
  tabs,
  scope,
  organisation,
  initialStatuses,
  canReview,
}: {
  kind: NominationKind;
  tabs: ReactNode;
  scope: AgreementScope;
  organisation: string | null;
  initialStatuses: NominationStatus[];
  canReview: boolean;
}) {
  const all = useNominations();
  const roleHref = useRoleHref();
  const { base, version } = useNominationVersion();
  // The rating columns: BioData Admin and Super Admin only (`nominationRating`), never anyone else.
  const canRate = useFeatureAccess("nominationRating");
  const showsRating = version >= 2 && canRate;
  /** What protects it now: a species' current rating (its accepted nominations' ratings merged), a location's once accepted. */
  const ratingOfRow = (n: Nomination): Rating | undefined =>
    kindOf(n) === "location" ? (n.status === "accepted" ? n.ratings?.location : undefined) : ratingSummary(currentSpeciesRating(all, n.speciesId));
  // Someone else's draft isn't submitted yet, so it isn't anyone else's to see; All is the organisation's (everyone's for the admin).
  // Version 1 lists species only.
  const inScope = all.filter((n) => inNominationScope(n, scope, organisation) && (version >= 2 || kindOf(n) === "species"));
  const scoped = inScope.filter((n) => kindOf(n) === kind);
  const isLocation = kind === "location";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "updated", direction: "descending" });

  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", icon: Flag01, options: nominationStatusOrder.map((id) => ({ id, label: nominationStatusMeta[id].label })) },
    ...(isLocation
      ? []
      : [
          { id: "group", label: "Species group", icon: Feather, options: SPECIES_GROUP_OPTIONS.map((g) => ({ id: g, label: g })) },
          { id: "protection", label: "Protection", icon: Lock01, options: (Object.keys(protectionMeta) as ProtectionScope[]).map((id) => ({ id, label: protectionMeta[id].label })) },
        ]),
    { id: "nominator", label: "Nominated by", icon: User01, searchable: true, options: optionsFromValues(scoped.map((n) => n.nominator.name)) },
    { id: "updated", label: "Updated", icon: Calendar, options: monthOptions(scoped.map((n) => n.updatedAt)) },
  ];
  const filter = useListFilter(filterSections, filterGetters, () => setPage(1), { status: new Set<string>(initialStatuses) });

  const query = search.trim().toLowerCase();
  const matching = scoped
    .filter(filter.matches)
    .filter((n) => {
      if (!query) return true;
      return [n.id, nominationSubject(n), n.speciesId, n.nominator.name].some((v) => v.toLowerCase().includes(query));
    });
  const rows = sortRows(matching, sort, {
    ...sortKeys,
    species: (n) => nominationSubject(n),
    area: (n) => (n.location ? geoExtentSummary(n.location.extent) : ""),
    risk: (n) => {
      const r = ratingOfRow(n);
      return r ? RELEASE_RISK_ORDER.indexOf(r.risk) : NOT_RATED;
    },
    access: (n) => {
      const r = ratingOfRow(n);
      return r ? ACCESS_LEVEL_ORDER.indexOf(r.access) : NOT_RATED;
    },
  });
  // Column widths for each layout (a fixed layout, 4.2f): species or location, with or without the two rating columns.
  const w = showsRating
    ? { id: "w-[11%]", subject: "w-[14%]", second: "w-[11%]", nominator: "w-[12%]", risk: "w-[11%]", access: "w-[12%]", status: "w-[18%]", updated: "w-[11%]" }
    : { id: "w-[16%]", subject: "w-[16%]", second: "w-[13%]", nominator: "w-[14%]", risk: "", access: "", status: "w-[28%]", updated: "w-[13%]" };
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const ratingCells = (n: Nomination) => {
    const r = ratingOfRow(n);
    return (
      <>
        <Table.Cell>
          {r ? (
            <div className="flex flex-col items-start gap-1">
              <RiskBadge risk={r.risk} />
              {r.risk !== "negligible" && <span className="text-xs text-quaternary">{releaseRiskMeta[r.risk].short}</span>}
            </div>
          ) : (
            <span className="text-sm text-quaternary">Not rated</span>
          )}
        </Table.Cell>
        <Table.Cell>
          {r ? (
            <span className={r.access === "level-1" ? "text-sm text-tertiary" : "text-sm text-secondary"}>{accessLevelMeta[r.access].label}</span>
          ) : (
            <span className="text-sm text-quaternary">Not rated</span>
          )}
        </Table.Cell>
      </>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{NOMINATION_SECTION_LABEL}</SectionHeader.Heading>
              <CountBadge count={version >= 2 ? inScope.length : rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>
              {scope === "mine" ? `${version >= 2 ? "Species and locations" : "Species"} you nominated, and where each one is in review.` : organisation ? `Nominations from ${organisation}, across every status.` : "Every nomination, across every status."}
            </SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            {version >= 2 ? (
              <NominateMenu />
            ) : (
              <Button color="primary" iconLeading={Plus} href={roleHref("/pages/nominations/new")}>
                Nominate a new species
              </Button>
            )}
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {inScope.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
          <div className="flex max-w-md flex-col items-center gap-4">
            <FeaturedIcon icon={Feather} theme="modern" color="gray" size="lg" />
            <div className="flex flex-col gap-2">
              <h2 className="m-0! text-lg! font-semibold! tracking-normal! text-primary!">{scope === "mine" ? `You haven't nominated ${version >= 2 ? "anything" : "a species"} yet` : "No nominations yet"}</h2>
              <p className="text-sm text-balance text-tertiary">
                Nominate a species when its records could put it at risk, such as nest sites or small populations. The panel decides what gets protected.
              </p>
            </div>
          </div>
          {version >= 2 ? (
            <NominateMenu />
          ) : (
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/nominations/new")}>
              Nominate a new species
            </Button>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <NominationBanner canReview={canReview} />
          {!canReview && <ReviewSteps />}
          {tabs}
          {scoped.length === 0 ? (
            <ListEmptyState
              icon={isLocation ? MarkerPin04 : Feather}
              title={isLocation ? "No location nominations yet" : "No species nominations yet"}
              description={isLocation ? "A location nominated with Nominate, Sensitive location, is listed here." : "A species nominated with Nominate, Sensitive species, is listed here."}
            />
          ) : (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <ToolbarSearch
                  label="Search nominations"
                  placeholder={isLocation ? "Search ID, location or nominator" : "Search ID, species or nominator"}
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                />
                <FilterMenu filter={filter} />
              </div>
              <AttributeFilterChips filter={filter} />
              {rows.length === 0 ? (
                <ListEmptyState
                  icon={SearchLg}
                  title="No nominations match"
                  description="Try a different search, or remove a filter."
                  action={{
                    label: isLocation ? "Show all location nominations" : "Show all nominations",
                    onPress: () => {
                      setSearch("");
                      filter.clear();
                      setPage(1);
                    },
                  }}
                />
              ) : (
                <TableCard.Root className="flex min-h-48 flex-1 flex-col">
                  <Table
                    bodyScrollable
                    layout="fixed"
                    className={showsRating ? "min-w-[1340px]" : "min-w-[960px]"}
                    aria-label={isLocation ? "Sensitive location nominations" : "Sensitive species nominations"}
                    sortDescriptor={sort}
                    onSortChange={(next) => {
                      setSort(next);
                      setPage(1);
                    }}
                  >
                    <Table.Header sticky>
                      <Table.Head id="id" label="Nomination" isRowHeader className={w.id} />
                      <Table.Head id="species" label={isLocation ? "Location" : "Species"} allowsSorting className={w.subject} />
                      {isLocation ? <Table.Head id="area" label="Area" allowsSorting className={w.second} /> : <Table.Head id="protection" label="Protection" allowsSorting className={w.second} />}
                      <Table.Head id="nominator" label="Nominated by" allowsSorting className={w.nominator} />
                      {showsRating ? <Table.Head id="risk" label="Data release risk" allowsSorting className={w.risk} /> : null}
                      {showsRating ? <Table.Head id="access" label="User access level" allowsSorting className={w.access} /> : null}
                      <Table.Head id="status" label="Status" allowsSorting className={w.status} />
                      <Table.Head id="updated" label="Updated" allowsSorting className={w.updated} />
                    </Table.Header>
                    <Table.Body items={paged}>
                      {(n) => {
                        const species = speciesFor(n.speciesId);
                        return (
                          <Table.Row id={n.id} href={roleHref(`${base}/${n.id}`)} textValue={`${n.id} ${nominationSubject(n)}`} className="group data-[href]:cursor-pointer">
                            <Table.Cell>
                              <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{n.id}</span>
                            </Table.Cell>
                            <Table.Cell>
                              {isLocation ? (
                                <div className="flex items-center gap-3">
                                  <FeaturedIcon icon={MarkerPin01} theme="modern" color="gray" size="sm" />
                                  <span className="min-w-0 text-sm text-secondary">{nominationSubject(n)}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  {species && <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-8" />}
                                  <div className="flex min-w-0 flex-col">
                                    <span className="text-sm text-secondary">{species?.commonName ?? "Species not chosen"}</span>
                                    {species && <span className="text-xs text-quaternary italic">{species.species}</span>}
                                  </div>
                                </div>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <span className="line-clamp-2 text-sm text-tertiary">{isLocation ? (n.location ? geoExtentSummary(n.location.extent) : "Not provided") : protectionMeta[n.scope].label}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-col">
                                <span className="text-sm text-secondary">{n.nominator.name}</span>
                                {n.nominator.organisation && <span className="text-xs text-quaternary">{n.nominator.organisation}</span>}
                              </div>
                            </Table.Cell>
                            {showsRating ? ratingCells(n) : null}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
