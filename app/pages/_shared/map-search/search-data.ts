import type { FC } from "react";
import { Folder, MarkerPin04, Send01, GridDotsBottom, LayoutGrid02, Scan, Shuffle01, CursorClick01, Circle } from "@untitledui/icons";
import type { BadgeColor } from "@/components/base/badges/badges";
import { projects as myProjects } from "@/app/pages/_shared/project-list-content";

// The map search tool's own record datasets - illustrative, but grounded in this build's existing
// real reference points and the real BDBSA data hierarchy (Project -> Site -> Observation ->
// Occurrence, see CONTEXT.md's "BDBSA domain research"). Species names are real South Australian
// native fauna already established elsewhere in this build's copy, or otherwise genuine SA
// species - never invented taxa. Coordinates are approximate, illustrative points near each
// region's real national park, not surveyed record locations.
//
// Per direct feedback, "Projects" is no longer its own result type - a Project *is* an Event (the
// root of the Project -> Site -> Visit/Transect/Quadrat/Block/Ramble/Trap/Custom Event tree), so
// every project already listed on the Projects page is folded into `searchEvents` below as a
// root-level Event (`type: "Project"`, no `parentId`), extended with real child events under
// several of them - the same "reuse the real Projects data, extend rather than fork" approach the
// previous round already established.

export type EventType = "Project" | "Site" | "Visit" | "Transect" | "Quadrat" | "Block" | "Ramble" | "Trap" | "Custom event";

export interface SearchEvent {
    id: string;
    /** The short alphanumeric code shown in the Event ID column and in every Hierarchy chain -
     *  matches Figma's own per-type prefix convention exactly (node 205:20764 -> get_design_context
     *  on the Event ID column: "BD - 5034" for a Project, "SU00501" Site, "VU00501" Visit,
     *  "TR00501" Transect, "QR00501" Quadrat, "BK00501" Block, "RMB00501" Ramble, "TRP00501" Trap,
     *  "CU00501" Custom event). `id` stays the internal slug used for parent-linking/React keys/
     *  routing - `code` is the display-only value a real BDBSA record ID would look like. */
    code: string;
    name: string;
    type: EventType;
    status: string;
    statusColor: BadgeColor<"pill-color">;
    startDate: string;
    endDate: string;
    org: string;
    region: string;
    /** The immediate parent event's id - undefined only for a root Project. */
    parentId?: string;
    lat: number;
    lon: number;
    /** Only ever set on a root Project (`type: "Project"`) - the same Contributor/Updated/
     *  description fields `Project` (project-list-content.tsx) already carries, so the Projects
     *  tab's table can match that page's own columns exactly instead of a different shape. Left
     *  undefined for every non-Project event type, which has no equivalent real data to show. */
    contributorInitials?: string;
    contributorName?: string;
    updated?: string;
    description?: string;
}

const MY_PROJECT_COORDS: Record<string, { region: string; lat: number; lon: number; code: string }> = {
    "adelaide-hills": { region: "Adelaide Hills", lat: -35.02, lon: 138.71, code: "BD - 5031" },
    coorong: { region: "Coorong", lat: -35.79, lon: 139.29, code: "BD - 5032" },
    flinders: { region: "Flinders Ranges", lat: -31.49, lon: 138.6, code: "BD - 5033" },
    "kangaroo-island": { region: "Kangaroo Island", lat: -35.95, lon: 136.71, code: "BD - 5034" },
};

const myProjectEvents: SearchEvent[] = myProjects
    .filter((p) => MY_PROJECT_COORDS[p.id])
    .map((p) => ({
        id: p.id,
        name: p.name,
        type: "Project",
        status: p.status,
        statusColor: p.statusColor,
        startDate: "2025-11-02",
        endDate: "—",
        org: p.org,
        // Reuses the same real Contributor/Updated/description fields `myProjects` already carries
        // (project-list-content.tsx) rather than re-typing them - this is the same underlying
        // project, just surfaced in a second table.
        contributorInitials: p.contributorInitials,
        contributorName: p.contributorName,
        updated: p.updated,
        description: p.description,
        ...MY_PROJECT_COORDS[p.id],
    }));

