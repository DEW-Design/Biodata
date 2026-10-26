"use client";

import type { FC, ReactNode } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { Selection } from "react-aria-components";
import { Tabs } from "react-aria-components";
import { TabList, Tab } from "@/components/application/tabs/tabs";
import { AreaLayerChips, type AreaKind } from "@/app/pages/_shared/map-search/area-layers";
import { ScrollFade } from "@/app/pages/_shared/map-search/scroll-fade";
import { OTHER_RECORD_COLOR, SPECIES_GROUP_COLOR, SPECIES_GROUP_ICON, SPECIES_GROUP_ORDER } from "@/app/pages/_shared/map-search/species-group-icons";
import { MapLegend, type LegendItem } from "@/app/pages/_shared/map-search/map-legend";
import { MAP_SURFACE_EDGE } from "@/app/pages/_shared/map-search/map-surface";
import type { SAMapMarker } from "@/app/pages/_shared/map-search/sa-map";
import { MapZoomButtons } from "@/app/pages/_shared/map-search/map-zoom-buttons";
import type { Map as LeafletMap } from "leaflet";
import { ArrowNarrowRight, Circle, Download01, File07, FileDownload01, FileLock01, Folder, Map02, MarkerPin02, Pentagon, Plus, Printer, RefreshCcw01, SearchLg, Upload01, UserPlus01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { InputFile } from "@/components/base/input/input-file";
import { MultiSelect } from "@/components/base/select/multi-select";
import { PageBanner } from "@/app/pages/_shared/page-banner";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { SA_NATIONAL_PARKS, WHOLE_STATE_SOURCE, isPointInAnyBoundary, isRecordInAnyBoundary, blockCentre, generalisedBlock, wholeStateBoundary, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { parseShapefileUpload, type ShapefileLayer } from "@/app/pages/_shared/map-search/shapefile";
import {
  searchEvents,
  searchOccurrences,
  searchObservations,
  searchResources,
  rootProjectOfEvent,
  rootProjectForParentEventId,
  type SearchOccurrence,
  type SearchObservation,
  type SpeciesGroup,
} from "@/app/pages/_shared/map-search/search-data";
import { EXPORT_HEADERS, exportRowFor } from "@/app/pages/_shared/map-search/species-results";
import { downloadCsv, downloadExcel, printAsPdf } from "@/app/pages/_shared/map-search/export-utils";
import { type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { RecordPeekCard } from "@/app/pages/_shared/map-search/record-peek-card";
import { ResultCard } from "@/app/pages/_shared/map-search/result-card";
import { ChunkHeading } from "@/app/pages/_shared/map-search/chunk-heading";
import { ListToggleButton, useListToggle } from "@/app/pages/_shared/map-search/list-toggle";
import { LIST_STEP, MapResultList } from "@/app/pages/_shared/map-search/result-list";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { hasFeatureAccess } from "@/config/role-access.config";
import { artefactAccess, artefactGeneralisedKm, generalisedKm, recordAccess } from "@/app/pages/_shared/map-search/record-access";
import { readExploreSearch, saveExploreSearch, useExploreSearchHydrated } from "@/app/pages/_shared/map-search/explore-search-store";
import { DatasetBreadcrumb, DatasetErrorMap } from "@/app/pages/observations/dataset-error-map";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { navForRole, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// The map search interface built for the sidebar's Observations item, per direct request: a real,
// interactive map of South Australia (Leaflet + OpenStreetMap tiles, not a fabricated grid) that
// lets a user define a search area by drawing a circle/polygon, entering coordinates, or picking a
// real South Australian national park, then hand that area off to a results view with the area's
// Projects, Events, Occurrence and Observation records in a table, one tab per record type.
//
// Same "leaf with its own key" nav treatment Home and Projects already have (see
// lib/registered-user-nav.ts) - this screen is reached for real from every sidebar shell's icon
// rail via the same generic `goToSection`/`keyHref` machinery those two already use, with no
// per-shell changes needed. Renamed "Observations" -> "Explore" in the nav per direct feedback on
// this build (see the changelog note in lib/registered-user-nav.ts) - only the nav label/icon;
// "Observations" is still the real name of one of the 4 record types this screen searches for
// (`entityTabs` below), the route/key (`/pages/observations`) is untouched.
//
// The map itself (app/pages/_shared/map-search/sa-map.tsx) is loaded with `ssr: false` - Leaflet
// touches `window` at import time, which breaks server rendering otherwise - and shows an honest
// loading placeholder rather than nothing while its client bundle loads.
const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-secondary">
      <p className="text-sm text-tertiary">Loading map…</p>
    </div>
  ),
});
const CURRENT_KEY = "observations";

type Method = "draw" | "coordinates" | "location" | "shapefile";
// The panel has two tabs, Species and Projects (designer, 23 Oct 2026: "remove events, occurrences, observations and artefacts from the explore panel"). A Project is still internally an Event (`type: "Project"`
// in search-data.ts); what a search finds is still decided by the whole of the Project -> Event -> Occurrence -> Observation -> Artefact tree (`matchingProjectIds` below), so a Project is found when anything under
// it falls in the search, and the species rows are the occurrences of the Projects found. Only the lists of events, occurrences, observations and artefacts are gone from the panel.
type EntityTab = "projects";

// The Projects tab's export (the Species tab's is `EXPORT_HEADERS`), plain fields of the record, never a fabricated field.
const recordsExportHeaders: Record<EntityTab, string[]> = {
  projects: ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"],
};

const parkItems = SA_NATIONAL_PARKS.map((park) => ({ id: park.id, label: park.name }));

function matchesKeyword(haystack: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  return !q || haystack.toLowerCase().includes(q);
}

// What the map says while a shape is being drawn, and the way out of it: one bar on the map, where the pointer is, instead of a panel in the card that said the same and had its own Cancel. It is a floating panel
// centred on the map, on the key's baseline where the map is 1500px wide or more and under the key where it is narrower, never over it (2.8).
// Ranked, so the eye has an order (designer, 23 Oct 2026: "bring in some hierarchy"): what is happening first (the title, 14/600 primary, with the tool's icon in the colour the shape is drawn in on the map), how to do it
// under it (12/400 tertiary, the supporting-line layer of a result row), and the way out last and quietest (Tertiary: no fill until pointed at). Title and hint are two lines of 20px and 16px, the height of the Cancel button
// and of the icon tile beside them (36px), so the row has one height and 8px of room all round. Corners are concentric all the way in: the bar's 16px, less the 8px between its edge and the icon tile and the button, is the 8px both have (2.13).
function DrawStatusBar({ tool, onCancel, className }: { tool: "circle" | "polygon"; onCancel: () => void; className?: string }) {
  const Icon = tool === "circle" ? Circle : Pentagon;
  return (
    <div
      role="status"
      className={cx(
        "pointer-events-auto flex w-fit min-w-0 max-w-full items-center gap-3 rounded-2xl bg-primary p-2 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out",
        MAP_SURFACE_EDGE,
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-fg-brand-primary select-none">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold text-primary">{tool === "circle" ? "Drawing a circle" : "Drawing a polygon"}</p>
        <p className="m-0 text-xs text-balance text-tertiary">{tool === "circle" ? "Click and drag on the map to set the centre and radius." : "Click to place each point, then double-click to finish."}</p>
      </div>
      <Button color="tertiary" size="sm" iconLeading={XClose} className="shrink-0" onPress={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// Same NavTree/SectionPlaceholder/ProfileMenu/GuestAuthActions shape as every other sidebar shell
// (see project-list's own copies) - kept local rather than extracted, matching this
// build's existing per-shell duplication of this exact chrome.
function NavTree({ node, depth = 1 }: { node: NavNode; depth?: number }) {
  const href = node.key ? keyHref(node.key) : undefined;
  const indent = { paddingLeft: 8 + (depth - 1) * 12, paddingRight: 8 };

  return href ? (
    <a
      href={href}
      style={indent}
      className="rounded-md py-2 text-sm font-medium text-primary transition-colors duration-100 ease-linear hover:bg-tertiary"
    >
      {node.label}
    </a>
  ) : (
    <p style={indent} className="py-2 text-sm text-tertiary">
      {node.label}
    </p>
  );
}

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink
          ? "This section has its own page - it isn't embedded here."
          : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

/** Explore, at /pages/observations: a floating card over the map that lists the search areas as layers,
 *  with no Search step - results appear in the same card and follow the areas live. (Its second layout, a
 *  search and then a results page, was retired on 23 Oct 2026.) */
export function ObservationsExplore() {
  return (
    <Suspense fallback={null}>
      <HydratedObservationsSearch />
    </Suspense>
  );
}

/** Waits for the saved search (explore-search-store.ts) to load, so the page opens on it rather
 *  than opening empty and then jumping. Nothing is prerendered here anyway: the page reads the URL,
 *  so it only renders in the browser. */
function HydratedObservationsSearch() {
  const hydrated = useExploreSearchHydrated();
  if (!hydrated) return null;
  return <ObservationsSearch />;
}

function ObservationsSearch() {
  const router = useRouter();
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Explore");
  // `?q=` comes from the header search (app/pages/_shared/global-search.tsx): a species or record
  // term to search for across all of South Australia, opened straight in Species view. With no
  // drawn area, the whole-state area stands in, so the same spatial + keyword filtering runs.
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");
  // `?dataset=` comes from the Data Validation Error Report's Map visualise: Explore opens on that dataset's errors
  // (dataset-error-map.tsx) in place of the search.
  const datasetId = searchParams.get("dataset");
  const [appliedQuery, setAppliedQuery] = useState(urlQuery);
  // The saved search, unless a new header search asks for a different term.
  const [restored] = useState(() => {
    const saved = readExploreSearch();
    return saved && (urlQuery == null || saved.query === urlQuery) ? saved : null;
  });
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key && relatedLink.key !== CURRENT_KEY) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  // ── Search state ──
  // Multiple boundaries can be active at once, per direct feedback ("allow to add multiple
  // location selections"). `manualBoundaries` holds every drawn shape and every entered-
  // coordinate point - each an explicit, immutable add via a button press, only ever removed the
  // same way. Park selections are kept separately (`selectedParkIds` + the one shared
  // `parkRadius`) and turned into their own circle boundaries reactively via `parkBoundaries`
  // below, so changing the radius or the selection recomputes just those, never touching a
  // manually drawn shape or entered point.
  const [manualBoundaries, setManualBoundaries] = useState<Boundary[]>(() => restored?.manualBoundaries ?? (urlQuery ? [wholeStateBoundary()] : []));
  const [activeDrawTool, setActiveDrawTool] = useState<"circle" | "polygon" | null>(null);
  const [keyword, setKeyword] = useState(restored?.keyword ?? urlQuery ?? "");
  const [entityTab, setEntityTab] = useState<EntityTab>("projects");
  // Species mode vs. the Projects view. Explore always opens on Species (species first, per the designer): it does not inherit the tab from the saved search.
  const [viewMode, setViewMode] = useState<"records" | "species">("species");
  // The record whose summary card (record-peek-card.tsx) is open, picked from a card in the list or a dot
  // on the map.
  const [selectedRecord, setSelectedRecord] = useState<DetailRecord | null>(null);
  // The Leaflet map, for the zoom buttons Explore lays out itself (see growExplore).
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [panRequest, setPanRequest] = useState<{ key: number; point: [number, number] } | undefined>();
  // Selecting a record also centres its dot in the map's visible area, not just opens its card - per
  // direct feedback that a clicked record's dot could end up hidden under the results panel or
  // crammed at the map's raw edge right next to the peek card. Pan-only (see PanToRecord in
  // sa-map.tsx), never a zoom change. Every real "a user picked this record" call site below goes
  // through this instead of calling setSelectedRecord directly, so the centring can't be missed on
  // one path and not another.
  const selectRecord = (record: DetailRecord) => {
    setSelectedRecord(record);
    const point: [number, number] =
      record.kind === "event"
        ? [record.event.lat, record.event.lon]
        : record.kind === "occurrence"
          ? [record.occurrence.lat, record.occurrence.lon]
          : [record.observation.lat, record.observation.lon];
    setPanRequest((prev) => ({ key: (prev?.key ?? 0) + 1, point }));
  };
  // The Level 1/Level 2 access banner's own guest sign-up prompt (see below) - a guest sees the
  // same real banner and CTA a registered user does, but has no DLA section to navigate to, so
  // the CTA opens the same invite modal `GuestActionButton` already uses instead of a dead link.
  const [dlaSignUpOpen, setDlaSignUpOpen] = useState(false);
  // A guest's "Export results" opens its own prompt (it used to reuse the licence one, which asked
  // them to request full data access - the wrong message for an export).
  const [exportSignUpOpen, setExportSignUpOpen] = useState(false);
  // The banner is dismissible (a real corner close icon, per direct feedback) - once dismissed for
  // this session it stays gone rather than reappearing on every re-render; it's a live notice about
  // the current search's own data, not a one-time onboarding tip, so no persistence beyond this
  // component's own lifetime is attempted.
  const [dlaBannerDismissed, setDlaBannerDismissed] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [coordRadius, setCoordRadius] = useState(25);
  // Bumped after every "Add point" - forces the (uncontrolled) Latitude/Longitude fields to remount
  // and clear, so the next point can be entered without the previous one lingering. The radius
  // field is left alone so it carries over for the next point.
  const [coordResetKey, setCoordResetKey] = useState(0);

  const [selectedParkIds, setSelectedParkIds] = useState<Selection>(() => restored?.selectedParkIds ?? new Set());
  const [parkRadius, setParkRadius] = useState(restored?.parkRadius ?? 15);

  // Areas are added one at a time from an "Add area" menu, not from always-open method tabs:
  // `addingMethod` is the method whose short flow is open in the card (null when none).
  const [addingMethod, setAddingMethod] = useState<Method | null>(null);
  // Escape cancels a drawing in progress and changes nothing else (CONTRACTS 1.9): leaflet-draw stops its own handler on Escape, and this is what puts the card's state back.
  useEffect(() => {
    if (!activeDrawTool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAddingMethod(null);
      setActiveDrawTool(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeDrawTool]);
  // The add-area step (a form in the card) leaves the way a popover does: a press outside it, or Escape. The parks form has no button to leave by because it has nothing to commit: each park is on the map as it is
  // ticked, so a Done would only close it (designer, 23 Oct 2026: "done looks so weird there, it has absolutely no use"). The dropdown's list is portaled out of the step, so a press in it is a press in the step.
  const addAreaStepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (addingMethod !== "location") return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target || addAreaStepRef.current?.contains(target) || target.closest("[data-trigger], [role='listbox'], [role='dialog']")) return;
      setAddingMethod(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [addingMethod]);
  // The areas are layers: each can be hidden, renamed and resized on its own. Names are given when
  // an area is added ("Circle 1"), so removing one never renumbers the others.
  const [layerNames, setLayerNames] = useState<Record<string, string>>(() => restored?.layerNames ?? {});
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [fitRequest, setFitRequest] = useState<{ key: number; boundaries: Boundary[] } | undefined>();
  const layerCounters = useRef<Record<string, number>>(restored ? { ...restored.layerCounters } : {});
  const nextLayerName = (prefix: string) => {
    layerCounters.current[prefix] = (layerCounters.current[prefix] ?? 0) + 1;
    return `${prefix} ${layerCounters.current[prefix]}`;
  };

  const addManualBoundary = (boundary: Boundary, name?: string) => {
    setLayerNames((prev) => ({ ...prev, [boundary.id]: name ?? nextLayerName(boundary.kind === "circle" ? "Circle" : "Polygon") }));
    setManualBoundaries((prev) => [...prev, boundary]);
    setAddingMethod((current) => (current === "draw" ? null : current));
  };

  const applyCoordinates = () => {
    if (lat == null || lon == null) return;
    addManualBoundary({ id: `coord-${Date.now()}`, kind: "circle", center: [lat, lon], radiusKm: coordRadius }, nextLayerName("Point"));
    setAddingMethod(null);
    setLat(null);
    setLon(null);
    setCoordResetKey((k) => k + 1);
  };

  const parkBoundaries = useMemo<Boundary[]>(() => {
    const isSelected = (id: string) => selectedParkIds === "all" || selectedParkIds.has(id);
    return SA_NATIONAL_PARKS.filter((park) => isSelected(park.id)).map((park) => ({
      id: `park-${park.id}`,
      source: `park:${park.id}`,
      kind: "circle",
      center: [park.lat, park.lon],
      radiusKm: parkRadius,
      label: park.name,
    }));
  }, [selectedParkIds, parkRadius]);

  // Uploaded shapefiles - each file stays one grouped entry (one row in the areas list, removed as
  // a whole), expanded into real boundaries below: a circle of `shapefileRadius` around each point
  // (the map's own marker shows each point) and each polygon as drawn.
  const [shapefileLayers, setShapefileLayers] = useState<ShapefileLayer[]>(() => restored?.shapefileLayers ?? []);
  const [shapefileRadius, setShapefileRadius] = useState(restored?.shapefileRadius ?? 5);
  const [shapefileError, setShapefileError] = useState<string | null>(null);
  const [shapefileBusy, setShapefileBusy] = useState(false);
  const [shapefileInputKey, setShapefileInputKey] = useState(0);

  // Save the search whenever it changes (explore-search-store.ts), so a reload and "Back to results"
  // keep it.
  useEffect(() => {
    saveExploreSearch({
      query: appliedQuery,
      manualBoundaries,
      selectedParkIds,
      parkRadius,
      shapefileLayers,
      shapefileRadius,
      keyword,
      layerNames,
      layerCounters: { ...layerCounters.current },
      entityTab,
    });
  }, [appliedQuery, manualBoundaries, selectedParkIds, parkRadius, shapefileLayers, shapefileRadius, keyword, layerNames, entityTab]);

  const handleShapefileUpload = async (files: File[]) => {
    setShapefileBusy(true);
    setShapefileError(null);
    try {
      const layer = await parseShapefileUpload(files);
      setShapefileLayers((prev) => [...prev, layer]);
      setShapefileInputKey((k) => k + 1);
      setAddingMethod(null);
    } catch (error) {
      setShapefileError(error instanceof Error ? error.message : "We couldn't read that file.");
    } finally {
      setShapefileBusy(false);
    }
  };

  // A new `?q=` (the header search, used while already on this page) replaces the current search
  // with that term across the whole state. Adjusted during render, not in an effect, so there is no
  // flash of the previous results; `appliedQuery` stops it re-running for the same term.
  if (urlQuery && urlQuery !== appliedQuery) {
    setAppliedQuery(urlQuery);
    setKeyword(urlQuery);
    setManualBoundaries([wholeStateBoundary()]);
    setSelectedParkIds(new Set());
    setShapefileLayers([]);
    setViewMode("species");
    setEntityTab("projects");
  }

  const shapefileBoundaries = useMemo<Boundary[]>(
    () =>
      shapefileLayers.flatMap((layer) => [
        ...layer.points.map<Boundary>((center, i) => ({
          id: `${layer.id}-pt-${i}`,
          source: `shapefile:${layer.id}`,
          kind: "circle",
          center,
          radiusKm: shapefileRadius,
        })),
        ...layer.polygons.map<Boundary>((points, i) => ({
          id: `${layer.id}-poly-${i}`,
          source: `shapefile:${layer.id}`,
          kind: "polygon",
          points,
        })),
      ]),
    [shapefileLayers, shapefileRadius],
  );

  // ── The areas as layers ──
  // One layer per thing the user added: a drawn shape, an entered point, a national park, or a
  // shapefile (however many locations it holds). Each keeps its own name; the card shows it as a chip.
  // The search covers the union of the layers. (An area could once be hidden from the search, renamed,
  // given another radius and zoomed to from a row; those controls were taken out, 23 Oct 2026.)
  interface AreaLayer {
    id: string;
    name: string;
    kind: AreaKind;
    boundaries: Boundary[];
  }

  const explicitLayers = useMemo<AreaLayer[]>(() => {
    const out: AreaLayer[] = [];
    for (const b of manualBoundaries) {
      const isRegion = b.source === WHOLE_STATE_SOURCE;
      out.push({
        id: b.id,
        name: layerNames[b.id] ?? (isRegion ? "All of South Australia" : b.kind === "circle" ? "Circle" : "Polygon"),
        kind: b.id.startsWith("coord-") ? "point" : b.kind === "circle" ? "circle" : "polygon",
        boundaries: [b],
      });
    }
    for (const b of parkBoundaries) out.push({ id: b.id, name: layerNames[b.id] ?? b.label ?? "National park", kind: "park", boundaries: [b] });
    for (const layer of shapefileLayers) {
      const boundaries = shapefileBoundaries.filter((b) => b.source === `shapefile:${layer.id}`);
      out.push({ id: layer.id, name: layerNames[layer.id] ?? layer.name, kind: "shapefile", boundaries });
    }
    return out;
  }, [manualBoundaries, parkBoundaries, shapefileLayers, shapefileBoundaries, layerNames]);

  const explicitBoundaries = useMemo(() => explicitLayers.flatMap((l) => l.boundaries), [explicitLayers]);

  // A word with no area is a valid search on its own: it searches all of South Australia, shown as
  // a row in the areas list so the scope is visible. It exists only while the keyword does and no
  // area has been added at all. Either half works alone, both together narrow.
  const impliedWholeState = keyword.trim() !== "" && explicitLayers.length === 0;
  const boundaries = useMemo(
    () => (impliedWholeState ? [wholeStateBoundary()] : explicitBoundaries),
    [impliedWholeState, explicitBoundaries],
  );

  const removeBoundary = (target: Boundary) => {
    if (target.source?.startsWith("park:")) {
      const removedParkId = target.source.slice("park:".length);
      setSelectedParkIds((prev) =>
        prev === "all"
          ? new Set(SA_NATIONAL_PARKS.map((park) => park.id).filter((id) => id !== removedParkId))
          : new Set([...prev].filter((id) => id !== removedParkId)),
      );
    } else {
      setManualBoundaries((prev) => prev.filter((b) => b.id !== target.id));
    }
  };

  const clearAllBoundaries = () => {
    setManualBoundaries([]);
    setSelectedParkIds(new Set());
    setShapefileLayers([]);
  };

  // "New search": back to an empty map, as if Explore had just been opened (the saved search is
  // replaced by the empty one). Also drops a header-search term from the URL, so a reload does not
  // bring that search back.
  const hasSearch =
    keyword.trim() !== "" || manualBoundaries.length > 0 || shapefileLayers.length > 0 || selectedParkIds === "all" || selectedParkIds.size > 0;
  const startNewSearch = () => {
    clearAllBoundaries();
    setKeyword("");
    setLayerNames({});
    layerCounters.current = {};
    setAddingMethod(null);
    setActiveDrawTool(null);
    setViewMode("species");
    setEntityTab("projects");
    if (urlQuery) {
      setAppliedQuery(null);
      router.replace(roleHref("/pages/observations"));
    }
  };

  // Adding an area (drawn, entered, a park, a shapefile) always shows the Species tab,
  // whatever tab was open, so a new search leads with species (per the designer). Detected by a new
  // area id appearing, adjusted during render rather than in an effect.
  const areaIdsKey = [...manualBoundaries.map((b) => b.id), ...(selectedParkIds === "all" ? ["park:all"] : [...selectedParkIds].map((id) => `park:${id}`)), ...shapefileLayers.map((l) => l.id)].join("|");
  const [prevAreaIdsKey, setPrevAreaIdsKey] = useState(areaIdsKey);
  if (areaIdsKey !== prevAreaIdsKey) {
    const before = new Set(prevAreaIdsKey ? prevAreaIdsKey.split("|") : []);
    const added = areaIdsKey.split("|").some((id) => id && !before.has(id));
    setPrevAreaIdsKey(areaIdsKey);
    if (added && viewMode !== "species") setViewMode("species");
  }

  // What this role may see (record-access.ts): a public user never sees restricted (Level 2+)
  // records, so they are left out of every count, tab, dot and export below.
  const visibleOccurrences = useMemo(() => searchOccurrences.filter((o) => recordAccess(o, role) !== "hidden"), [role]);
  const visibleObservations = useMemo(() => searchObservations.filter((o) => recordAccess(o, role) !== "hidden"), [role]);
  const visibleResources = useMemo(() => searchResources.filter((r) => artefactAccess(r, role) !== "hidden"), [role]);

  const removeLayer = (id: string) => {
    if (manualBoundaries.some((b) => b.id === id)) return setManualBoundaries((prev) => prev.filter((b) => b.id !== id));
    if (shapefileLayers.some((l) => l.id === id)) return setShapefileLayers((prev) => prev.filter((l) => l.id !== id));
    const park = parkBoundaries.find((b) => b.id === id);
    if (park) removeBoundary(park);
  };
  const highlightedBoundaryIds = useMemo(() => new Set(explicitLayers.find((l) => l.id === hoveredLayerId)?.boundaries.map((b) => b.id) ?? []), [explicitLayers, hoveredLayerId]);
  // An area and its shape are one thing to the person: pointing at either lights the other, and pressing either takes the map to it (`FlyToRequest`, with the card's padding).
  const zoomToLayer = (id: string) => {
    const layer = explicitLayers.find((l) => l.id === id);
    if (layer) setFitRequest({ key: Date.now(), boundaries: layer.boundaries });
  };
  const layerOfBoundary = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of explicitLayers) for (const b of l.boundaries) m.set(b.id, l.id);
    return m;
  }, [explicitLayers]);
  const areaChips = (
    <AreaLayerChips
      areas={explicitLayers.map(({ id, name, kind }) => ({ id, name, kind }))}
      highlightedId={hoveredLayerId}
      onRemove={removeLayer}
      onHover={setHoveredLayerId}
      onZoom={zoomToLayer}
    />
  );

  // ── Results filtering - real spatial + keyword filtering against the union of every active
  //     boundary, not decorative furniture: a circle boundary uses real haversine distance, a
  //     polygon uses a real point-in-polygon test (see app/pages/_shared/map-search/geo.ts). The
  //     search card's keyword narrows the same set. ──
  //
  // Core invariant, per direct feedback: every Event/Occurrence/Observation/Artefact shown in a
  // results tab must belong (via its real Project -> Event -> Occurrence -> Observation ancestry,
  // see .claude/rules/ref-domain.md, "BDBSA domain research") to a Project that's also shown in the Projects tab -
  // "if there are 20 events shown, it means the 20 events are somehow linked to the projects that
  // are fetched as results." Computed in two passes:
  //  1. `matchingProjectIds` - a Project qualifies if it, or ANY of its descendants (an Event, an
  //     Occurrence, an Observation, or an Artefact/Attachment), spatially + keyword matches, and
  //     the Project's own status is published (Active/Completed - same exclusion as before). A
  //     roll-up match, not just the Project's own single point - a Project is a container, not a
  //     point on the map, so it's "found" once any real data under it falls inside the search area.
  //  2. Each child tab then shows only records that (a) themselves spatially + keyword match, AND
  //     (b) belong to a Project in `matchingProjectIds` - so a record under an excluded Project
  //     (unpublished, or with nothing else in the area) never appears orphaned from its own parent.
  const matchingProjectIds = useMemo(() => {
    const touched = new Set<string>();
    for (const e of searchEvents) {
      if (isPointInAnyBoundary([e.lat, e.lon], boundaries) && matchesKeyword(`${e.name} ${e.type} ${e.org}`, keyword)) {
        touched.add(rootProjectOfEvent(e).id);
      }
    }
    for (const o of visibleOccurrences) {
      if (isRecordInAnyBoundary(o.lat, o.lon, generalisedKm(o, role), boundaries) && matchesKeyword(`${o.species} ${o.commonName} ${o.type}`, keyword)) {
        const project = rootProjectForParentEventId(o.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    for (const o of visibleObservations) {
      if (isRecordInAnyBoundary(o.lat, o.lon, generalisedKm(o, role), boundaries) && matchesKeyword(`${o.species} ${o.observerName} ${o.type}`, keyword)) {
        const project = rootProjectForParentEventId(o.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    for (const r of visibleResources) {
      if (isRecordInAnyBoundary(r.lat, r.lon, artefactGeneralisedKm(r, role), boundaries) && matchesKeyword(`${r.name} ${r.recordName} ${r.attachedToConcept}`, keyword)) {
        const project = rootProjectForParentEventId(r.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    // Draft and Under review projects are excluded from search results entirely, same precedent
    // already established for the "Featured Projects" home-dashboard section (app/pages/_shared/
    // home-dashboard.tsx's `featuredProjects`) - and, per the invariant above, excluding a Project
    // here also excludes every one of its descendants below, rather than leaving them shown with
    // no visible parent in the Projects tab.
    return new Set(
      searchEvents.filter((e) => e.type === "Project" && touched.has(e.id) && (e.status === "Active" || e.status === "Completed")).map((e) => e.id),
    );
  }, [boundaries, keyword, visibleOccurrences, visibleObservations, visibleResources, role]);

  const filteredProjects = useMemo(() => searchEvents.filter((e) => e.type === "Project" && matchingProjectIds.has(e.id)), [matchingProjectIds]);

  const filteredEvents = useMemo(
    () =>
      searchEvents.filter(
        (e) =>
          e.type !== "Project" &&
          isPointInAnyBoundary([e.lat, e.lon], boundaries) &&
          matchesKeyword(`${e.name} ${e.type} ${e.org}`, keyword) &&
          matchingProjectIds.has(rootProjectOfEvent(e).id),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const filteredOccurrences = useMemo(
    () =>
      visibleOccurrences.filter(
        (o) =>
          isRecordInAnyBoundary(o.lat, o.lon, generalisedKm(o, role), boundaries) &&
          matchesKeyword(`${o.species} ${o.commonName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds, visibleOccurrences, role],
  );
  const filteredObservations = useMemo(
    () =>
      visibleObservations.filter(
        (o) =>
          isRecordInAnyBoundary(o.lat, o.lon, generalisedKm(o, role), boundaries) &&
          matchesKeyword(`${o.species} ${o.observerName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds, visibleObservations, role],
  );
  const filteredResources = useMemo(
    () =>
      visibleResources.filter(
        (r) =>
          isRecordInAnyBoundary(r.lat, r.lon, artefactGeneralisedKm(r, role), boundaries) &&
          matchesKeyword(`${r.name} ${r.recordName} ${r.attachedToConcept}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(r.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds, visibleResources, role],
  );

  const totalCount = filteredProjects.length + filteredEvents.length + filteredOccurrences.length + filteredObservations.length + filteredResources.length;

  // Same real behaviour the top-level DLA banner's own "Go to DLA"/"Sign up for access" CTA
  // already uses (see the AlertFullWidth below) - pulled out so Species mode's own DLA notice and
  // export gating (species-results.tsx) can reuse it rather than reimplementing the branch.
  const requestDlaAccess = () => {
    if (isPublicUser) {
      setDlaSignUpOpen(true);
      return;
    }
    const dlaSection = nav.find((section) => section.label === "Data Licencing Agreement (DLA)");
    if (dlaSection) goToSection(dlaSection);
  };

  // The Projects tab's own export rows: the same plain fields `recordsExportHeaders` names, in the same order.
  const recordsExportRows = (): string[][] => filteredProjects.map((e) => [e.code, e.name, e.org, e.status, e.contributorName ?? "-", e.updated ?? "-"]);

  // The "Export results" control - works in both view modes, per direct feedback ("the export
  // results disappears when records view is selected... make sure the export button stays").
  // Species mode reuses `EXPORT_HEADERS`/`exportRowFor` exported from species-results.tsx; the
  // Projects tab exports its own rows, via `recordsExportHeaders`/`recordsExportRows` above. Same guest gating either way - a guest's click opens the sign-up
  // invite modal instead of downloading anything.
  const runExport = (kind: "csv" | "excel" | "pdf") => {
    if (isPublicUser) {
      setExportSignUpOpen(true);
      return;
    }
    const headers = viewMode === "species" ? EXPORT_HEADERS : recordsExportHeaders[entityTab];
    // Species mode exports the species list the card shows.
    const speciesRowsOut = filteredOccurrences.filter((o) => o.family && o.group);
    const rowsOut =
      viewMode === "species" ? speciesRowsOut.map((o) => exportRowFor(o, recordAccess(o, role) === "generalised")) : recordsExportRows();
    const baseName = viewMode === "species" ? "biodata-sa-species-search" : `biodata-sa-${entityTab}-search`;
    const title = viewMode === "species" ? "BioData SA - Species Search Results" : "BioData SA - Projects Results";
    if (kind === "csv") downloadCsv(`${baseName}.csv`, headers, rowsOut);
    if (kind === "excel") downloadExcel(`${baseName}.xls`, headers, rowsOut);
    if (kind === "pdf") printAsPdf(title, headers, rowsOut);
  };

  const iconRail = (
    <PrimaryRail sections={nav} activeSection={activeSection} onSelectSection={goToSection} />
  );

  const signUpModals = (
    <>
                <SignUpPromptModal
                  isOpen={exportSignUpOpen}
                  onOpenChange={setExportSignUpOpen}
                  icon={Download01}
                  title="Sign up to export data"
                  description="Exporting records needs a free BioData SA account. Create one to download project and record data."
                />
                <SignUpPromptModal
                  isOpen={dlaSignUpOpen}
                  onOpenChange={setDlaSignUpOpen}
                  icon={FileLock01}
                  title="Sign up to request full access"
                  description="Restricted data needs a free BioData SA account. Create one to request a Data Licencing Agreement (DLA)."
                />
    </>
  );

  const exportControl = (
    <>
                        {isPublicUser ? (
                          // `Tooltip` (not `TooltipTrigger`, which renders its own real
                          // `<button>`) wrapping a real, enabled `Button` directly -
                          // `TooltipTrigger` would nest one button inside another, invalid HTML.
                          <Tooltip title="Create a free account to export results">
                            <Button color="link-gray" size="xs" iconLeading={Download01} onPress={() => setExportSignUpOpen(true)}>
                              Export data
                            </Button>
                          </Tooltip>
                        ) : (
                          <Dropdown.Root>
                            <Button color="link-gray" size="xs" iconLeading={Download01}>
                              Export data
                            </Button>
                            <Dropdown.Popover placement="bottom right" className="w-48">
                              <Dropdown.Menu aria-label="Export format">
                                <Dropdown.Item id="csv" icon={FileDownload01} onAction={() => runExport("csv")}>
                                  Export as CSV
                                </Dropdown.Item>
                                <Dropdown.Item id="excel" icon={File07} onAction={() => runExport("excel")}>
                                  Export as Excel
                                </Dropdown.Item>
                                <Dropdown.Item id="pdf" icon={Printer} onAction={() => runExport("pdf")}>
                                  Export as PDF
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.Root>
                        )}
    </>
  );

  // The three add-area forms are one pattern: the choice and the radius in one row (the choice grows, the radius is a fixed 7rem), small fields (36px, 14px, the size of the search field below and of the toolbar's
  // controls, not the medium form size that made an open form outweigh the card around it), a label above each so the row lines up. The panel's title (14/600) is the form's one heading.
  const radiusClass = "w-28 shrink-0";
  const coordinatesBody = (
    <>
      <div className="grid grid-cols-[1fr_1fr_7rem] items-start gap-3">
        <InputNumber key={`lat-${coordResetKey}`} size="sm" label="Latitude" placeholder="-34.93" step={0.01} minValue={-38} maxValue={-25} onChange={setLat} />
        <InputNumber key={`lon-${coordResetKey}`} size="sm" label="Longitude" placeholder="138.60" step={0.01} minValue={129} maxValue={141} onChange={setLon} />
        <InputNumber size="sm" label="Radius (km)" defaultValue={25} minValue={5} maxValue={300} step={5} onChange={setCoordRadius} />
      </div>
      <Button color="secondary" size="sm" iconLeading={Plus} isDisabled={lat == null || lon == null} onPress={applyCoordinates}>
        Add point
      </Button>
    </>
  );

  const locationBody = (
    <div className="flex items-start gap-3">
      {/* No badges under this field (`showSelectedBadges`, on by default for every MultiSelect): each chosen park is already a removable chip under the search field, one place to read and take it off (4.3), and six
          badges would fill the step and push the results off the card. */}
      <MultiSelect size="sm" label="Parks" placeholder="Choose one or more parks" items={parkItems} selectedKeys={selectedParkIds} onSelectionChange={setSelectedParkIds} showSelectedBadges={false} className="min-w-0 flex-1">
        {(item) => <MultiSelect.Item {...item}>{item.label}</MultiSelect.Item>}
      </MultiSelect>
      <InputNumber size="sm" label="Radius (km)" defaultValue={parkRadius} minValue={5} maxValue={100} step={5} onChange={setParkRadius} className={radiusClass} />
    </div>
  );

  const shapefileBody = (
    <>
      <p className="text-sm text-tertiary">Upload a shapefile to search around the locations it contains. Points are searched within the radius, polygons as drawn.</p>
      <div className="flex items-start gap-3">
        <InputFile
          key={`shp-${shapefileInputKey}`}
          label="Shapefile"
          placeholder={shapefileBusy ? "Reading file…" : "Choose file(s)"}
          acceptedFileTypes={[".zip", ".shp", ".dbf", ".prj", ".cpg", ".geojson", ".json"]}
          allowsMultiple
          isInvalid={!!shapefileError}
          hint={shapefileError ?? "A .zip of the shapefile, or the .shp with its .dbf and .prj selected together. GeoJSON also works. Up to 500 locations."}
          onChange={(files) => files && files.length > 0 && handleShapefileUpload(Array.from(files))}
          className="min-w-0 flex-1"
        />
        <InputNumber size="sm" label="Radius (km)" value={shapefileRadius} minValue={1} maxValue={100} step={1} onChange={(v) => setShapefileRadius(v || 1)} className={radiusClass} />
      </div>
    </>
  );

  // The data-access notice, worded for who is looking (record-access.ts): a public user is told
  // restricted records are left out; other signed-in roles that restricted locations are only
  // approximate. BioData Admin sees all data, so gets no notice.
  const seesAllData = hasFeatureAccess("restrictedData", role);
  const accessNoticeTitle = isPublicUser ? "You're viewing public data" : "Some locations are approximate";
  const accessNoticeBody = isPublicUser
    ? "Sensitive records are not shown. Sign up and request a Data Licencing Agreement (DLA) to see them."
    : "Sensitive species are shown only to an approximate area. Request a Data Licencing Agreement (DLA) for full access.";

  const dlaBanner =
    !dlaBannerDismissed && !seesAllData ? (
      <PageBanner
        title={accessNoticeTitle}
        description={accessNoticeBody}
        actionLabel={isPublicUser ? "Sign up for access" : "Go to DLA"}
        actionIcon={isPublicUser ? UserPlus01 : ArrowNarrowRight}
        actionIconPosition={isPublicUser ? "leading" : "trailing"}
        onAction={requestDlaAccess}
        onDismiss={() => setDlaBannerDismissed(true)}
      />
    ) : null;

  // ── One screen ──
  // The search controls and the results float over the map, so nothing redirects and there is no map
  // view / table view to switch between. There is no Search button: the results follow the search
  // area and keyword as they change.

  // One dot per record in what the panel is showing, so a row in the table and a point on the map
  // are the same record: clicking a dot opens that record, like clicking its row.
  // One dot per plotted record, coloured by species group (the same groups and order as the Species
  // tiles) on the Species, Occurrences, Observations and Artefacts tabs; an artefact takes its
  // record's group. A record with no species group (Non-biotic, Community) is "Other", grey.
  // Projects and events stay brand, one colour, so they get no key. `legendKey` feeds the key on
  // the map (only what is plotted is listed).
  type ExploreMarker = SAMapMarker & { legendKey?: SpeciesGroup | "Other" };
  const mapMarkers = useMemo<ExploreMarker[]>(() => {
    const pt = (id: string, lat: number, lon: number, label: string): ExploreMarker => ({ id, position: [lat, lon], label });
    const groupStyle = (group: SpeciesGroup | undefined) => ({
      legendKey: group ?? ("Other" as const),
      color: group ? SPECIES_GROUP_COLOR[group] : OTHER_RECORD_COLOR,
    });
    // A restricted (Level 2) record is never pinned: it is drawn as the square block of the grid that
    // contains it (the same block the record page shows), flat and with no centre mark, so the map
    // cannot give away where in the block a sensitive species is.
    const fuzzyPt = (id: string, lat: number, lon: number, label: string, km: number | null, group: SpeciesGroup | undefined): ExploreMarker => {
      if (!km) return { ...pt(id, lat, lon, label), ...groupStyle(group) };
      const block = generalisedBlock(lat, lon, km);
      return { id, position: blockCentre(block), label: `${label} - location restricted to a ${km} km block`, fuzzyBlock: block, ...groupStyle(group) };
    };
    const recordPt = (o: SearchOccurrence) => fuzzyPt(`occurrence:${o.id}`, o.lat, o.lon, o.commonName, generalisedKm(o, role), o.group);
    // The Species tab lists species only, so it plots only records that are a species.
    if (viewMode === "species") return filteredOccurrences.filter((o) => o.family && o.group).map(recordPt);
    return filteredProjects.map((e) => pt(`event:${e.id}`, e.lat, e.lon, e.name));
  }, [viewMode, filteredProjects, filteredOccurrences, role]);

  // The key to the dots: each species group in view (in the Species tiles' order), then "Other",
  // then the block when a restricted record is plotted. Empty for projects and events.
  const legendItems = useMemo<LegendItem[]>(() => {
    if (!mapMarkers.some((m) => m.legendKey)) return [];
    const present = new Set(mapMarkers.map((m) => m.legendKey));
    const items: LegendItem[] = SPECIES_GROUP_ORDER.filter((g) => present.has(g)).map((g) => ({ id: g, label: g, color: SPECIES_GROUP_COLOR[g] }));
    if (present.has("Other")) items.push({ id: "other", label: "Other record", color: OTHER_RECORD_COLOR });
    if (mapMarkers.some((m) => m.fuzzyBlock)) items.push({ id: "restricted", label: "Restricted (block)", color: OTHER_RECORD_COLOR, fuzzy: true });
    return items;
  }, [mapMarkers]);

  // A dot opens what its card opens: the record's summary card (with "Show in project").
  const onMarkerClick = (markerId: string) => {
    const [kind, ...rest] = markerId.split(":");
    const id = rest.join(":");
    if (kind === "event") {
      const event = searchEvents.find((e) => e.id === id);
      if (event) selectRecord({ kind: "event", event });
    } else if (kind === "occurrence") {
      const occurrence = searchOccurrences.find((o) => o.id === id);
      if (occurrence) selectRecord({ kind: "occurrence", occurrence });
    }
  };

  // ── The panel: one row of tabs, then the list ──
  // Species, then Projects, each with its count; the list shows short cards (a title and two lines). A card or its dot opens the record's summary card on the map, whose "Show
  // in project" opens the record on its project's page.
  type PanelView = "species" | EntityTab;
  const panelView: PanelView = viewMode === "species" ? "species" : entityTab;
  const setPanelView = (next: PanelView) => {
    // The summary card belongs to the tab it was opened from; switching tabs closes it.
    if (next !== panelView) setSelectedRecord(null);
    if (next === "species") setViewMode("species");
    else {
      setViewMode("records");
      setEntityTab(next);
    }
    setListLimit(LIST_STEP);
    // A different tab is a different list: it starts at its top, not where the last one was left (nor where it was left before the list was hidden).
    listRef.current?.scrollTo({ top: 0 });
    forgetScroll();
  };
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const selectedMarkerId = selectedRecord
    ? selectedRecord.kind === "event"
      ? `event:${selectedRecord.event.id}`
      : selectedRecord.kind === "occurrence"
        ? `occurrence:${selectedRecord.occurrence.id}`
        : `observation:${selectedRecord.observation.id}`
    : null;
  // The summary card shows only while its record is one of the active tab's results, so a changed
  // tab, keyword or area never leaves a card for a record that is no longer listed.
  const peekVisible = !!selectedMarkerId && mapMarkers.some((m) => m.id === selectedMarkerId);

  const [listLimit, setListLimit] = useState(LIST_STEP);
  const listRef = useRef<HTMLDivElement>(null);
  // The card folds to its count line so the map can be seen whole, as Map visualise's does; the list comes back as it was.
  const { open: listOpen, toggle: toggleList, forgetScroll } = useListToggle(listRef);

  const speciesRows = useMemo(() => filteredOccurrences.filter((o) => o.family && o.group), [filteredOccurrences]);
  const panelTabs: { id: PanelView; label: string; count: number }[] = [
    { id: "species", label: "Species", count: speciesRows.length },
    { id: "projects", label: "Projects", count: filteredProjects.length },
  ];

  // Cards for the current view. `markerId` ties a card to its dot on the map.
  interface CardItem {
    id: string;
    markerId: string;
    icon: FC<{ className?: string }>;
    /** A species photo (or its group icon on a tile) in place of the icon. */
    thumb?: ReactNode;
    title: string;
    subtitle?: string;
    subtitleItalic?: boolean;
    meta?: string;
    badge?: ReactNode;
    onSelect: () => void;
  }
  const speciesThumb = (r: { species: string; commonName: string; group?: SpeciesGroup }) =>
    r.group ? <SpeciesPhoto scientificName={r.species} alt={r.commonName} fallbackIcon={SPECIES_GROUP_ICON[r.group]} className="size-10" /> : undefined;
  const provenance = (parentEventId: string) => {
    const root = rootProjectForParentEventId(parentEventId);
    return root ? `${root.org}, ${root.name}` : undefined;
  };
  // "Restricted" only where the location is actually generalised for this role (record-access.ts).
  const restrictedBadge = (r: SearchOccurrence | SearchObservation) =>
    recordAccess(r, role) === "generalised" ? (
      <Badge size="sm" color="warning">
        Restricted
      </Badge>
    ) : undefined;
  const cardItems: CardItem[] = (() => {
    switch (panelView) {
      case "species":
        return speciesRows.map((o) => ({
          id: o.id,
          markerId: `occurrence:${o.id}`,
          icon: SPECIES_GROUP_ICON[o.group!],
          thumb: speciesThumb(o),
          title: o.commonName,
          subtitle: o.species,
          subtitleItalic: true,
          meta: provenance(o.parentEventId),
          badge: restrictedBadge(o),
          onSelect: () => selectRecord({ kind: "occurrence", occurrence: o }),
        }));
      case "projects":
        return filteredProjects.map((e) => ({
          id: e.id,
          markerId: `event:${e.id}`,
          icon: Folder,
          title: e.name,
          subtitle: e.org,
          meta: `${e.code}${e.updated ? `, updated ${e.updated}` : ""}`,
          badge: (
            <Badge size="sm" color={e.statusColor}>
              {e.status}
            </Badge>
          ),
          onSelect: () => selectRecord({ kind: "event", event: e }),
        }));
    }
  })();
  // A search that changes the list while it is hidden is a different list: it unfolds at its top, not where the old one was left.
  const listIdentity = `${panelView}|${keyword}|${cardItems.length}`;
  useEffect(() => {
    forgetScroll();
  }, [listIdentity, forgetScroll]);

  // One row of switching: Species and Projects, each with its count.
  const panelTabsEl = (
    <>
              <ScrollFade className="mt-1.5 mb-0 px-4">
                <Tabs selectedKey={panelView} onSelectionChange={(key) => setPanelView(key as PanelView)} className="min-w-max">
                  <TabList aria-label="Result type" type="underline" size="sm">
                    {panelTabs.map((t) => (
                      <Tab key={t.id} id={t.id} label={t.label} badge={t.count} />
                    ))}
                  </TabList>
                </Tabs>
              </ScrollFade>

    </>
  );

  // The body of the results: the tabs, then the list. What is typed in the search field narrows the
  // results.
  const resultsBody = (
    <>
      {panelTabsEl}
      <MapResultList total={cardItems.length} shown={listLimit} onShowMore={() => setListLimit((n) => n + LIST_STEP)} scrollRef={listRef}>
        {cardItems.length === 0 ? (
          <p className="px-3 py-6 text-sm text-balance text-tertiary">Nothing of this kind here. Try a larger area, a different word or another tab.</p>
        ) : (
          <>
            {/* The list opens with the name of what it holds and the one thing to do with all of it, as Map visualise's does (its category and its column of badges): the same row in every tab. The count is on the tab. */}
            <ChunkHeading label={panelTabs.find((t) => t.id === panelView)?.label ?? ""} trailing={exportControl} roomy />
            {cardItems.slice(0, listLimit).map((c) => (
              <ResultCard
                key={c.id}
                icon={c.icon}
                thumb={c.thumb}
                title={c.title}
                subtitle={c.subtitle}
                subtitleItalic={c.subtitleItalic}
                meta={c.meta}
                badge={c.badge}
                onSelect={c.onSelect}
                onHoverChange={(hovered) => setHoveredMarkerId(hovered ? c.markerId : null)}
              />
            ))}
          </>
        )}
      </MapResultList>
    </>
  );

  // ── The floating card ──
  // The card over the map's left: results appear on the same page, live, with no Search step and no
  // redirect. One card - the setup folds to the areas list and the same card grows a results list.
  // There is no column 2 (CONTRACTS 3.7 override, 1 Oct 2026): the areas are a section of the card and
  // the data-access notice is the banner across the top of the map.
  const hasAreas = boundaries.length > 0;

  const floatCard = cx("flex flex-col overflow-hidden rounded-xl", MAP_SURFACE_EDGE, "bg-primary shadow-lg");
  const rise = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:ease-out";

  // ── Adding an area: one menu, then a short flow for that method only ──
  const startAdding = (key: string) => {
    if (key === "circle" || key === "polygon") {
      setAddingMethod("draw");
      setActiveDrawTool(key);
      return;
    }
    setActiveDrawTool(null);
    setAddingMethod(key as Method);
  };
  const cancelAdding = () => {
    setAddingMethod(null);
    setActiveDrawTool(null);
  };
  const addAreaMenu = (
    <Dropdown.Root>
      {/* At the card's right edge the fill's edge, not the text's, is what lines up with the field below (`mr-0!`): a ghost's fill hangs 6px out of its text, and out here that is into the card's padding. */}
      <Button color="ghost-color" size="sm" iconLeading={Plus} className="mr-0!">
        Add area
      </Button>
      <Dropdown.Popover placement="bottom right" className="w-56">
        <Dropdown.Menu aria-label="Add a search area" onAction={(key) => startAdding(String(key))}>
          <Dropdown.Item id="circle" label="Draw a circle" icon={Circle} />
          <Dropdown.Item id="polygon" label="Draw a polygon" icon={Pentagon} />
          <Dropdown.Separator />
          <Dropdown.Item id="coordinates" label="Enter coordinates" icon={MarkerPin02} />
          <Dropdown.Item id="location" label="Choose national parks" icon={Map02} />
          <Dropdown.Item id="shapefile" label="Upload a shapefile" icon={Upload01} />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
  // Drawing has no panel in the card: its instruction and its Cancel are on the map, where the pointer is (`DrawStatusBar`). The other three methods are forms, and stay in the card.
  // Coordinates and a shapefile are transactions (something is entered, then added or uploaded), so each has a title and a Cancel. The parks form is not: the choice is on the map as it is made, so it has no title (its
  // field says what it is) and nothing to confirm or cancel.
  const addAreaTitle: Record<"coordinates" | "shapefile", string> = {
    coordinates: "Enter coordinates",
    shapefile: "Upload a shapefile",
  };
  const addAreaPanel = addingMethod && addingMethod !== "draw" && (
    // A step inside the card, not part of the search: a tinted strip between two rules, so its fields do not read as the first of the search field's below (they are the same size).
    <div
      ref={addAreaStepRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancelAdding();
      }}
      className={cx("flex shrink-0 flex-col gap-3 border-y border-secondary bg-secondary px-4 py-3", rise)}
    >
      {addingMethod !== "location" && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-primary">{addAreaTitle[addingMethod]}</p>
          <Button color="link-gray" size="sm" onPress={cancelAdding}>
            Cancel
          </Button>
        </div>
      )}
      {addingMethod === "coordinates" && coordinatesBody}
      {addingMethod === "location" && locationBody}
      {addingMethod === "shapefile" && shapefileBody}
    </div>
  );
  // The one line of guidance, for a card with nothing in it yet: the two ways to start, in the order a person takes them (search everywhere, or narrow to an area), as plainly as they would say it. It is the field's own
  // hint (the design system's `HintText` under the field, which also describes the field to a screen reader), so it is one thing with the field, in the type the product's field hints have. It goes once there is a
  // word, an area or a form open: from then on the heading counts the results and the chips say where.
  const showGrowHint = !addingMethod && !hasAreas && explicitLayers.length === 0 && !keyword.trim();
  const growSearchField = (
    <Input
      icon={SearchLg}
      aria-label="Search species or keyword"
      placeholder="Search a species or keyword"
      hint={showGrowHint ? "Search all of South Australia, or add an area." : undefined}
      value={keyword}
      onChange={setKeyword}
      onClear={() => setKeyword("")}
      clearLabel="Clear search"
    />
  );

  // Explore has no column 2 (designer, 1 Oct 2026; CONTRACTS 3.7): the map takes the whole width, the
  // search areas are a section of the floating card (`AreaLayerChips`, always shown under the card's Search results heading),
  // and the data-access notice some roles see is a warning banner across the top of the map (`dlaBanner`).
  const floatMap = (padTopLeft: [number, number], padBottomRight: [number, number]) => (
    <div className="absolute inset-0">
      <SAMap
        boundaries={boundaries}
        onBoundaryAdd={addManualBoundary}
        activeDrawTool={activeDrawTool}
        onDrawToolChange={setActiveDrawTool}
        fitPaddingTopLeft={padTopLeft}
        fitPaddingBottomRight={padBottomRight}
        markers={mapMarkers}
        onMarkerClick={onMarkerClick}
        highlightedMarkerId={hoveredMarkerId ?? selectedMarkerId}
        highlightedBoundaryIds={highlightedBoundaryIds}
        fitRequest={fitRequest}
        onBoundaryHover={(boundaryId) => setHoveredLayerId(boundaryId ? (layerOfBoundary.get(boundaryId) ?? null) : null)}
        onBoundaryClick={(boundaryId) => {
          const layerId = layerOfBoundary.get(boundaryId);
          if (layerId) zoomToLayer(layerId);
        }}
        panRequest={panRequest}
        showZoomControls={false}
        onMapReady={setMapInstance}
        className="size-full"
      />
    </div>
  );

  const floatFrame = (children: ReactNode) => (
    <div className="flex flex-1 overflow-hidden">
      {iconRail}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {dlaBanner}
        <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
        {signUpModals}
      </main>
    </div>
  );

  // ── 1. Grows in place ──
  const growExplore = floatFrame(
    <>
      {floatMap([448, 48], [48, 48])}
      {/* Every floating panel on the map is laid out by this one layer, never positioned on its own:
          a left column holding the search card with the map key at its foot, and a right column
          holding the zoom buttons and the picked record's summary card. Panels in a flex layout
          cannot overlap. The key sits on the left so the summary card gets the right column's full
          height and never needs to scroll. Where the map is too narrow for both columns side by
          side (below 648px) the right column moves under the left one. The bottom padding keeps the map's scale bar
          (bottom-left) and attribution (bottom-right) clear. The layer lets clicks through to the
          map; each panel takes its own. */}
      <div className="pointer-events-none absolute inset-0 z-[1000] @container">
        <div className="flex size-full flex-col gap-4 p-4 pb-9">
        <div className="flex min-h-0 flex-1 flex-col gap-4 @min-[648px]:flex-row">
      {/* One fixed width, whatever the state: empty, searching, results, a key or none. The card used to
          take the key's measured width, so it grew by a few pixels the moment results appeared (and
          the key with them). It now only gives way to the summary card's column when the map is narrow. */}
      <div className="flex min-h-0 w-full flex-col items-start gap-3 @max-[647px]:min-h-[72px] @max-[647px]:shrink-[1000] @min-[648px]:w-[440px] @min-[648px]:min-w-[280px] @min-[648px]:shrink">
      <section
        aria-label="Search the map"
        className={cx(floatCard, "pointer-events-auto min-h-0 w-full shrink @max-[647px]:min-h-[72px]")}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 pt-4 pb-3">
          {/* The card's title layer is Map visualise's: the eyebrow (12/600, uppercase) over the title (18/600). */}
          <div className="min-w-0">
            <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Explore</p>
            <h2 className="m-0! mt-0.5! text-lg! font-semibold! tracking-normal! whitespace-nowrap text-primary!">Search the map</h2>
          </div>
          <div className="flex items-center gap-4">
            {hasSearch && (
              <Button color="link-gray" size="sm" iconLeading={RefreshCcw01} onPress={startNewSearch}>
                New search
              </Button>
            )}
            {addAreaMenu}
          </div>
        </div>
        {/* Capped by the window, not by the card: the card is as tall as its content, so a percentage of it (it was 50%) cut the form to half of itself, "Add point" and the file hint with it. */}
        {addAreaPanel && <div className="max-h-[50vh] shrink-0 overflow-y-auto">{addAreaPanel}</div>}
        <div className={cx("flex shrink-0 flex-col gap-2 px-4 pb-3", addAreaPanel ? "pt-3" : "pt-1")}>
          {growSearchField}
        </div>
        {hasAreas && (
          <div className="flex shrink-0 flex-col gap-3 px-4 pb-4">
            {/* What the search found and where: the heading names the results and counts every record in every area, the areas are chips (an X takes one away), and Hide list folds what is under the divider so the map can be
                seen, as on Map visualise. A keyword with no area searches the whole state, which is the search field's to say, so it has no chip. */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0! flex items-center gap-2 text-xs! font-semibold! tracking-wide! text-quaternary! uppercase">
                Search results
                <CountBadge count={totalCount} />
              </h3>
              <ListToggleButton open={listOpen} onToggle={toggleList} controls="explore-results-list" />
            </div>
            {areaChips}
          </div>
        )}
        {hasAreas && listOpen && (
          <div id="explore-results-list" className={cx("flex min-h-0 flex-1 flex-col border-t border-secondary", rise)}>
            {resultsBody}
          </div>
        )}
      </section>
      </div>
          <div className="flex min-h-0 flex-col items-end gap-3 @min-[648px]:ml-auto @min-[648px]:w-[320px] @min-[648px]:shrink-0">
            <MapZoomButtons map={mapInstance} className="pointer-events-auto shrink-0" />
            {/* A picked record shows as a short summary card, not a slide-in panel; its "Show in
                project" opens the record on its project's page. Artefacts open in the viewer, a
                modal. */}
            {peekVisible && selectedRecord && (
              <RecordPeekCard
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
                className="pointer-events-auto min-h-0 w-full max-w-none shrink motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
              />
            )}
          </div>
        </div>
        {/* The key has its own row along the bottom of the map, below both columns, so it can sit on
            one line instead of wrapping inside the search card's 400px column (per the designer). On
            a narrow map it becomes a two-column grid; when the panels stack there is no room for both
            the key and an open summary card, so the key steps aside until the card is closed. */}
        {/* The draw bar is on the map's own centre line (designer, 23 Oct 2026: "why is this not centre aligned?"), not in what is left beside the key. Where the map is 1500px wide the key (at most 456px from the
            left) and the bar (about 512px, centred) cannot meet, so the bar sits on the key's baseline; where it is narrower the bar goes under the key, still centred, and never over it (2.8). */}
        <div className="relative flex w-full shrink-0 flex-col items-start gap-3">
          {legendItems.length > 0 && (
            <div className={cx("max-w-full shrink-0 @min-[648px]:max-w-[440px]", peekVisible && "@max-[647px]:hidden")}>
              <MapLegend title="Species group" items={legendItems} />
            </div>
          )}
          {activeDrawTool && (
            <DrawStatusBar tool={activeDrawTool} onCancel={cancelAdding} className="self-center @min-[1500px]:absolute @min-[1500px]:bottom-0 @min-[1500px]:left-1/2 @min-[1500px]:-translate-x-1/2" />
          )}
        </div>
        </div>
      </div>
    </>,
  );

  const datasetExplore = datasetId
    ? floatFrame(<DatasetErrorMap datasetId={datasetId} onSearchExplore={() => router.replace(roleHref("/pages/observations"))} />)
    : null;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      {/* ── Header ── */}
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        // Opened on a dataset, from its report: the trail says so (dataset-error-map.tsx), so it is Home / Reports / the report / Map visualise rather than Home / Explore.
        section={datasetId && activeSection === "Explore" ? undefined : "Explore"}
        renderBreadcrumb={datasetId && activeSection === "Explore" ? (orgLabel) => <DatasetBreadcrumb datasetId={datasetId} orgLabel={orgLabel} /> : undefined}
      />

      {activeSection !== "Explore" ? (
        <div className="flex flex-1 overflow-hidden">
          {iconRail}
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
              {activeSectionNode.items?.map((item) => <NavTree key={item.label} node={item} />)}
            </div>
          </aside>
          <main className="flex flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">
            <SectionPlaceholder node={activeSectionNode} />
          </main>
        </div>
      ) : (
        datasetExplore ?? growExplore
      )}
    </div>
  );
}
