"use client";

// The Species tab: every species this project has recorded, from its occurrences in Project records.
// Built from Option 2's Species view (Explore's species results): the group tiles on top, each one a
// quick filter (click again to clear). Below them, the same collection toolbar as Project records and
// Artefacts (CONTRACTS 4.2c): the Cards / Table switch, the 384px search and the Filter button.
//
// A species appears once, however many occurrences it has. "Go to record" opens its occurrence in
// Project records; a species with more than one occurrence offers them in a menu. A species with a
// restricted occurrence (a generalised location) is marked Restricted.

import { useMemo, useState } from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  type SortDescriptor,
} from "react-aria-components";
import {
  ArrowNarrowRight,
  ChevronDown,
  LayoutGrid01,
  Lock01,
  Table as TableIcon,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Table, TableCard } from "@/components/application/table/table";
import {
  ListFilterButton,
  matchesFilters,
  optionsFromValues,
  type FilterSection,
  type FilterSelection,
} from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { MetricTile } from "@/app/pages/_shared/map-search/metric-tile";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import type { SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import { useEditStore } from "./edit-store";
import { NSX_SPECIES } from "./field-schema";
import { formatDate, type SurveyRecord } from "./survey-data";
import { segmentClass, segmentTrayClass } from "./segmented";

const GROUPS: SpeciesGroup[] = [
  "Mammal",
  "Bird",
  "Reptile",
  "Amphibian",
  "Plant",
];

interface SpeciesRow {
  id: string;
  common: string;
  scientific: string;
  family: string;
  group: SpeciesGroup;
  occurrences: SurveyRecord[];
  types: string[];
  sites: string[];
  lastRecorded: string;
  restricted: boolean;
}

export function useProjectSpecies(): SpeciesRow[] {
  const { records, ancestorsOf } = useEditStore();
  return useMemo(() => {
    const bySpecies = new Map<string, SurveyRecord[]>();
    for (const r of records) {
      if (r.kind !== "occurrence" || !r.scientificName) continue;
      bySpecies.set(r.scientificName, [
        ...(bySpecies.get(r.scientificName) ?? []),
        r,
      ]);
    }
    return [...bySpecies.entries()].map(([scientific, occ]) => {
      const sp = NSX_SPECIES.find((s) => s.scientific === scientific);
      const sorted = [...occ].sort((a, b) => b.date.localeCompare(a.date));
      const sites = [
        ...new Set(
          occ.flatMap((o) =>
            ancestorsOf(o)
              .filter((a) => a.kind === "event" && a.type === "Site")
              .map((a) => a.name),
          ),
        ),
      ];
      return {
        id: scientific,
        common: sp?.common ?? occ[0].name,
        scientific,
        family: sp?.family ?? "Not provided",
        group: sp?.group ?? "Plant",
        occurrences: sorted,
        types: [...new Set(occ.map((o) => o.type))],
        sites,
        lastRecorded: sorted[0].date,
        restricted: occ.some((o) => !!o.locationNote),
      };
    });
  }, [records, ancestorsOf]);
}

/** "Go to record": straight to the occurrence, or a menu when there are several. */
function GoToRecord({
  row,
  onOpenRecord,
}: {
  row: SpeciesRow;
  onOpenRecord: (id: string) => void;
}) {
  if (row.occurrences.length === 1)
    return (
      <Button
        color="link-color"
        size="sm"
        className="w-max"
        iconTrailing={ArrowNarrowRight}
        onClick={() => onOpenRecord(row.occurrences[0].id)}
      >
        Go to record
      </Button>
    );
  return (
    <Dropdown.Root>
      <Button
        color="link-color"
        size="sm"
        className="w-max"
        iconTrailing={ChevronDown}
        aria-label={`Go to a record of ${row.common}`}
      >
        Go to record
      </Button>
      <Dropdown.Popover placement="bottom left" className="w-72">
        <Dropdown.Menu
          aria-label={`Records of ${row.common}`}
          onAction={(key) => onOpenRecord(String(key))}
        >
          {row.occurrences.map((o) => (
            <Dropdown.Item
              key={o.id}
              id={o.id}
              label={`${o.code} · ${o.type}`}
              addon={formatDate(o.date)}
            />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

const recordsLabel = (n: number) => `${n} record${n === 1 ? "" : "s"}`;

export function SpeciesView({
  onOpenRecord,
}: {
  onOpenRecord: (recordId: string) => void;
}) {
  const all = useProjectSpecies();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [group, setGroup] = useState<SpeciesGroup | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({
    column: "common",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const getters = {
    family: (r: SpeciesRow) => r.family,
    type: (r: SpeciesRow) => r.types,
    site: (r: SpeciesRow) => r.sites,
    access: (r: SpeciesRow) => (r.restricted ? "restricted" : "public"),
  };
  const sections: FilterSection[] = [
    {
      id: "family",
      label: "Family",
      options: optionsFromValues(all.map((r) => r.family)),
    },
    {
      id: "type",
      label: "Occurrence type",
      options: optionsFromValues(all.flatMap((r) => r.types)),
    },
    {
      id: "site",
      label: "Site",
      options: optionsFromValues(all.flatMap((r) => r.sites)),
    },
    {
      id: "access",
      label: "Access",
      options: [
        { id: "public", label: "Public" },
        { id: "restricted", label: "Restricted" },
      ],
    },
  ];
  const q = query.trim().toLowerCase();
  // The tiles count what the search and Filter leave, so a tile never zeroes the others.
  const filtered = all.filter(
    (r) =>
      matchesFilters(r, filter, getters) &&
      (!q ||
        `${r.common} ${r.scientific} ${r.family}`.toLowerCase().includes(q)),
  );
  const groupCounts = new Map(
    GROUPS.map((g) => [g, filtered.filter((r) => r.group === g).length]),
  );
  const rows = [...filtered.filter((r) => !group || r.group === group)].sort(
    (a, b) => {
      const key = sort.column as string;
      const va =
        key === "records"
          ? a.occurrences.length
          : key === "last"
            ? a.lastRecorded
            : String(a[key as keyof SpeciesRow] ?? "");
      const vb =
        key === "records"
          ? b.occurrences.length
          : key === "last"
            ? b.lastRecorded
            : String(b[key as keyof SpeciesRow] ?? "");
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sort.direction === "ascending" ? cmp : -cmp;
    },
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const paged = rows.slice((current - 1) * pageSize, current * pageSize);
  const reset = () => setPage(1);

  const restrictedBadge = (
    <Badge size="sm" color="warning">
      <span className="inline-flex items-center gap-1">
        <Lock01 className="size-3" />
        Restricted
      </span>
    </Badge>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-balance text-tertiary">
        Every species this project has recorded, from its occurrences in Survey
        records. &ldquo;Go to record&rdquo; opens the occurrence.
      </p>

      <div className="flex items-stretch gap-2">
        {GROUPS.map((g) => (
          <MetricTile
            key={g}
            icon={SPECIES_GROUP_ICON[g]}
            label={g}
            value={groupCounts.get(g) ?? 0}
            active={group === g}
            onClick={() => {
              setGroup(group === g ? null : g);
              reset();
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          aria-label="Species view"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[view]}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next === "cards" || next === "table") setView(next);
          }}
          className={segmentTrayClass}
        >
          <ToggleButton id="cards" className={segmentClass}>
            <LayoutGrid01 className="size-4" />
            Cards
          </ToggleButton>
          <ToggleButton id="table" className={segmentClass}>
            <TableIcon className="size-4" />
            Table
          </ToggleButton>
        </ToggleButtonGroup>
        <ToolbarSearch
          label="Search species"
          placeholder="Search by common name, scientific name or family"
          value={query}
          onChange={(v) => {
            setQuery(v);
            reset();
          }}
        />
        <ListFilterButton
          sections={sections}
          selection={filter}
          onChange={(next) => {
            setFilter(next);
            reset();
          }}
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-secondary p-10 text-center">
          <p className="text-sm font-medium text-primary">No species match</p>
          <p className="text-sm text-tertiary">
            Try another search, filter or group.
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4"
            >
              <div className="flex items-start gap-3">
                <SpeciesPhoto
                  scientificName={r.scientific}
                  alt={r.common}
                  fallbackIcon={SPECIES_GROUP_ICON[r.group]}
                  className="size-14"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                    {r.common}
                    {r.restricted && restrictedBadge}
                  </p>
                  <p className="text-sm text-tertiary italic">{r.scientific}</p>
                  <p className="text-xs text-quaternary">
                    {r.family} · {r.group}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                <dt className="text-tertiary">Records</dt>
                <dd className="text-primary">
                  {recordsLabel(r.occurrences.length)} · {r.types.join(", ")}
                </dd>
                <dt className="text-tertiary">Sites</dt>
                <dd
                  className="truncate text-primary"
                  title={r.sites.join(", ")}
                >
                  {r.sites.join(", ") || "Not provided"}
                </dd>
                <dt className="text-tertiary">Last recorded</dt>
                <dd className="text-primary">{formatDate(r.lastRecorded)}</dd>
              </dl>
              <GoToRecord row={r} onOpenRecord={onOpenRecord} />
            </div>
          ))}
        </div>
      ) : (
        <TableCard.Root className="flex max-h-[calc(100dvh-16rem)] min-h-48 flex-col">
          <Table
            aria-label="Species"
            bodyScrollable
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              reset();
            }}
          >
            <Table.Header sticky>
              <Table.Head
                id="common"
                label="Species"
                isRowHeader
                allowsSorting
              />
              <Table.Head id="family" label="Family" allowsSorting />
              <Table.Head id="group" label="Group" allowsSorting />
              <Table.Head id="records" label="Records" allowsSorting />
              <Table.Head id="sites" label="Sites" />
              <Table.Head id="last" label="Last recorded" allowsSorting />
              <Table.Head id="access" label="Access" />
              <Table.Head id="go" label="" />
            </Table.Header>
            <Table.Body items={paged}>
              {(r) => (
                <Table.Row id={r.id} textValue={r.common}>
                  <Table.Cell>
                    <span className="flex min-w-0 items-center gap-3">
                      <SpeciesPhoto
                        scientificName={r.scientific}
                        alt={r.common}
                        fallbackIcon={SPECIES_GROUP_ICON[r.group]}
                        className="size-9"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-primary">
                          {r.common}
                        </span>
                        <span className="truncate text-xs text-tertiary italic">
                          {r.scientific}
                        </span>
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-tertiary">{r.family}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-tertiary">{r.group}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm whitespace-nowrap text-tertiary">
                      {recordsLabel(r.occurrences.length)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-tertiary">
                      {r.sites.join(", ") || "Not provided"}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm whitespace-nowrap text-tertiary">
                      {formatDate(r.lastRecorded)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {r.restricted ? (
                      restrictedBadge
                    ) : (
                      <span className="text-sm text-tertiary">Public</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <GoToRecord row={r} onOpenRecord={onOpenRecord} />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <TableCard.PaginationNumbered
            page={current}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              reset();
            }}
            pageSizeOptions={[10, 25, 50]}
            totalCount={rows.length}
          />
        </TableCard.Root>
      )}
    </div>
  );
}