// Real public projects on the platform the current user isn't personally contributing to or
// watching - a project list and a spatial search over *all* public records are two different,
// both-real things, not a contradiction (see the previous round's note on this same distinction).
// Contributor/updated/description use the same established placeholder persona set as this file's
// own Observations (Olivia Wyatt/Maya Dewitt/Phoenix Baker/Lana Steiner) - never a new invented
// name - and a one-line description matching each project's own name/status, the same convention
// `project-list-content.tsx`'s real `projects` array already follows.
const otherProjectEvents: SearchEvent[] = [
    { id: "naracoorte-fossil", code: "BD - 5035", name: "Naracoorte Caves Fossil Fauna Survey", type: "Project", status: "Active", statusColor: "success", startDate: "2025-09-14", endDate: "—", org: "South Australian Museum", region: "Naracoorte", lat: -36.97, lon: 140.8, contributorInitials: "LS", contributorName: "Lana Steiner", updated: "4 days ago", description: "Fossil deposit survey mapping historical fauna records across the cave system." },
    { id: "lake-eyre-waterbirds", code: "BD - 5036", name: "Lake Eyre Basin Waterbird Survey", type: "Project", status: "Active", statusColor: "success", startDate: "2025-10-01", endDate: "—", org: "BirdLife Australia", region: "Lake Eyre", lat: -28.9, lon: 137.3, contributorInitials: "PB", contributorName: "Phoenix Baker", updated: "1 week ago", description: "Seasonal waterbird counts across the Lake Eyre Basin's ephemeral wetlands." },
    { id: "nullarbor-arid-zone", code: "BD - 5037", name: "Nullarbor Arid Zone Monitoring", type: "Project", status: "Under review", statusColor: "warning", startDate: "2025-12-05", endDate: "—", org: "DEW Biodiversity Team", region: "Nullarbor", lat: -31.43, lon: 130.9, contributorInitials: "OW", contributorName: "Olivia Wyatt", updated: "6 days ago", description: "Arid zone flora and fauna monitoring data pending verification." },
    { id: "remarkable-malleefowl", code: "BD - 5038", name: "Mount Remarkable Malleefowl Program", type: "Project", status: "Active", statusColor: "success", startDate: "2025-08-19", endDate: "—", org: "Southern Flinders Landcare", region: "Mount Remarkable", lat: -32.8, lon: 138.14, contributorInitials: "MD", contributorName: "Maya Dewitt", updated: "2 weeks ago", description: "Malleefowl mound monitoring and nest-site recovery tracking." },
];

