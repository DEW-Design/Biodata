"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Map as LeafletMap } from "leaflet";
import { Tabs } from "react-aria-components";
import { AlertCircle, AlertTriangle, Folder, MarkerPin01, SearchLg, Tag01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tab, TabList } from "@/components/application/tabs/tabs";
import { MapLegend, type LegendItem } from "@/app/pages/_shared/map-search/map-legend";
import { MAP_SURFACE_EDGE, MAP_SURFACE_RULE, MAP_SURFACE_SCROLL } from "@/app/pages/_shared/map-search/map-surface";
import { MapZoomButtons } from "@/app/pages/_shared/map-search/map-zoom-buttons";
import { OTHER_RECORD_COLOR } from "@/app/pages/_shared/map-search/species-group-icons";
import { ResultCard } from "@/app/pages/_shared/map-search/result-card";
import { LIST_STEP, MapResultList } from "@/app/pages/_shared/map-search/result-list";
import { ChunkHeading } from "@/app/pages/_shared/map-search/chunk-heading";
import { ListToggleButton, useListToggle } from "@/app/pages/_shared/map-search/list-toggle";
import { SummaryCloseButton, SummaryFacts } from "@/app/pages/_shared/map-search/summary-card-parts";
import { ScrollFade } from "@/app/pages/_shared/map-search/scroll-fade";
import { blockCentre, generalisedBlock, haversineDistanceKm, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { generalisedKm, recordAccess } from "@/app/pages/_shared/map-search/record-access";
import { findOccurrence } from "@/app/pages/_shared/map-search/search-data";
import type { SAMapMarker } from "@/app/pages/_shared/map-search/sa-map";
import { useIngestionRuns } from "@/app/pages/_shared/reports/use-ingestion-runs";
import { ERROR_CATEGORIES, errorRowsFor, projectExtentFor, severityColor, type ErrorCategory, type ErrorRow } from "@/app/pages/_shared/reports/data-validation-error-report-data";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { RecordBackLink } from "@/app/pages/_shared/record-hero";
import { FittedText } from "@/app/pages/_shared/fitted-text";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { REPORTS_SECTION_LABEL, keyHref } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// Map visualise, from the Data Validation Error Report: Explore's first layout opened on one dataset (`?dataset=`, the run's
// id), with its error records drawn over the map. The shell, the map, the zoom buttons, the key and the floating card are
// Explore's own (observations-search.tsx); what the card lists is the dataset's errors instead of search results, in
// Explore's own tabs and result cards, with a way back to the report. The Explore search is not run in this view (Explore has
// no notion of a dataset to search); "Search Explore" leaves it for the ordinary search.
//
// The map shows what the tab shows. Each category of the report has its colour, the same on the dots, in the list and in the key; a coordinate outlier (a record far from where its species or its project says it
// should be, CM-SPECIES-OUTLIER and CM-OUT-OF-EXTENT) is a Coordinate mismatch like any other; the project's
// extent is drawn as the dashed outline Explore draws for an area a location must sit inside; and choosing a species outlier
// also marks the cluster it is measured from. Where a record is comes from the report's data (derived, never read from a
// file); a record whose occurrence is restricted for the role is drawn as a block, as everywhere in Explore.

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-secondary">
      <p className="text-sm text-tertiary">Loading map…</p>
    </div>
  ),
});

// One colour per category of the report this was opened from, the same on the map, in the list's dots and in the key. Keyed by the category, so a category added to `ErrorCategory` does not compile until it has one.
// Chosen by `dataviz`'s validator in the report's category order (all checks pass: lightness band, chroma, colour-vision separation 10.9, normal-vision 29.2; green is under 3:1 against the surface, which the
// key's visible labels relieve). Not red, orange or amber: those are the severity badges' colours, and a dot must never read as "High".
const CATEGORY_COLOR: Record<ErrorCategory, string> = {
  "Business rule": "var(--color-utility-blue-500)",
  "Coordinate mismatch": "var(--color-utility-pink-500)",
  Metadata: "var(--color-utility-green-500)",
};
const CLUSTER_COLOR = "var(--color-utility-brand-500)";
const CLUSTER_ID = "cluster";

