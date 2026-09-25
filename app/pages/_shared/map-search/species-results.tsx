"use client";

// Species mode for the map search results page (app/pages/observations) - a species-first
// way to browse the same real occurrence data the Occurrences tab already shows, per direct
// request: "I want a species search results page... Find a way if we can make a toggle view to
// view results as a species mode or Projects, Events, Occurrences, Observations and Resources
// leaving what we have accomplished already." That existing 5-tab record-by-record view is
// entirely untouched - this is a new, additive sibling view, not a replacement.
//
// Structural reference: Figma file YMproGZfrFB5jUqPHPxMhk ("Biodata Wireframe Presentation" - the
// same file already treated as ground truth for this build's real Project -> Site -> Visit ->
// Occurrence data model, see CONTEXT.md's "BDBSA domain research"), node 2266:175012, three
// instances of "Observation_Map and Table View" (51:119524 base state, 2266:167054 the "All
// Filters" panel open, 2266:170314 a compact state). A wireframe, not a styled reference - per this
// codebase's own established rule for this specific file, it documents real IA/interaction shape
// (which filters exist, what the table shows, how the toolbar is organised), never colour/spacing/
// component choice. Every visual choice below comes from this codebase's own real, already-
// ingested components and tokens.
//
// Not taken from the wireframe, built from real components/tokens throughout - see the "GROUP_ICON"
// comment below for the one deliberate exception (the 5 taxonomic-group tile icons, sourced from
// `lucide-react` rather than DEW's own icon set, per direct feedback authorizing exactly that).
//
// UI follow-up, per direct feedback on the first pass: the Flora/Fauna kingdom split that used to
// sit above the 5 taxonomic-group tiles is gone (redundant - Plant already carries the whole
// "Flora" total, the other 4 groups sum to "Fauna"); every filter chip that used to open the full
// "All Filters" side panel for just one facet is now a real, inline `MultiSelect` dropdown living
// on the toolbar itself (Family/Species/Information Authority/Licence) or a small popover
// (Timeline, a date range rather than a discrete option list) - only "All Filters" still opens the
// side panel, now for a genuinely consolidated view across all 6 facets rather than the only way to
// touch any one of them; and the side panel's own accordion switched to a new `variant="compact"`
// on the shared `Accordion` component (see accordion.tsx's own doc comment) - the default
// "divided" variant's FAQ-page sizing (large titles, `gap-8` between items, a circle-glyph chevron)
// read as excessive white space and an unclear expand affordance once reused here.
//
// Second UI follow-up, per further direct feedback: the inline filter dropdowns were too narrow
// (widened below); every active selection across all 6 facets now surfaces as a removable
// "Filter name: value" pill row beneath the dropdowns (not just implied by a "(N)" count on "All
// Filters"); the count/Summary/export bar's own "N species records found" text is gone - the
// page-level header above this component already states the same count, so this was a duplicate;
// and the 5 group tiles' icons moved from DEW stand-ins to literal `lucide-react` icons (see
// GROUP_ICON below).
//
// Third UI follow-up, per further direct feedback: the 5 filter dropdowns (Family/Species/
// Information Authority/Timeline/Licence) plus "All Filters" moved off `MultiSelect` (whose own
// trigger button has no style-override hook - only the outer wrapping div takes a `className`) and
// onto a small local `FilterDropdownButton` (a real `Button color="secondary"` as a `DialogTrigger`
// trigger, a `Popover` beneath it) so they render as genuine secondary buttons, not input-styled
// select fields, each intended as a real `min-w-[220px]` - not actually applied at the time (the
// buttons only ever got `flex-1`, no floor - fixed properly in the fourth follow-up below). The
// Summary toggle is gone entirely (not just hidden) - the analytics tile row it used to gate now
// always renders. The count/Summary/export bar as its own separate boxed row is gone too; Export
// itself later moved out of this component into the page's own header row (see
// app/pages/observations/page.tsx's `runExport`) so it stays visible in Records mode too.
//
// Fourth UI follow-up, per direct feedback off a live Agentation review of this exact page: (1)
// the filter row (search box + the 6 filter dropdown buttons) moved from the top of this view down
// to sit directly above the table - it used to render first, above the DLA notice and the
// taxonomic-group tile row, which read as disconnected from the table it actually filters; (2) each
// filter button's `min-w-[220px]` floor from the third follow-up's own comment was never actually
// wired into the JSX - fixed for real this time (`min-w-[220px]` alongside the existing `flex-1`,
// so the buttons still share the row's remaining width evenly once there's more than 220px each to
// give).
//
// Fifth follow-up, per direct request: the 5 individual filter dropdown buttons (Family/Species/
// Information Authority/Timeline/Licence) are gone entirely - the filter row is now just the
// search box (unchanged `w-[480px]`) plus the single "All Filters" button. The local
// `FilterDropdownButton` component the third follow-up built is gone with them (its own JSX usages
// were the only thing calling it). None of the underlying filtering was removed - every one of
// those 6 facets (the 5 above plus the type/group tiles) still works exactly as before, reachable
// only through "All Filters" now instead of duplicated as inline buttons too (`accordionItems`
// below, and the state each one reads/writes, are untouched). The same "search box + single All
// Filters button, left-anchored panel with real per-group categories" shape was also brought to
// Records mode - see the Metrics-section toolbar in app/pages/observations/page.tsx.