// Child events - Sites, and a further level of Visits/Transects/Quadrats/Blocks/Rambles/Traps/
// Custom Events under some of those Sites - added per direct feedback ("add more projects, more
// sites etc."), and specifically so the Hierarchy column has real, non-"-" chains to show, not
// just root Projects.
const childEvents: SearchEvent[] = [
    { id: "site-adelaide-1", code: "SU00501", name: "Cleland Bushland Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-02-10", endDate: "—", org: "Adelaide Hills Landcare", region: "Adelaide Hills", parentId: "adelaide-hills", lat: -35.03, lon: 138.72 },
    { id: "site-adelaide-2", code: "SU00502", name: "Mylor Creek Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-03-02", endDate: "—", org: "Adelaide Hills Landcare", region: "Adelaide Hills", parentId: "adelaide-hills", lat: -35.0, lon: 138.68 },
    { id: "visit-adelaide-1", code: "VU00501", name: "Visit VU00501", type: "Visit", status: "Completed", statusColor: "gray", startDate: "2026-07-30", endDate: "2026-07-30", org: "Adelaide Hills Landcare", region: "Adelaide Hills", parentId: "site-adelaide-1", lat: -35.03, lon: 138.72 },

    { id: "site-coorong-1", code: "SU00503", name: "Coorong Lagoon Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-01-20", endDate: "—", org: "Birds SA", region: "Coorong", parentId: "coorong", lat: -35.8, lon: 139.3 },
    { id: "visit-coorong-1", code: "VU00502", name: "Visit VU00502", type: "Visit", status: "Completed", statusColor: "gray", startDate: "2026-08-02", endDate: "2026-08-02", org: "Birds SA", region: "Coorong", parentId: "site-coorong-1", lat: -35.81, lon: 139.28 },

    { id: "site-flinders-1", code: "SU00504", name: "Wilpena Pound Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-01-05", endDate: "—", org: "DEW Biodiversity Team", region: "Flinders Ranges", parentId: "flinders", lat: -31.51, lon: 138.59 },
    { id: "transect-flinders-1", code: "TR00501", name: "Transect TR00501", type: "Transect", status: "Completed", statusColor: "gray", startDate: "2026-06-21", endDate: "2026-06-21", org: "DEW Biodiversity Team", region: "Flinders Ranges", parentId: "site-flinders-1", lat: -31.5, lon: 138.58 },
    { id: "quadrat-flinders-1", code: "QR00501", name: "Quadrat QR00501", type: "Quadrat", status: "Completed", statusColor: "gray", startDate: "2026-06-22", endDate: "2026-06-22", org: "DEW Biodiversity Team", region: "Flinders Ranges", parentId: "transect-flinders-1", lat: -31.46, lon: 138.62 },
    // A second Ramble sibling under the same Site, in Flinders Ranges specifically (one of the 8
    // real national parks this page's own "Select a location" list offers) - the two pre-existing
    // Ramble events (ramble-lake-eyre-1/ramble-nullarbor-1) both sit far outside any of those 8
    // parks' reach, so a real, typical search never surfaced a single Ramble row. Flagged directly
    // by the user off a screenshot showing "Ramble 0" in the sub-type chip row.
    { id: "ramble-flinders-1", code: "RMB00503", name: "Ramble RMB00503", type: "Ramble", status: "Completed", statusColor: "gray", startDate: "2026-06-25", endDate: "2026-06-25", org: "DEW Biodiversity Team", region: "Flinders Ranges", parentId: "site-flinders-1", lat: -31.49, lon: 138.61 },

    { id: "site-ki-1", code: "SU00505", name: "Flinders Chase Recovery Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-02-01", endDate: "—", org: "Natural Resources KI", region: "Kangaroo Island", parentId: "kangaroo-island", lat: -35.94, lon: 136.72 },
    { id: "block-ki-1", code: "BK00501", name: "Block BK00501", type: "Block", status: "Completed", statusColor: "gray", startDate: "2026-05-14", endDate: "2026-05-14", org: "Natural Resources KI", region: "Kangaroo Island", parentId: "site-ki-1", lat: -35.93, lon: 136.7 },
    { id: "trap-ki-1", code: "TRP00502", name: "Trap TRP00502", type: "Trap", status: "Completed", statusColor: "gray", startDate: "2026-05-20", endDate: "2026-05-20", org: "Natural Resources KI", region: "Kangaroo Island", parentId: "site-ki-1", lat: -35.95, lon: 136.69 },

    { id: "site-naracoorte-1", code: "SU00506", name: "Fossil Chamber Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-03-15", endDate: "—", org: "South Australian Museum", region: "Naracoorte", parentId: "naracoorte-fossil", lat: -36.97, lon: 140.79 },
    { id: "block-naracoorte-1", code: "BK00502", name: "Block BK00502", type: "Block", status: "Completed", statusColor: "gray", startDate: "2026-03-20", endDate: "2026-03-20", org: "South Australian Museum", region: "Naracoorte", parentId: "site-naracoorte-1", lat: -36.98, lon: 140.78 },

    { id: "site-lake-eyre-1", code: "SU00507", name: "Lake Eyre Shoreline Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-01-10", endDate: "—", org: "BirdLife Australia", region: "Lake Eyre", parentId: "lake-eyre-waterbirds", lat: -28.89, lon: 137.31 },
    { id: "ramble-lake-eyre-1", code: "RMB00501", name: "Ramble RMB00501", type: "Ramble", status: "Completed", statusColor: "gray", startDate: "2026-07-05", endDate: "2026-07-05", org: "BirdLife Australia", region: "Lake Eyre", parentId: "site-lake-eyre-1", lat: -28.88, lon: 137.32 },
    { id: "custom-lake-eyre-1", code: "CU00502", name: "Custom CU00502", type: "Custom event", status: "Completed", statusColor: "gray", startDate: "2026-07-12", endDate: "2026-07-12", org: "BirdLife Australia", region: "Lake Eyre", parentId: "site-lake-eyre-1", lat: -28.9, lon: 137.29 },

    { id: "site-nullarbor-1", code: "SU00508", name: "Nullarbor Plain Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-02-20", endDate: "—", org: "DEW Biodiversity Team", region: "Nullarbor", parentId: "nullarbor-arid-zone", lat: -31.42, lon: 130.91 },
    { id: "trap-nullarbor-1", code: "TRP00501", name: "Trap TRP00501", type: "Trap", status: "Completed", statusColor: "gray", startDate: "2026-04-28", endDate: "2026-04-28", org: "DEW Biodiversity Team", region: "Nullarbor", parentId: "site-nullarbor-1", lat: -31.41, lon: 130.92 },
    { id: "ramble-nullarbor-1", code: "RMB00502", name: "Ramble RMB00502", type: "Ramble", status: "Completed", statusColor: "gray", startDate: "2026-05-02", endDate: "2026-05-02", org: "DEW Biodiversity Team", region: "Nullarbor", parentId: "site-nullarbor-1", lat: -31.43, lon: 130.9 },

    { id: "site-remarkable-1", code: "SU00509", name: "Mambray Creek Site", type: "Site", status: "Active", statusColor: "success", startDate: "2026-03-01", endDate: "—", org: "Southern Flinders Landcare", region: "Mount Remarkable", parentId: "remarkable-malleefowl", lat: -32.79, lon: 138.13 },
    { id: "custom-remarkable-1", code: "CU00501", name: "Custom CU00501", type: "Custom event", status: "Completed", statusColor: "gray", startDate: "2026-08-09", endDate: "2026-08-09", org: "Southern Flinders Landcare", region: "Mount Remarkable", parentId: "site-remarkable-1", lat: -32.79, lon: 138.16 },

    // A second, deeper Transect -> Quadrat chain under Adelaide Hills (site-adelaide-2), alongside
    // the existing Flinders one - gives the Hierarchy column more than one real 3-ancestor-deep
    // chain to show (Project -> Site -> Transect), not just a single example, per direct feedback
    // asking for the table to show "multiple" of every event type with real nested hierarchy.
    { id: "transect-adelaide-1", code: "TR00502", name: "Transect TR00502", type: "Transect", status: "Completed", statusColor: "gray", startDate: "2026-06-10", endDate: "2026-06-10", org: "Adelaide Hills Landcare", region: "Adelaide Hills", parentId: "site-adelaide-2", lat: -35.01, lon: 138.67 },
    { id: "quadrat-adelaide-1", code: "QR00502", name: "Quadrat QR00502", type: "Quadrat", status: "Completed", statusColor: "gray", startDate: "2026-06-11", endDate: "2026-06-11", org: "Adelaide Hills Landcare", region: "Adelaide Hills", parentId: "transect-adelaide-1", lat: -35.01, lon: 138.66 },
];

