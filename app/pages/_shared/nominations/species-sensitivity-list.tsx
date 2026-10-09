"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Selection, SortDescriptor } from "react-aria-components";
import { Edit05, Feather, LayersThree01, LockKeyholeSquare, SearchLg, Shield03, XClose } from "@untitledui/icons";
import { CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { useListFilter, type FilterGetters, type FilterSection } from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { formatShortDate } from "@/app/pages/_shared/nominations/nomination-data";
import { SENSITIVITY_PATH } from "@/app/pages/_shared/nominations/nomination-version";
import { RiskBadge } from "@/app/pages/_shared/nominations/species-sensitivity-fields";
import {
  ACCESS_LEVEL_ORDER,
  RELEASE_RISK_ORDER,
  SENSITIVITY_SPECIES,
  accessLevelMeta,
  appliesToLabel,
  ratingSummary,
  releaseRiskMeta,
  speciesSlug,
  type Rating,
  type RatingChange,
  type SpeciesRating,
} from "@/app/pages/_shared/nominations/species-sensitivity";
import { latestChanges, ratingOf, useRatingChanges } from "@/app/pages/_shared/nominations/species-sensitivity-store";
import { SPECIES_GROUP_OPTIONS, type RegistrationSpecies } from "@/app/pages/project-registration/data";
import { useRoleHref } from "@/lib/use-role-href";

// Species sensitivity, the list (BioData Super Admin only): every species with its data release risk and user access level,
// the collection pattern (CONTRACTS 4.2). BioData holds about 15,000 species and nearly all stay at the default, so the list
// is built for finding, not reading: it sorts by risk, highest first, so the rated species lead; Negligible is a gray badge so
// the rated ones stand out; search covers common, scientific and family names; the Filter menu narrows by risk, level, what
// the rating applies to, and group.
// - A rating for some attributes shows its highest risk and level, and names the attributes under "Applies to".
// - A row opens the species' page, where the rating is edited in place (no modal).
// - Bulk change: tick rows and a bar above the table names them, with "Change N species", which opens the bulk change page (the
//   same editor as a species' page: whole species or attributes with values). Once a row is ticked, a click on a row ticks it
//   (react-aria's toggle behaviour); with nothing ticked, a click opens the species. The first table in the app with bulk
//   selection (the designer asked for bulk change, 9 Oct 2026).
// - The risk column carries the treatment under the badge (Obfuscated 1 km² ...), so the obfuscation is read in the list.

interface Row {
  species: RegistrationSpecies;
  rating: SpeciesRating;
  summary: Rating;
  latest?: RatingChange;
}

const sortKeys: Record<string, (r: Row) => SortValue> = {
  species: (r) => r.species.commonName,
  appliesTo: (r) => (r.rating.appliesTo === "species" ? 0 : 1),
  risk: (r) => RELEASE_RISK_ORDER.indexOf(r.summary.risk),
  access: (r) => ACCESS_LEVEL_ORDER.indexOf(r.summary.access),
  changed: (r) => r.latest?.at ?? null,
};

const filterGetters: FilterGetters<Row> = {
  risk: (r) => r.summary.risk,
  access: (r) => r.summary.access,
  appliesTo: (r) => r.rating.appliesTo,
  group: (r) => r.species.group,
};

/** While species are ticked: which ones, and the way to change them together (the bulk change page). Sits above the table. */
function BulkBar({ names, onChange, onClear }: { names: string[]; onChange: () => void; onClear: () => void }) {
  const shown = names.slice(0, 3).join(", ");
  const more = names.length - 3;
  return (
    <div role="region" aria-label="Selected species" className="flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3">
      <p className="m-0 min-w-0 flex-1 truncate text-sm text-secondary" title={names.join(", ")}>
        <span className="font-semibold text-primary tabular-nums">{names.length} selected:</span> {shown}
        {more > 0 && ` and ${more} more`}
      </p>
      <div className="flex items-center gap-2">
        <Button color="link-gray" size="sm" iconLeading={XClose} onClick={onClear}>
          Clear selection
        </Button>
        <Button color="primary" size="sm" iconLeading={Edit05} onClick={onChange}>
          Change {names.length} species
        </Button>
      </div>
    </div>
  );
}

export function SpeciesSensitivityList() {
  const roleHref = useRoleHref();
  const changes = useRatingChanges();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "risk", direction: "descending" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const latest = latestChanges(changes);
  const all: Row[] = SENSITIVITY_SPECIES.map((species) => {
    const rating = ratingOf(latest, species.id);
    return { species, rating, summary: ratingSummary(rating), latest: latest.get(species.id) };
  });

  const filterSections: FilterSection[] = [
    { id: "risk", label: "Data release risk", icon: Shield03, options: RELEASE_RISK_ORDER.map((id) => ({ id, label: releaseRiskMeta[id].label })) },
    { id: "access", label: "User access level", icon: LockKeyholeSquare, options: ACCESS_LEVEL_ORDER.map((id) => ({ id, label: accessLevelMeta[id].label })) },
    {
      id: "appliesTo",
      label: "Applies to",
      icon: LayersThree01,
      options: [
        { id: "species", label: "Whole species" },
        { id: "attributes", label: "Specific attributes" },
      ],
    },
    { id: "group", label: "Species group", icon: Feather, options: SPECIES_GROUP_OPTIONS.map((g) => ({ id: g, label: g })) },
  ];
  const filter = useListFilter(filterSections, filterGetters, () => setPage(1));

  const query = search.trim().toLowerCase();
  const matching = all.filter(filter.matches).filter((r) => !query || [r.species.commonName, r.species.species, r.species.family].some((v) => v.toLowerCase().includes(query)));
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onSelectionChange = (keys: Selection) => setSelected(keys === "all" ? new Set([...selected, ...paged.map((r) => r.species.id)]) : new Set([...keys].map(String)));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Species sensitivity</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Each species&apos; data release risk and who sees its records as held. Every species starts at Negligible and Level 1 - Public.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search species"
            placeholder="Search common, scientific or family name"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <FilterMenu filter={filter} />
        </div>
        <AttributeFilterChips filter={filter} />
        {selected.size > 0 && (
          <BulkBar
            names={SENSITIVITY_SPECIES.filter((s) => selected.has(s.id)).map((s) => s.commonName)}
            onClear={() => setSelected(new Set())}
            onChange={() => router.push(roleHref(`${SENSITIVITY_PATH}/bulk?species=${SENSITIVITY_SPECIES.filter((s) => selected.has(s.id)).map((s) => speciesSlug(s.id)).join(",")}`))}
          />
        )}
        {rows.length === 0 ? (
          <ListEmptyState
            icon={SearchLg}
            title="No species match"
            description="Try a different name, or remove a filter."
            action={{
              label: "Show all species",
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
              className="min-w-[1000px]"
              aria-label="Species sensitivity"
              selectionMode="multiple"
              selectionBehavior="toggle"
              selectedKeys={selected}
              onSelectionChange={onSelectionChange}
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="species" label="Species" isRowHeader allowsSorting className="w-[26%]" />
                <Table.Head id="appliesTo" label="Applies to" allowsSorting className="w-[22%]" />
                <Table.Head id="risk" label="Data release risk" allowsSorting className="w-[15%]" />
                <Table.Head id="access" label="User access level" allowsSorting className="w-[18%]" />
                <Table.Head id="changed" label="Last changed" allowsSorting className="w-[19%]" />
              </Table.Header>
              <Table.Body items={paged}>
                {(r) => (
                  <Table.Row id={r.species.id} href={roleHref(`${SENSITIVITY_PATH}/${speciesSlug(r.species.id)}`)} textValue={r.species.commonName} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <SpeciesPhoto scientificName={r.species.species} alt={r.species.commonName} fallbackIcon={SPECIES_GROUP_ICON[r.species.group]} className="size-8" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{r.species.commonName}</span>
                          <span className="truncate text-xs text-quaternary italic">{r.species.species}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={r.rating.appliesTo === "species" ? "text-sm text-tertiary" : "line-clamp-2 text-sm text-secondary"} title={appliesToLabel(r.rating)}>
                        {appliesToLabel(r.rating)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col items-start gap-1">
                        <RiskBadge risk={r.summary.risk} />
                        {r.summary.risk !== "negligible" && <span className="text-xs text-quaternary">{releaseRiskMeta[r.summary.risk].short}</span>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={r.summary.access === "level-1" ? "text-sm text-tertiary" : "text-sm text-secondary"}>{accessLevelMeta[r.summary.access].label}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {r.latest ? (
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm whitespace-nowrap text-secondary">{formatShortDate(r.latest.at)}</span>
                          <span className="truncate text-xs text-quaternary">{r.latest.by}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-quaternary">Never changed</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )}
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
    </div>
  );
}