/** What the list shows: every error, or the errors of one category of the report this was opened from (Business rule, Coordinate mismatch, Metadata). */
type View = "all" | ErrorCategory;

// The icons the report's own counts used for these three (one icon per concept, CONTRACTS 2.4).
const CATEGORY_ICON: Record<ErrorCategory, FC<{ className?: string }>> = { "Business rule": AlertCircle, "Coordinate mismatch": MarkerPin01, Metadata: Tag01 };

const noop = () => {};
const floatCard = cx("flex flex-col overflow-hidden rounded-xl", MAP_SURFACE_EDGE, "bg-primary shadow-lg");

/**
 * The header's trail on this view: the report it was opened from, then this view, as the upload page's trail names the project it was opened from (upload-shell.tsx). Without it the
 * trail said "Home / Explore" and the rail lit Explore, so the only sign of where a person had come from was the card's "Back to report". Both earlier crumbs are links: "Reports" to the
 * list, the report's own crumb to the report on this same dataset (the way back, as the card's link is). The rail is left as it is: this is Explore's page, so Explore is lit, and
 * clicking a lit item is a no-op everywhere else.
 */
export function DatasetBreadcrumb({ datasetId, orgLabel }: { datasetId: string; orgLabel: string | undefined }) {
  const roleHref = useRoleHref();
  const report = REPORTS.find((r) => r.id === "data-validation-error");
  return (
    <Breadcrumb
      orgLabel={orgLabel}
      section={
        <>
          <Link href={roleHref(keyHref("reports"))} className="hover:text-primary">
            {REPORTS_SECTION_LABEL}
          </Link>
          {report && (
            <>
              <span>/</span>
              <Link href={roleHref(`${report.path}?dataset=${encodeURIComponent(datasetId)}`)} className="hover:text-primary">
                {report.title}
              </Link>
            </>
          )}
        </>
      }
      current="Map visualise"
    />
  );
}

const colourOf = (row: ErrorRow) => CATEGORY_COLOR[row.category];

type Subject = { id: string; fileName: string; projectTitle: string; projectCode: string };

/**
 * The header, what the card is a map of: the dataset the report was run on, named as the report names it, by its id. A person gets here by choosing Map visualise on that dataset's report, so
 * "DS-2026-01003" is the title (18/600, the layer Explore's second layout titles its card with: 16 left it two pixels above its facts, with the same weight as the links above it) and the rest is facts about it. The type, each from an existing layer (CONTRACTS 2.9): the eyebrow is 12/600 uppercase
 * quaternary (the record summary's), the project is 14/500 primary (the row-title layer; its Folder icon is the design system's project icon, its code part of the name as the report writes it:
 * "Flinders Ranges Reptile Atlas (BD-5137)"), the file is 14/400 (the designer: Barlow regular), and the way back above is the record pages' back link, 14/500 tertiary. The id was the smallest, greyest text
 * on the card and the file name was the title (the designer: "the click is for DS-2026-01003 ... why am I not seeing that front and centred?", 23 Oct 2026, reversing "File as title" of the same day).
 * There are no menus to swap the file or the project here: the report's Parameters is where a dataset is chosen, and the report must not ask for it twice (CONTRACTS 4.6).
 */
function CardHeader({ run, action }: { run: Subject; action: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Dataset</p>
        {action}
      </div>
      <h2 className="m-0! mt-0.5! min-w-0 text-lg! font-semibold! tracking-normal! text-primary!">{run.id}</h2>
      {/* The project (its Folder icon, its name and code as part of it, cut by words, the code never cut) and under it the file (14/400: a file name is a fact, not a name to read first; kept by its end,
          since the number and the extension tell one dataset from the next). */}
      <p className="m-0 mt-1 flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
        <Folder aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
        <FittedText text={run.projectTitle} tail={` (${run.projectCode})`} />
      </p>
      <p className="m-0 flex min-w-0 text-sm font-normal text-primary">
        <FittedText text={run.fileName} strategy="name" />
      </p>
    </>
  );
}