export const searchEvents: SearchEvent[] = [...myProjectEvents, ...otherProjectEvents, ...childEvents];

const eventById = new Map(searchEvents.map((e) => [e.id, e]));

// Per-type leading icon - shared by both the Type column's cells and the sub-filter chip row
// above it (app/pages/observations/option-1/page.tsx) and, via `eventChain`/`hierarchyFor` below,
// the Hierarchy cell's own per-segment detail panel - one source, never duplicated per consumer.
// Matches Figma's own icon-per-sub-type treatment exactly - confirmed via get_design_context on
// the chip row itself (I205:21340;195:10229;1396:59991;195:9701), not inferred from a screenshot:
// Site/Transect/Quadrat/Block/Trap were originally guessed from a low-res render as MarkerPin01/
// Grid03/LayoutGrid01/Crop01/NavigationPointer01 - the real components Figma actually uses are
// MarkerPin04/GridDotsBottom/LayoutGrid02/Scan/CursorClick01, fixed once the chip row's own node
// was fetched directly.
export const eventTypeIcon: Record<EventType, FC<{ className?: string }>> = {
    Project: Folder,
    Site: MarkerPin04,
    Visit: Send01,
    Transect: GridDotsBottom,
    Quadrat: LayoutGrid02,
    Block: Scan,
    Ramble: Shuffle01,
    Trap: CursorClick01,
    "Custom event": Circle,
};

/** The chain of ancestor Events, root Project first, down to (not including) `event` itself -
 *  empty for a root Project. Returns full `SearchEvent` objects (not just their `code`s) so a
 *  Hierarchy segment can open that specific ancestor's own detail panel, not just display its
 *  code as inert text - see `HierarchyCell` in results-table.tsx. */