import { useEffect, useMemo, useState, type Key } from "react";
import type { DateRange } from "react-aria-components";
import { Focusable } from "react-aria-components";
import { getLocalTimeZone, parseDate, startOfWeek, today } from "@internationalized/date";
import { FilterLines, SearchLg, Lock01, XClose } from "@untitledui/icons";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { DateRangeControl } from "@/components/custom/date-range/date-range-control";
import { SidePanel } from "./side-panel";
import { MetricTile } from "./metric-tile";
import { ResultsTable, type ColumnDef } from "./results-table";
import {
  type SearchOccurrence,
  type SpeciesGroup,
  type LicenceLevel,
  kingdomForGroup,
  rootProjectForParentEventId,
  siteNameForParentEventId,
} from "./search-data";
import { obfuscateCoordinate } from "./geo";

const GROUPS: SpeciesGroup[] = ["Mammal", "Bird", "Reptile", "Amphibian", "Plant"];

const GROUP_ICON = SPECIES_GROUP_ICON;

function genusOf(species: string): string {
  return species.split(" ")[0];
}

function authorityFor(o: SearchOccurrence): string {
  return rootProjectForParentEventId(o.parentEventId)?.org ?? "Unknown";
}

function formatPillDate(d: DateRange["start"]): string {
  return `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;
}

function matchesSearch(haystack: string, term: string): boolean {
  const q = term.trim().toLowerCase();
  return !q || haystack.toLowerCase().includes(q);
}

/** Real, threatened-species-appropriate obfuscation radius - a bird's nest/roost site typically
 *  needs less spatial "room" to protect than a wider-ranging mammal or reptile's home range, so
 *  birds obfuscate to a tighter 5km, everything else to 10km. Both are real examples the user's own
 *  ask named ("5km radius or 10km radius etc"), not arbitrary. */
function obfuscationRadiusFor(o: SearchOccurrence): number {
  return o.group === "Bird" ? 5 : 10;
}

function coordinateText(o: SearchOccurrence): string {
  if (o.licenceLevel === "Level 2") {
    const radius = obfuscationRadiusFor(o);
    const { lat, lon } = obfuscateCoordinate(o.lat, o.lon, radius);
    return `${lat.toFixed(2)}, ${lon.toFixed(2)} (± ${radius} km)`;
  }
  return `${o.lat.toFixed(2)}, ${o.lon.toFixed(2)}`;
}

function CoordinateCell({ o }: { o: SearchOccurrence }) {
  if (o.licenceLevel === "Level 2") {
    return (
      <Tooltip title="Precise location withheld - this species is sensitive, per BioData SA's DLA policy">
        <Focusable>
          <div className="flex w-max items-center gap-1.5">
            <Lock01 className="size-3.5 shrink-0 text-fg-quaternary" />
            <span className="text-sm whitespace-nowrap text-tertiary">{coordinateText(o)}</span>
          </div>
        </Focusable>
      </Tooltip>
    );
  }
  return <span className="text-sm whitespace-nowrap text-tertiary">{coordinateText(o)}</span>;
}

// Exported so the page's own header-row export control (app/pages/observations/page.tsx)
// can build the same CSV/Excel/PDF content this view would have, without duplicating the column
// list or the per-row extraction logic.
export const EXPORT_HEADERS = [
  "Scientific Name",
  "Common Name",
  "Count",
  "Family",
  "Project",
  "Site Name",
  "Location Name",
  "Coordinates",
  "Date Identified",
  "Last Surveyed",
  "Identified By",
];

export function exportRowFor(o: SearchOccurrence): string[] {
  return [
    o.species,
    o.commonName,
    o.count == null ? "-" : String(o.count),
    o.family ?? "-",
    rootProjectForParentEventId(o.parentEventId)?.name ?? "-",
    siteNameForParentEventId(o.parentEventId) ?? "-",
    o.region,
    coordinateText(o),
    o.date,
    o.lastSurveyed,
    authorityFor(o),
  ];
}

/** The "filter by date identified" checkbox + (once checked) the real date-range picker - shared
 *  between the inline Timeline dropdown and the "All Filters" panel's own Timeline section so the
 *  two surfaces can never show different controls for the same underlying state. */
function TimelineFilterFields({
  dateFilterOn,
  dateRange,
  onFilterToggle,
  onRangeChange,
}: {
  dateFilterOn: boolean;
  dateRange: DateRange | null;
  onFilterToggle: (checked: boolean) => void;
  onRangeChange: (range: DateRange) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Checkbox label="Filter by date identified" isSelected={dateFilterOn} onChange={onFilterToggle} />
      {dateFilterOn && (
        <>
          <DateRangeControl value={dateRange ?? undefined} onChange={onRangeChange} className="sm:w-full" />
          <p className="text-xs text-tertiary">
            This preview&rsquo;s date picker only reaches 6 weeks back from today - some older records in this search may fall outside the selectable
            window.
          </p>
        </>
      )}
    </div>
  );
}

function CheckboxList({
  items,
  selected,
  onToggle,
  emptyLabel,
}: {
  items: { id: string; label: React.ReactNode }[];
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) return <p className="py-2 text-sm text-tertiary">{emptyLabel}</p>;
  return (
    <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
      {items.map((item) => (
        <Checkbox key={item.id} label={item.label} isSelected={selected.has(item.id)} onChange={(checked) => onToggle(item.id, checked)} />
      ))}
    </div>
  );
}

function toggleInSet<T>(set: Set<T>, value: T, checked: boolean): Set<T> {
  const next = new Set(set);
  if (checked) next.add(value);
  else next.delete(value);
  return next;
}

export function SpeciesResultsView({
  rows,
  onRowClick,
  onExportableRowsChange,
  hideSearch = false,
}: {
  /** The page's own already spatially + keyword filtered occurrence rows (`filteredOccurrences`
   *  in app/pages/observations/page.tsx) - Species mode narrows this further to rows with
   *  real taxonomy (`family`/`group` set), excluding the two Non-Biotic/Community rows that were
   *  never a real species to begin with. */
  rows: SearchOccurrence[];
  onRowClick: (row: SearchOccurrence) => void;
  /** Reports this view's own currently fully-filtered rows up to the parent page whenever they
   *  change - per a real Figma reference (node 2294:175340), "Export results" now lives in the
   *  page's own header row, next to the Records/Species toggle, not inside this component. The
   *  export button/dropdown itself moved to app/pages/observations/page.tsx; this
   *  component still owns every filter that decides *which* rows are exportable, so it's the one
   *  source of truth for that set - it just hands the current answer up rather than rendering the
   *  export control itself. `EXPORT_HEADERS`/`exportRowFor` are exported below for the page to
   *  reuse verbatim, so the exported file's columns can never drift from what this view computes. */
  onExportableRowsChange?: (rows: SearchOccurrence[]) => void;
  /** Hide this view's own search box (the page already has one search field that narrows these
   *  rows), leaving the All Filters button. Default off, so every other caller is unchanged. */
  hideSearch?: boolean;
}) {
  const [activeGroup, setActiveGroup] = useState<SpeciesGroup | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<Key>>(new Set(["species"]));

  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(new Set());
  const [selectedGenera, setSelectedGenera] = useState<Set<string>>(new Set());
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [selectedAuthorities, setSelectedAuthorities] = useState<Set<string>>(new Set());
  const [selectedLicences, setSelectedLicences] = useState<Set<LicenceLevel>>(new Set());
  const [dateFilterOn, setDateFilterOn] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const [familySearch, setFamilySearch] = useState("");
  const [speciesSearch, setSpeciesSearch] = useState("");

  // Real species only - the two Non-Biotic/Community occurrence rows have no `family`/`group` at
  // all (see SearchOccurrence's own doc comment in search-data.ts), so this filter is also the
  // "is this actually a species" check.
  const speciesRows = useMemo(() => rows.filter((o): o is SearchOccurrence & { family: string; group: SpeciesGroup } => Boolean(o.family && o.group)), [rows]);

  const familyOptions = useMemo(() => [...new Set(speciesRows.map((o) => o.family))].sort(), [speciesRows]);
  const genusOptions = useMemo(() => [...new Set(speciesRows.map((o) => genusOf(o.species)))].sort(), [speciesRows]);
  const speciesOptions = useMemo(
    () => [...new Map(speciesRows.map((o) => [o.species, o.commonName])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [speciesRows],
  );
  const authorityOptions = useMemo(() => [...new Set(speciesRows.map(authorityFor))].sort(), [speciesRows]);

  // Backs the analytics tile row - every facet filter applies, but NOT the tile row's own
  // `activeGroup` quick-filter, so clicking one tile doesn't zero out every other tile's own count.
  const rowsForAnalytics = useMemo(
    () =>
      speciesRows.filter((o) => {
        if (selectedFamilies.size && !selectedFamilies.has(o.family)) return false;
        if (selectedGenera.size && !selectedGenera.has(genusOf(o.species))) return false;
        if (selectedSpecies.size && !selectedSpecies.has(o.species)) return false;
        if (selectedAuthorities.size && !selectedAuthorities.has(authorityFor(o))) return false;
        if (selectedLicences.size && o.licenceLevel && !selectedLicences.has(o.licenceLevel)) return false;
        if (dateFilterOn && dateRange) {
          // Compare pure calendar dates (Y-M-D), not JS Date/timezone-aware instants - `o.date`
          // is a bare "YYYY-MM-DD" string, which `new Date()` parses as UTC midnight, while
          // `CalendarDate.toDate()` converts to a Date in the *local* timezone; comparing the two
          // directly is off by a day right at the boundary whenever the browser's timezone is
          // ahead of UTC (an Australian timezone, for this app's own real audience, is exactly
          // that) - caught live: a row dated 2026-08-15 was silently excluded from a selected
          // "14 Aug - 15 Aug" range. `CalendarDate.compare()` sidesteps timezones entirely.
          const rowDate = parseDate(o.date);
          if (rowDate.compare(dateRange.start) < 0 || rowDate.compare(dateRange.end) > 0) return false;
        }
        return true;
      }),
    [speciesRows, selectedFamilies, selectedGenera, selectedSpecies, selectedAuthorities, selectedLicences, dateFilterOn, dateRange],
  );

  const groupCounts = useMemo(() => {
    const counts = new Map<SpeciesGroup, number>();
    for (const o of rowsForAnalytics) counts.set(o.group!, (counts.get(o.group!) ?? 0) + 1);
    return counts;
  }, [rowsForAnalytics]);

  // The table's own rows - every facet filter, the tile row's own quick-filter, and the search box
  // now living in the shared toolbar card (see the render below) rather than inside `ResultsTable`
  // itself (`hideSearchBox` on that call) - filtered here instead so the exported file (via
  // `onExportableRowsChange`) reflects the same search term the table itself is showing.
  const filteredSpeciesRows = useMemo(
    () =>
      rowsForAnalytics.filter(
        (o) => (!activeGroup || o.group === activeGroup) && matchesSearch(`${o.species} ${o.commonName} ${o.family} ${authorityFor(o)}`, tableSearch),
      ),
    [rowsForAnalytics, activeGroup, tableSearch],
  );

  // Reports the current fully-filtered set up to the page's own header-row export control - see
  // this component's own `onExportableRowsChange` doc comment above.
  useEffect(() => {
    onExportableRowsChange?.(filteredSpeciesRows);
  }, [filteredSpeciesRows, onExportableRowsChange]);

  const openPanel = () => setPanelOpen(true);

  const activeFilterCount =
    (selectedFamilies.size > 0 ? 1 : 0) +
    (selectedGenera.size > 0 ? 1 : 0) +
    (selectedSpecies.size > 0 ? 1 : 0) +
    (selectedAuthorities.size > 0 ? 1 : 0) +
    (dateFilterOn ? 1 : 0) +
    (selectedLicences.size > 0 ? 1 : 0);
  const anyFilterActive = activeFilterCount > 0;

  const speciesCommonNameById = useMemo(() => new Map(speciesOptions), [speciesOptions]);

  // One pill per selected *value* (not per facet) - a Family filter with 2 families selected shows
  // 2 separate removable pills, not one "Family: 2 selected" pill, so each can be individually
  // cleared without re-opening the dropdown it came from.
  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    for (const f of selectedFamilies) pills.push({ key: `family:${f}`, label: `Family: ${f}`, onRemove: () => setSelectedFamilies((prev) => toggleInSet(prev, f, false)) });
    for (const g of selectedGenera) pills.push({ key: `genus:${g}`, label: `Genus: ${g}`, onRemove: () => setSelectedGenera((prev) => toggleInSet(prev, g, false)) });
    for (const s of selectedSpecies) {
      pills.push({ key: `species:${s}`, label: `Species: ${speciesCommonNameById.get(s) ?? s}`, onRemove: () => setSelectedSpecies((prev) => toggleInSet(prev, s, false)) });
    }
    for (const a of selectedAuthorities) {
      pills.push({ key: `authority:${a}`, label: `Information Authority: ${a}`, onRemove: () => setSelectedAuthorities((prev) => toggleInSet(prev, a, false)) });
    }
    for (const l of selectedLicences) pills.push({ key: `licence:${l}`, label: `Licence: ${l}`, onRemove: () => setSelectedLicences((prev) => toggleInSet(prev, l, false)) });
    if (dateFilterOn && dateRange) {
      pills.push({ key: "timeline", label: `Timeline: ${formatPillDate(dateRange.start)} - ${formatPillDate(dateRange.end)}`, onRemove: () => setDateFilterOn(false) });
    }
    return pills;
  }, [selectedFamilies, selectedGenera, selectedSpecies, selectedAuthorities, selectedLicences, dateFilterOn, dateRange, speciesCommonNameById]);

  const handleDateFilterToggle = (checked: boolean) => {
    setDateFilterOn(checked);
    // DateRangeControl only calls onChange once the user actively interacts with it (picks a day,
    // steps prev/next) - passed no value, it silently falls back to its own internal uncontrolled
    // default and never reports that default back up here. Seed the exact same default the
    // control itself shows (current week) so what's displayed and what's filtered can never
    // silently disagree - see the same note this logic carried before it moved into this shared
    // handler.
    if (checked && !dateRange) {
      const todayDate = today(getLocalTimeZone());
      setDateRange({ start: startOfWeek(todayDate, "en-AU"), end: todayDate });
    }
  };

  const clearAllFilters = () => {
    setSelectedFamilies(new Set());
    setSelectedGenera(new Set());
    setSelectedSpecies(new Set());
    setSelectedAuthorities(new Set());
    setSelectedLicences(new Set());
    setDateFilterOn(false);
  };

  const columns: ColumnDef<SearchOccurrence>[] = [
    { id: "species", label: "Scientific Name", render: (o) => <span className="text-sm font-medium text-primary italic">{o.species}</span> },
    { id: "commonName", label: "Common Name", render: (o) => <span className="text-sm text-secondary">{o.commonName}</span> },
    { id: "count", label: "Count", render: (o) => <span className="text-sm text-tertiary tabular-nums">{o.count ?? "-"}</span> },
    { id: "family", label: "Family", render: (o) => <span className="text-sm text-tertiary">{o.family}</span> },
    {
      id: "project",
      label: "Project",
      render: (o) => <span className="text-sm text-tertiary">{rootProjectForParentEventId(o.parentEventId)?.name ?? "-"}</span>,
    },
    { id: "site", label: "Site Name", render: (o) => <span className="text-sm text-tertiary">{siteNameForParentEventId(o.parentEventId) ?? "-"}</span> },
    { id: "location", label: "Location Name", render: (o) => <span className="text-sm text-tertiary">{o.region}</span> },
    { id: "coordinates", label: "Coordinates", render: (o) => <CoordinateCell o={o} /> },
    { id: "date", label: "Date Identified", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.date}</span> },
    { id: "lastSurveyed", label: "Last Surveyed", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.lastSurveyed}</span> },
    { id: "authority", label: "Identified by", render: (o) => <span className="text-sm text-tertiary">{authorityFor(o)}</span> },
  ];

  const filteredFamilyOptions = familyOptions.filter((f) => f.toLowerCase().includes(familySearch.trim().toLowerCase()));
  const filteredSpeciesOptions = speciesOptions.filter(
    ([species, commonName]) =>
      !speciesSearch.trim() ||
      commonName.toLowerCase().includes(speciesSearch.trim().toLowerCase()) ||
      species.toLowerCase().includes(speciesSearch.trim().toLowerCase()),
  );

  const accordionItems: AccordionItemType[] = [
    {
      id: "species",
      title: "Species",
      content: (
        <div className="flex flex-col gap-3">
          <Input icon={SearchLg} placeholder="Search Species" value={speciesSearch} onChange={setSpeciesSearch} />
          <CheckboxList
            items={filteredSpeciesOptions.map(([species, commonName]) => ({
              id: species,
              label: (
                <span>
                  {commonName} <span className="text-tertiary italic">- {species}</span>
                </span>
              ),
            }))}
            selected={selectedSpecies}
            onToggle={(id, checked) => setSelectedSpecies((prev) => toggleInSet(prev, id, checked))}
            emptyLabel="No species match this search."
          />
        </div>
      ),
    },
    {
      id: "family",
      title: "Family",
      content: (
        <div className="flex flex-col gap-3">
          <Input icon={SearchLg} placeholder="Search Family" value={familySearch} onChange={setFamilySearch} />
          <CheckboxList
            items={filteredFamilyOptions.map((f) => ({ id: f, label: f }))}
            selected={selectedFamilies}
            onToggle={(id, checked) => setSelectedFamilies((prev) => toggleInSet(prev, id, checked))}
            emptyLabel="No families match this search."
          />
        </div>
      ),
    },
    {
      id: "genus",
      title: "Genus",
      content: (
        <CheckboxList
          items={genusOptions.map((g) => ({ id: g, label: <span className="italic">{g}</span> }))}
          selected={selectedGenera}
          onToggle={(id, checked) => setSelectedGenera((prev) => toggleInSet(prev, id, checked))}
          emptyLabel="No genera in this search."
        />
      ),
    },
    {
      id: "authority",
      title: "Information Authority",
      content: (
        <CheckboxList
          items={authorityOptions.map((a) => ({ id: a, label: a }))}
          selected={selectedAuthorities}
          onToggle={(id, checked) => setSelectedAuthorities((prev) => toggleInSet(prev, id, checked))}
          emptyLabel="No data owners in this search."
        />
      ),
    },
    {
      id: "timeline",
      title: "Timeline",
      content: (
        <TimelineFilterFields dateFilterOn={dateFilterOn} dateRange={dateRange} onFilterToggle={handleDateFilterToggle} onRangeChange={setDateRange} />
      ),
    },
    {
      id: "licence",
      title: "Licence",
      content: (
        <div className="flex flex-col gap-3">
          <Checkbox
            label="Level 1 - Public Access"
            isSelected={selectedLicences.has("Level 1")}
            onChange={(checked) => setSelectedLicences((prev) => toggleInSet(prev, "Level 1", checked))}
          />
          <Checkbox
            label="Level 2 - Needs a DLA Access"
            isSelected={selectedLicences.has("Level 2")}
            onChange={(checked) => setSelectedLicences((prev) => toggleInSet(prev, "Level 2", checked))}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* ── Analytics tile row - a Mammal/Bird/Reptile/Amphibian/Plant breakdown, each tile a real
          quick-filter (click to narrow the table to that group, click again to clear) - computed
          from the currently facet-filtered set, not a static readout. The Flora/Fauna kingdom
          split this row started with is gone per direct feedback (redundant with the 5 groups
          right below it - Plant already carries the whole "Flora" total, the other 4 sum to
          "Fauna"). No outer bordered/padded wrapper around the tiles either, per the same
          feedback - the tiles are the row; a surrounding card was redundant chrome. Real
          `MetricTile` (metric-tile.tsx), the same shared component the Records view's own
          Projects/Events/Occurrences/Observations/Artefacts switcher now renders through too, so
          the two rows can never drift apart in styling. Always shown now, not gated behind a
          "Summary" toggle - that toggle is gone entirely per direct feedback. ── */}
      <div className="flex shrink-0 items-stretch gap-2">
        {GROUPS.map((g) => {
          const active = activeGroup === g;
          return (
            <MetricTile
              key={g}
              icon={GROUP_ICON[g]}
              label={g}
              value={groupCounts.get(g) ?? 0}
              active={active}
              onClick={() => setActiveGroup(active ? null : g)}
            />
          );
        })}
      </div>

      {/* ── Filter row - a full-width search box with the single "All Filters" button pinned to
          its right edge, per direct feedback ("the search bar shall be full width and the all
          filters button on the right"). The 5 individual dropdown buttons this row used to hold
          (Family/Species/Information Authority/Timeline/Licence) are gone - every one of those
          facets is still real and still filters the table, just reachable only through the "All
          Filters" side panel now (see `accordionItems` below), not duplicated as inline buttons
          too. `Input` takes `flex-1` (fills the row) instead of a fixed `w-[480px]`; the button
          keeps its own `shrink-0`/`min-w-[220px]` so it never gets squeezed and naturally lands on
          the right since the input has already claimed the rest of the row. ── */}
      <div className="flex shrink-0 items-center gap-3 rounded-lg bg-primary shadow-xs">
        {!hideSearch && <Input icon={SearchLg} placeholder="Search" value={tableSearch} onChange={setTableSearch} className="flex-1" />}
        <Button color="secondary" size="md" iconLeading={FilterLines} onPress={openPanel} className={hideSearch ? "ml-auto shrink-0" : "min-w-[220px] shrink-0 justify-center"}>
          All Filters{anyFilterActive ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      {/* ── Active filter pills - one per selected value across all 6 facets, "Filter name: value",
          each individually removable, per direct feedback ("the active filters will be shown as
          pills below"). Built from the same state the dropdowns/panel above already own, so a
          value removed here is immediately reflected everywhere else it's shown. ── */}
      {activeFilterPills.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {activeFilterPills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary py-1 pr-1 pl-2.5 text-xs font-medium text-secondary"
            >
              {pill.label}
              <button
                type="button"
                onClick={pill.onRemove}
                aria-label={`Remove filter: ${pill.label}`}
                className="flex size-4 shrink-0 items-center justify-center rounded-full text-quaternary outline-focus-ring hover:bg-primary_hover hover:text-primary"
              >
                <XClose className="size-3" />
              </button>
            </span>
          ))}
          <Button color="link-gray" size="sm" onPress={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* ── The table itself - the same generic ResultsTable primitive every other tab on this
          page uses, not a fork. Rows are already narrowed by every filter above; no `typeField`/
          `typeOptions` here since the analytics tiles already cover group-level quick filtering -
          two competing ways to filter the same thing would be confusing, not "best UX". ── */}
      <div className="min-h-0 flex-1">
        <ResultsTable
          ariaLabel="Species"
          columns={columns}
          rows={filteredSpeciesRows}
          emptyLabel="species records"
          rowTextValue={(o) => o.commonName}
          searchText={(o) => `${o.species} ${o.commonName} ${o.family} ${authorityFor(o)}`}
          showHeaderColumnCustomizer
          hideSearchBox
          onRowClick={onRowClick}
        />
      </div>

      {/* ── All Filters - left-anchored, matching the wireframe (node 2266:167054) exactly; every
          other SidePanel consumer on this page is right-anchored, so this is the first real use of
          the `side="left"` prop added to side-panel.tsx for this feature. ── */}
      <SidePanel
        isOpen={panelOpen}
        onOpenChange={setPanelOpen}
        title="All Filters"
        side="left"
        widthClassName="max-w-sm"
        headerActions={
          anyFilterActive ? (
            <Button color="link-gray" size="sm" onPress={clearAllFilters}>
              Clear all
            </Button>
          ) : undefined
        }
      >
        <Accordion items={accordionItems} variant="compact" openKeys={openSections} onOpenKeysChange={setOpenSections} />
      </SidePanel>
    </div>
  );
}

// Re-exported so the main page can compute Species mode's own tile-row count for its view-mode
// toggle without duplicating the "real species only" filter logic.
export function realSpeciesCount(rows: SearchOccurrence[]): number {
  return rows.filter((o) => o.family && o.group).length;
}

export function kingdomLabel(group: SpeciesGroup): "Flora" | "Fauna" {
  return kingdomForGroup(group);
}