export function DatasetErrorMap({ datasetId, onSearchExplore }: { datasetId: string; onSearchExplore: () => void }) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const { runs } = useIngestionRuns();
  const run = runs.find((r) => r.id === datasetId) ?? null;
  // A record whose occurrence this role may not see at all is left out of the list and the map; one that is restricted is drawn as a block.
  const errors = useMemo(
    () =>
      (run ? errorRowsFor(run) : []).filter((row) => {
        const occurrence = findOccurrence(row.location.occurrenceId);
        return !occurrence || recordAccess(occurrence, role) !== "hidden";
      }),
    [run, role],
  );
  const reportHref = roleHref(`/pages/reports/data-validation-error?dataset=${encodeURIComponent(datasetId)}`);

  const [view, setView] = useState<View>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listLimit, setListLimit] = useState(LIST_STEP);
  // "Show more" leaves a note here of where the new rows start; the effect below reads it once they are drawn, scrolls them into view and, for a keyboard or screen reader press, moves focus to the first.
  const listRef = useRef<HTMLDivElement>(null);
  // The card folds down to its header (the way back, the dataset, its file and project) so the map can be seen whole; the list comes back as it was (`useListToggle`, shared with Explore's card).
  const { open: listOpen, toggle: toggleList, forgetScroll } = useListToggle(listRef);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [panRequest, setPanRequest] = useState<{ key: number; point: [number, number] } | undefined>();
  // Another dataset is a new list: back to All errors, nothing chosen, the first rows, at the top. (Adjusted while rendering, not in an effect; the map is not remounted, so it flies to the new fit.)
  const [shownFor, setShownFor] = useState(datasetId);
  if (shownFor !== datasetId) {
    setShownFor(datasetId);
    setView("all");
    setSelectedId(null);
    setHoveredId(null);
    setListLimit(LIST_STEP);
    setPanRequest(undefined);
  }
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
    forgetScroll();
  }, [datasetId, forgetScroll]);

  // Outliers first, then the rest in record order, so the records to look at are at the top of the list.
  const ordered = useMemo(() => [...errors].sort((a, b) => ERROR_CATEGORIES.indexOf(a.category) - ERROR_CATEGORIES.indexOf(b.category) || a.recordNumber - b.recordNumber), [errors]);
  // The tabs and their counts are read from each error's category, the concept the report filters on, not split by hand: one source for what a category is.
  const counts = useMemo(() => Object.fromEntries(ERROR_CATEGORIES.map((c) => [c, errors.filter((e) => e.category === c).length])) as Record<ErrorCategory, number>, [errors]);
  const shown = view === "all" ? ordered : ordered.filter((r) => r.category === view);
  const extent = useMemo(() => (run ? projectExtentFor(run) : null), [run]);
  const selected = shown.find((r) => r.recordId === selectedId) ?? null;
  const plotted = useMemo(() => {
    const out: { row: ErrorRow; marker: SAMapMarker }[] = [];
    for (const row of shown) {
      const occurrence = findOccurrence(row.location.occurrenceId);
      const km = occurrence ? generalisedKm(occurrence, role) : null;
      const label = [row.recordId, row.scientificName, row.concept].join(" - ");
      const color = colourOf(row);
      const point: [number, number] = [row.location.lat, row.location.lon];
      if (occurrence && km) {
        const block = generalisedBlock(occurrence.lat, occurrence.lon, km);
        out.push({ row, marker: { id: row.recordId, position: blockCentre(block), label: `${label} - location restricted to a ${km} km block`, fuzzyBlock: block, color } });
      } else {
        out.push({ row, marker: { id: row.recordId, position: point, label, color } });
      }
    }
    return out;
  }, [shown, role]);

  // The cluster a chosen species outlier is measured from, marked on the map beside it.
  const cluster = selected?.outlier?.kind === "cluster" ? selected.outlier.from : null;
  const markers = useMemo<SAMapMarker[]>(() => {
    const dots = plotted.map((p) => p.marker);
    return cluster ? [...dots, { id: CLUSTER_ID, position: cluster, label: `Typical cluster of ${selected?.scientificName}`, color: CLUSTER_COLOR }] : dots;
  }, [plotted, cluster, selected?.scientificName]);

  // The map fits the extent and every record shown: a hidden circle that holds them steers it (the map's own areas are not drawn).
  const fit = useMemo<Boundary[]>(() => {
    if (plotted.length === 0 || !extent || extent.kind !== "circle") return [];
    const [eLat, eLon] = extent.center;
    const dLat = extent.radiusKm / 111;
    const dLon = extent.radiusKm / (111 * Math.cos((eLat * Math.PI) / 180));
    const edges: [number, number][] = [[eLat + dLat, eLon + dLon], [eLat + dLat, eLon - dLon], [eLat - dLat, eLon + dLon], [eLat - dLat, eLon - dLon]];
    const points = [...plotted.map((p) => p.marker.position), ...edges];
    const lats = points.map((p) => p[0]);
    const lons = points.map((p) => p[1]);
    const centre: [number, number] = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lons) + Math.max(...lons)) / 2];
    return [{ id: "fit-errors", kind: "circle", center: centre, radiusKm: Math.ceil(Math.max(...points.map((p) => haversineDistanceKm(centre, p)))) }];
  }, [plotted, extent]);

  const select = (row: ErrorRow) => {
    setSelectedId(row.recordId);
    const marker = plotted.find((p) => p.row.recordId === row.recordId)?.marker;
    if (marker) setPanRequest({ key: Date.now(), point: marker.position });
  };

  // The key names what the colours are: the categories on the map, as the report and the tabs name them, in the report's order and only those on the map. Not the card's own words for what kind of coordinate
  // problem a record has ("away from its cluster", "outside the project extent"): those were made up for this card, held three buckets and an "other", and did not grow with the report's categories.
  const legendItems = useMemo<LegendItem[]>(() => {
    const items: LegendItem[] = ERROR_CATEGORIES.filter((category) => plotted.some((p) => p.row.category === category)).map((category) => ({ id: category, label: category, color: CATEGORY_COLOR[category] }));
    if (cluster) items.push({ id: "cluster", label: "Typical cluster", color: CLUSTER_COLOR });
    if (plotted.some((p) => p.marker.fuzzyBlock)) items.push({ id: "restricted", label: "Restricted (block)", color: OTHER_RECORD_COLOR, fuzzy: true });
    return items;
  }, [plotted, cluster]);

  const onMarkerClick = (id: string) => {
    const row = shown.find((r) => r.recordId === id);
    if (row) select(row);
  };
  const changeView = (next: View) => {
    if (next === view) return;
    setView(next);
    setSelectedId(null);
    setListLimit(LIST_STEP);
    // A different list starts at its top, not where the last one was left (the Outliers list was opened scrolled to its end).
    listRef.current?.scrollTo({ top: 0 });
  };

  // The way back says which report it goes back to (not "Back to report"): the Data Validation Error Report, on this same dataset. It is the record pages' back link (`RecordBackLink`, 14/500 tertiary), not a
  // button: a button's text is 600, the way back is 500 on every record page. It has its own row, so it is never crowded by the list's toggle; only a card narrower than the report's name cuts it.
  const reportName = REPORTS.find((r) => r.id === "data-validation-error")?.title ?? "report";
  const backButton = (
    <RecordBackLink href={reportHref} inline>
      {`Back to ${reportName}`}
    </RecordBackLink>
  );
  // Hide or show the list, so the map can be seen whole. The card folds to its header, as Explore's second layout folds its search card (a chevron on the card's top row), not to a separate button: it
  // stays the same object in the same place, and the way back, the dataset, its file and project stay with it. It is a labelled link, not an icon alone, so what it does is stated. It sits at the right of
  // the header's first line (the eyebrow), which has the room now that the id is the title, and not beside the way back, where a long report name left it no room.
  const listToggle = <ListToggleButton open={listOpen} onToggle={toggleList} controls="map-visualise-list" />;
  const exploreButton = (
    <Button color="link-gray" size="sm" iconLeading={SearchLg} onPress={onSearchExplore}>
      Search Explore
    </Button>
  );

  const card = !run || errors.length === 0 ? (
    <section aria-label="Map visualise" className={cx(floatCard, "pointer-events-auto w-full")}>
      <div className="flex items-center gap-2 px-4 pt-4">{backButton}</div>
      <div className="flex flex-col gap-1 px-4 pt-2 pb-4">
        <h2 className="m-0! text-base! font-semibold! tracking-normal! text-primary!">No errors to map</h2>
        <p className="m-0 text-sm text-balance text-tertiary">This dataset has no validation errors, or it is not one you can see. Open the report to choose another dataset.</p>
        <div className="mt-2">{exploreButton}</div>
      </div>
    </section>
  ) : (
    <section aria-label="Map visualise" className={cx(floatCard, "pointer-events-auto min-h-0 w-full shrink @max-[647px]:min-h-[72px]")}>
      <div className="flex shrink-0 items-center px-4 pt-4">{backButton}</div>
      {/* The header's vertical gaps, on one scale (px, between line boxes): card edge 16 to the way back; 16 from it to the eyebrow (the row is the toggle's 20px tall, text centred; 16 so the back link and the toggle can each be a 40px target without touching); the eyebrow and the title 0
          (the title's own leading is the space); 6 from the title to its two facts, so the one focal point stands apart from them; 2 between the file and the project, a pair; 16 to the divider, as at the top.
          It was 12 at the bottom against 16 at the top, and 2 between the title and the file as between the file and the project. */}
      <div className="flex shrink-0 flex-col gap-0.5 px-4 pt-4 pb-4">
        <CardHeader run={run} action={listToggle} />
      </div>
      {listOpen && (
      <div id="map-visualise-list" className={cx("flex min-h-0 flex-1 flex-col border-t motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150", MAP_SURFACE_RULE)}>
        <ScrollFade className="mt-1.5 mb-0 px-4">
          <Tabs selectedKey={view} onSelectionChange={(key) => changeView(key as View)} className="min-w-max">
            <TabList aria-label="Records to show" type="underline" size="sm">
              <Tab id="all" label="All errors" icon={AlertTriangle} badge={ordered.length} />
              {ERROR_CATEGORIES.map((category) => (
                <Tab key={category} id={category} label={category} icon={CATEGORY_ICON[category]} badge={counts[category]} />
              ))}
            </TabList>
          </Tabs>
        </ScrollFade>
        <MapResultList total={shown.length} shown={listLimit} onShowMore={() => setListLimit((n) => n + LIST_STEP)} scrollRef={listRef}>
          {shown.length === 0 ? (
            <p className="px-3 py-6 text-sm text-balance text-tertiary">{`No ${view.toLowerCase()} errors in this dataset.`}</p>
          ) : (
            <>
              {/* A row is a row of the report's table, in the table's own words, nothing computed for the card: the species as the table's Species column writes it (the scientific name first, in italic, then the common
                  name under it; CONTRACTS 2.15), under it the concept that failed and the record's id, and the severity at the right. The category is the heading, and the rule, the description and
                  the project are on the row's summary, one click away. The dot is the category's colour on the map and in the key. A heading starts each category, in the report's order, in every view: the same two
                  labels in the same places whichever tab is chosen (a category tab repeats its own name, for the sake of one structure). */}
              {shown.slice(0, listLimit).map((row, i) => (
                <Fragment key={row.recordId}>
                  {(i === 0 || shown[i - 1].category !== row.category) && <ChunkHeading label={row.category} count={counts[row.category]} trailing="Severity" />}
                  <ResultCard
                    thumb={
                      <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: colourOf(row) }} />
                      </span>
                    }
                    title={row.scientificName}
                    titleItalic
                    subtitle={row.commonName}
                    meta={`${row.concept} · ${row.recordId}`}
                    badgeAlign="end"
                    badge={
                      <Badge size="sm" color={severityColor[row.severity]}>
                        <span className="sr-only">Severity: </span>
                        {row.severity}
                      </Badge>
                    }
                    onSelect={() => select(row)}
                    onHoverChange={(hovered) => setHoveredId(hovered ? row.recordId : null)}
                  />
                </Fragment>
              ))}
            </>
          )}
        </MapResultList>
      </div>
      )}
    </section>
  );

  return (
    <>
      <div className="absolute inset-0">
        <SAMap
          boundaries={fit}
          showBoundaries={false}
          outlines={extent ? [extent] : []}
          onBoundaryAdd={noop}
          activeDrawTool={null}
          onDrawToolChange={noop}
          fitPaddingTopLeft={listOpen ? [448, 48] : [48, 192]}
          fitPaddingBottomRight={[48, 48]}
          markers={markers}
          onMarkerClick={onMarkerClick}
          highlightedMarkerId={hoveredId ?? selectedId}
          panRequest={panRequest}
          showZoomControls={false}
          onMapReady={setMapInstance}
          className="size-full"
        />
      </div>
      {/* The panels are laid out by one layer, as in Explore, so they cannot overlap (CONTRACTS 2.8): the card on the left, the zoom
          buttons and a chosen record's summary on the right, the key along the bottom. */}
      <div className="pointer-events-none absolute inset-0 z-[1000] @container">
        <div className="flex size-full flex-col gap-4 p-4 pb-9">
          <div className="flex min-h-0 flex-1 flex-col gap-4 @min-[648px]:flex-row">
            <div className="flex min-h-0 w-full flex-col items-start gap-3 @max-[647px]:min-h-[72px] @max-[647px]:shrink-[1000] @min-[648px]:w-[440px] @min-[648px]:min-w-[280px] @min-[648px]:shrink">{card}</div>
            <div className="flex min-h-0 flex-col items-end gap-3 @min-[648px]:ml-auto @min-[648px]:w-[320px] @min-[648px]:shrink-0">
              <MapZoomButtons map={mapInstance} className="pointer-events-auto shrink-0" />
              {selected && <ErrorSummaryCard row={selected} onClose={() => setSelectedId(null)} />}
            </div>
          </div>
          {legendItems.length > 0 && (
            <div className={cx("max-w-full shrink-0 self-start @min-[648px]:max-w-[440px]", selected && "@max-[647px]:hidden")}>
              <MapLegend title="Category" items={legendItems} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** One error at a glance, on the map's right: what failed and how far a coordinate outlier is. Built as Explore's record summary
 *  card (`RecordPeekCard`) is: not modal, closed by its X or Escape, and the map stays usable behind it. */
function ErrorSummaryCard({ row, onClose }: { row: ErrorRow; onClose: () => void }) {
  // Escape closes and never changes anything else (CONTRACTS 1.9).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Record", value: row.recordId },
    { label: "Rule", value: row.rule },
    { label: "Concept", value: row.concept },
    {
      label: "Severity",
      value: (
        <Badge size="sm" color={severityColor[row.severity]}>
          {row.severity}
        </Badge>
      ),
    },
  ];
  return (
    <section aria-label={`${row.recordId}, summary`} className={cx(floatCard, "pointer-events-auto relative min-h-0 w-full max-w-none shrink motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150")}>
      <SummaryCloseButton onClick={onClose} />
      <div className={cx("flex min-h-0 shrink flex-col gap-3 overflow-y-auto p-4", MAP_SURFACE_SCROLL)}>
        <div className="min-w-0 pr-8">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{row.category}</p>
          <h3 className="m-0! mt-0.5! text-base! font-semibold! tracking-normal! text-primary! text-balance italic">{row.scientificName}</h3>
          <p className="text-sm text-tertiary">{row.commonName}</p>
        </div>
        <p className="text-sm text-secondary text-balance">{row.description}</p>
        <SummaryFacts facts={rows} />
      </div>
    </section>
  );
}