export function eventAncestors(event: SearchEvent): SearchEvent[] {
    const chain: SearchEvent[] = [];
    let parentId = event.parentId;
    while (parentId) {
        const parent = eventById.get(parentId);
        if (!parent) break;
        chain.unshift(parent);
        parentId = parent.parentId;
    }
    return chain;
}

/** The full Hierarchy chain for an Event's own Hierarchy cell - every ancestor *plus the event
 *  itself* as the final, always-visible segment (per direct feedback: "the last level of hierarchy
 *  is the same as the Event ID" - a record's own row is always the bottom of its own chain, not
 *  just its ancestors). Empty only for a root Project (nothing above it, and showing just itself
 *  again would be redundant with the Event ID column already visible in the same row). */
export function eventChain(event: SearchEvent): SearchEvent[] {
    const ancestors = eventAncestors(event);
    return ancestors.length === 0 ? [] : [...ancestors, event];
}

/** The Hierarchy cell for a record attached to `parentEventId` (an Occurrence/Observation/
 *  Resource, never an Event - Events use `eventChain` above instead) - "-" (empty array) when that
 *  event is a root Project itself, otherwise the full chain from the Project down to and including
 *  the specific Event it was recorded under (that Event is the chain's own last segment - the same
 *  "last level = the thing that's actually below this row" rule `eventChain` applies to Events). */
export function hierarchyFor(parentEventId: string): SearchEvent[] {
    const parent = eventById.get(parentEventId);
    if (!parent || !parent.parentId) return [];
    return [...eventAncestors(parent), parent];
}

/** The root Project this event ultimately belongs to - `event` itself when it already is a root
 *  Project (no ancestors), otherwise the first (root) entry of its own ancestor chain. Every event
 *  in this dataset terminates at a root Project by construction (see `SearchEvent.parentId`'s own
 *  doc comment), so this never returns undefined. Backs the map search's core invariant: every
 *  Event/Occurrence/Observation/Resource shown in a results tab must belong to a Project that's
 *  also shown in the Projects tab - see app/pages/observations/option-1/page.tsx. */
export function rootProjectOfEvent(event: SearchEvent): SearchEvent {
    const ancestors = eventAncestors(event);
    return ancestors.length > 0 ? ancestors[0] : event;
}

/** Same as `rootProjectOfEvent`, but starting from an Occurrence/Observation/Resource's own
 *  `parentEventId` rather than a `SearchEvent` directly - undefined only if that id doesn't
 *  resolve to a real event (shouldn't happen given this file's own data). */
export function rootProjectForParentEventId(parentEventId: string): SearchEvent | undefined {
    const event = eventById.get(parentEventId);
    return event ? rootProjectOfEvent(event) : undefined;
}

export type OccurrenceType = "Individual" | "Population" | "Non-Biotic" | "Community";

export interface SearchOccurrence {
    id: string;
    species: string;
    commonName: string;
    type: OccurrenceType;
    parentEventId: string;
    date: string;
    status: "Present" | "Absent";
    region: string;
    lat: number;
    lon: number;
}

export const searchOccurrences: SearchOccurrence[] = [
    { id: "OCRI094", species: "Macropus giganteus", commonName: "Western Grey Kangaroo", type: "Individual", parentEventId: "adelaide-hills", date: "2026-08-12", status: "Present", region: "Adelaide Hills", lat: -35.02, lon: 138.7 },
    { id: "OCRP094", species: "Tachyglossus aculeatus", commonName: "Short-beaked Echidna", type: "Individual", parentEventId: "visit-adelaide-1", date: "2026-07-30", status: "Present", region: "Adelaide Hills", lat: -35.0, lon: 138.68 },
    { id: "occ-3", species: "Sternula nereis", commonName: "Fairy Tern", type: "Population", parentEventId: "coorong", date: "2026-08-02", status: "Present", region: "Coorong", lat: -35.81, lon: 139.28 },
    { id: "occ-4", species: "Pandion haliaetus", commonName: "Osprey", type: "Individual", parentEventId: "visit-coorong-1", date: "2026-08-03", status: "Absent", region: "Coorong", lat: -35.77, lon: 139.32 },
    { id: "occ-5", species: "Tiliqua adelaidensis", commonName: "Pygmy Bluetongue Lizard", type: "Individual", parentEventId: "quadrat-flinders-1", date: "2026-06-21", status: "Present", region: "Flinders Ranges", lat: -31.51, lon: 138.59 },
    { id: "occ-6", species: "Petrogale xanthopus", commonName: "Yellow-footed Rock-wallaby", type: "Population", parentEventId: "flinders", date: "2026-06-22", status: "Present", region: "Flinders Ranges", lat: -31.46, lon: 138.62 },
    { id: "occ-7", species: "Lasiorhinus latifrons", commonName: "Southern Hairy-nosed Wombat", type: "Individual", parentEventId: "block-ki-1", date: "2026-05-14", status: "Present", region: "Kangaroo Island", lat: -35.93, lon: 136.7 },
    { id: "occ-8", species: "Dromaius novaehollandiae", commonName: "Emu", type: "Individual", parentEventId: "kangaroo-island", date: "2026-05-15", status: "Present", region: "Kangaroo Island", lat: -35.96, lon: 136.74 },
    { id: "occ-9", species: "Leipoa ocellata", commonName: "Malleefowl", type: "Individual", parentEventId: "custom-remarkable-1", date: "2026-08-09", status: "Present", region: "Mount Remarkable", lat: -32.81, lon: 138.15 },
    { id: "occ-10", species: "Macropus rufus", commonName: "Red Kangaroo", type: "Population", parentEventId: "trap-nullarbor-1", date: "2026-04-28", status: "Present", region: "Nullarbor", lat: -31.42, lon: 130.88 },
    { id: "occ-11", species: "Polytelis anthopeplus", commonName: "Regent Parrot", type: "Individual", parentEventId: "ramble-lake-eyre-1", date: "2026-07-05", status: "Present", region: "Lake Eyre", lat: -28.91, lon: 137.28 },
    { id: "occ-12", species: "Litoria raniformis", commonName: "Southern Bell Frog", type: "Individual", parentEventId: "site-naracoorte-1", date: "2026-08-19", status: "Present", region: "Naracoorte", lat: -36.98, lon: 140.82 },
    { id: "occ-13", species: "—", commonName: "Soil Profile", type: "Non-Biotic", parentEventId: "site-flinders-1", date: "2026-06-21", status: "Present", region: "Flinders Ranges", lat: -31.5, lon: 138.6 },
    { id: "occ-14", species: "—", commonName: "Fleurieu Peninsula Swamp Community", type: "Community", parentEventId: "site-adelaide-2", date: "2026-03-02", status: "Present", region: "Adelaide Hills", lat: -35.0, lon: 138.68 },
    { id: "occ-15", species: "Neophema chrysogaster", commonName: "Orange-bellied Parrot", type: "Individual", parentEventId: "site-coorong-1", date: "2026-08-04", status: "Absent", region: "Coorong", lat: -35.79, lon: 139.3 },
    { id: "occ-16", species: "Pseudomys shortridgei", commonName: "Heath Mouse", type: "Population", parentEventId: "site-remarkable-1", date: "2026-08-08", status: "Present", region: "Mount Remarkable", lat: -32.8, lon: 138.14 },
];

export interface SearchObservation {
    id: string;
    commonName: string;
    /** Scientific (binomial) name - "-" for the two non-species records (Soil Profile, a
     *  Community type), same convention as SearchOccurrence's own species field. */
    species: string;
    type: OccurrenceType;
    observerInitials: string;
    observerName: string;
    parentEventId: string;
    date: string;
    region: string;
    lat: number;
    lon: number;
}

export const searchObservations: SearchObservation[] = [
    { id: "OCRI094", commonName: "Western Grey Kangaroo", species: "Macropus giganteus", type: "Individual", observerInitials: "OW", observerName: "Olivia Wyatt", parentEventId: "adelaide-hills", date: "2026-08-12", region: "Adelaide Hills", lat: -35.03, lon: 138.71 },
    { id: "OCRP094", commonName: "Short-beaked Echidna", species: "Tachyglossus aculeatus", type: "Individual", observerInitials: "OW", observerName: "Olivia Wyatt", parentEventId: "visit-adelaide-1", date: "2026-07-31", region: "Adelaide Hills", lat: -35.01, lon: 138.69 },
    { id: "OBS00125", commonName: "Fairy Tern", species: "Sternula nereis", type: "Population", observerInitials: "MD", observerName: "Maya Dewitt", parentEventId: "coorong", date: "2026-08-02", region: "Coorong", lat: -35.8, lon: 139.3 },
    { id: "OBS00126", commonName: "Osprey", species: "Pandion haliaetus", type: "Individual", observerInitials: "MD", observerName: "Maya Dewitt", parentEventId: "visit-coorong-1", date: "2026-08-03", region: "Coorong", lat: -35.78, lon: 139.27 },
    { id: "obs-5", commonName: "Pygmy Bluetongue Lizard", species: "Tiliqua adelaidensis", type: "Individual", observerInitials: "PB", observerName: "Phoenix Baker", parentEventId: "quadrat-flinders-1", date: "2026-06-21", region: "Flinders Ranges", lat: -31.5, lon: 138.58 },
    { id: "obs-6", commonName: "Yellow-footed Rock-wallaby", species: "Petrogale xanthopus", type: "Population", observerInitials: "PB", observerName: "Phoenix Baker", parentEventId: "flinders", date: "2026-06-23", region: "Flinders Ranges", lat: -31.48, lon: 138.64 },
    { id: "obs-7", commonName: "Southern Hairy-nosed Wombat", species: "Lasiorhinus latifrons", type: "Individual", observerInitials: "LS", observerName: "Lana Steiner", parentEventId: "block-ki-1", date: "2026-05-14", region: "Kangaroo Island", lat: -35.94, lon: 136.72 },
    { id: "obs-8", commonName: "Malleefowl", species: "Leipoa ocellata", type: "Individual", observerInitials: "OW", observerName: "Olivia Wyatt", parentEventId: "custom-remarkable-1", date: "2026-08-09", region: "Mount Remarkable", lat: -32.79, lon: 138.13 },
    { id: "obs-9", commonName: "Red Kangaroo", species: "Macropus rufus", type: "Population", observerInitials: "MD", observerName: "Maya Dewitt", parentEventId: "trap-nullarbor-1", date: "2026-04-29", region: "Nullarbor", lat: -31.44, lon: 130.91 },
    { id: "obs-10", commonName: "Regent Parrot", species: "Polytelis anthopeplus", type: "Individual", observerInitials: "PB", observerName: "Phoenix Baker", parentEventId: "ramble-lake-eyre-1", date: "2026-07-06", region: "Lake Eyre", lat: -28.89, lon: 137.31 },
    { id: "obs-11", commonName: "Soil Profile", species: "-", type: "Non-Biotic", observerInitials: "OW", observerName: "Olivia Wyatt", parentEventId: "site-flinders-1", date: "2026-06-21", region: "Flinders Ranges", lat: -31.5, lon: 138.6 },
    { id: "obs-12", commonName: "Fleurieu Peninsula Swamp Community", species: "-", type: "Community", observerInitials: "LS", observerName: "Lana Steiner", parentEventId: "site-adelaide-2", date: "2026-03-02", region: "Adelaide Hills", lat: -35.0, lon: 138.68 },
    { id: "obs-13", commonName: "Orange-bellied Parrot", species: "Neophema chrysogaster", type: "Individual", observerInitials: "MD", observerName: "Maya Dewitt", parentEventId: "site-coorong-1", date: "2026-08-04", region: "Coorong", lat: -35.79, lon: 139.3 },
    { id: "obs-14", commonName: "Heath Mouse", species: "Pseudomys shortridgei", type: "Population", observerInitials: "PB", observerName: "Phoenix Baker", parentEventId: "site-remarkable-1", date: "2026-08-08", region: "Mount Remarkable", lat: -32.8, lon: 138.14 },
    { id: "obs-15", commonName: "Southern Bell Frog", species: "Litoria raniformis", type: "Individual", observerInitials: "OW", observerName: "Olivia Wyatt", parentEventId: "site-naracoorte-1", date: "2026-08-19", region: "Naracoorte", lat: -36.98, lon: 140.82 },
    { id: "obs-16", commonName: "Emu", species: "Dromaius novaehollandiae", type: "Individual", observerInitials: "LS", observerName: "Lana Steiner", parentEventId: "site-ki-1", date: "2026-05-16", region: "Kangaroo Island", lat: -35.95, lon: 136.72 },
];

export type ResourceType = "Image" | "File" | "Reference Link";

export interface SearchResource {
    id: string;
    name: string;
    type: ResourceType;
    attachedToConcept: string;
    recordId: string;
    recordName: string;
    parentEventId: string;
    date: string;
    region: string;
    lat: number;
    lon: number;
}

// Each resource is attached to a real Occurrence/Observation record above (`recordId`/
// `recordName`), and inherits that record's own location - a resource is physically tied to
// wherever the record it documents was captured, not an independent point.
export const searchResources: SearchResource[] = [
    { id: "res-1", name: "Canopy.jpeg", type: "Image", attachedToConcept: "Canopy Type", recordId: "OCRI094", recordName: "Western Grey Kangaroo", parentEventId: "adelaide-hills", date: "2026-08-12", region: "Adelaide Hills", lat: -35.02, lon: 138.7 },
    { id: "res-2", name: "Field-notes.pdf", type: "File", attachedToConcept: "Site Description", recordId: "OCRP094", recordName: "Short-beaked Echidna", parentEventId: "visit-adelaide-1", date: "2026-07-30", region: "Adelaide Hills", lat: -35.0, lon: 138.68 },
    { id: "res-3", name: "https://gbif.org/occurrence/1291505203", type: "Reference Link", attachedToConcept: "Species ID", recordId: "occ-3", recordName: "Fairy Tern", parentEventId: "coorong", date: "2026-08-02", region: "Coorong", lat: -35.81, lon: 139.28 },
    { id: "res-4", name: "Osprey-nest.jpeg", type: "Image", attachedToConcept: "Nest Site", recordId: "occ-4", recordName: "Osprey", parentEventId: "visit-coorong-1", date: "2026-08-03", region: "Coorong", lat: -35.77, lon: 139.32 },
    { id: "res-5", name: "Transect-log.xls", type: "File", attachedToConcept: "Transect Record", recordId: "occ-5", recordName: "Pygmy Bluetongue Lizard", parentEventId: "quadrat-flinders-1", date: "2026-06-21", region: "Flinders Ranges", lat: -31.51, lon: 138.59 },
    { id: "res-6", name: "Rock-wallaby-colony.jpeg", type: "Image", attachedToConcept: "Habitat", recordId: "occ-6", recordName: "Yellow-footed Rock-wallaby", parentEventId: "flinders", date: "2026-06-22", region: "Flinders Ranges", lat: -31.46, lon: 138.62 },
    { id: "res-7", name: "Wombat-burrow.jpeg", type: "Image", attachedToConcept: "Burrow Site", recordId: "occ-7", recordName: "Southern Hairy-nosed Wombat", parentEventId: "block-ki-1", date: "2026-05-14", region: "Kangaroo Island", lat: -35.93, lon: 136.7 },
    { id: "res-8", name: "https://ala.org.au/species/Dromaius-novaehollandiae", type: "Reference Link", attachedToConcept: "Species ID", recordId: "occ-8", recordName: "Emu", parentEventId: "kangaroo-island", date: "2026-05-15", region: "Kangaroo Island", lat: -35.96, lon: 136.74 },
    { id: "res-9", name: "Malleefowl-mound.jpeg", type: "Image", attachedToConcept: "Nest Mound", recordId: "occ-9", recordName: "Malleefowl", parentEventId: "custom-remarkable-1", date: "2026-08-09", region: "Mount Remarkable", lat: -32.81, lon: 138.15 },
    { id: "res-10", name: "Trap-catch-log.xls", type: "File", attachedToConcept: "Trap Record", recordId: "occ-10", recordName: "Red Kangaroo", parentEventId: "trap-nullarbor-1", date: "2026-04-28", region: "Nullarbor", lat: -31.42, lon: 130.88 },
    { id: "res-11", name: "Regent-parrot-flock.jpeg", type: "Image", attachedToConcept: "Flock Count", recordId: "occ-11", recordName: "Regent Parrot", parentEventId: "ramble-lake-eyre-1", date: "2026-07-05", region: "Lake Eyre", lat: -28.91, lon: 137.28 },
    { id: "res-12", name: "https://gbif.org/species/2481660", type: "Reference Link", attachedToConcept: "Species ID", recordId: "occ-12", recordName: "Southern Bell Frog", parentEventId: "site-naracoorte-1", date: "2026-08-19", region: "Naracoorte", lat: -36.98, lon: 140.82 },
];
