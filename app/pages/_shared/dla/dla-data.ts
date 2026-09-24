import type { BadgeColors } from "@/components/base/badges/badge-types";
import { projects as realProjects } from "@/app/pages/_shared/project-list-data";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";

// Data Licencing Agreement (DLA) model + seed data for /pages/dla. Shaped from the Master Flows
// wireframe (Figma YMproGZfrFB5jUqPHPxMhk, node 33:43259: No DLAs Yet / Request-Renew / View /
// Approve-Reject), re-fitted to the shell the same way DSA was - see CONTEXT.md, "Data Licencing
// Agreement (DLA)" for the full mapping and every deliberate departure from the wireframe.
//
// Status is stored, not derived from dates, same reasoning as DSA: the wireframe's own four list
// tabs (Active/Under Review/Rejected/Expired) don't say what moves a request between them beyond
// its own named actions, so only those actions are built - Submit -> Under Review, Approve ->
// Active, Reject -> Rejected, and Withdraw (by the requester or an admin) -> Withdrawn, a fifth
// bucket the wireframe's own "Withdraw" link implies but never draws a tab for.

export type DlaStatus = "active" | "under_review" | "rejected" | "expired" | "withdrawn";

export const dlaStatusOrder: DlaStatus[] = ["active", "under_review", "rejected", "expired", "withdrawn"];

export const dlaStatusMeta: Record<DlaStatus, { label: string; tabLabel: string; badgeColor: BadgeColors }> = {
  active: { label: "Active", tabLabel: "Active", badgeColor: "success" },
  under_review: { label: "Under Review", tabLabel: "Under Review", badgeColor: "warning" },
  rejected: { label: "Rejected", tabLabel: "Rejected", badgeColor: "error" },
  expired: { label: "Expired", tabLabel: "Expired", badgeColor: "gray" },
  withdrawn: { label: "Withdrawn", tabLabel: "Withdrawn", badgeColor: "gray" },
};

// Level 1 (public, no DLA needed) is the tier already documented sitewide (see CONTEXT.md's "BDBSA
// domain research" and Explore's own access banner) - it never appears here because a Level 1
// location doesn't need a DLA in the first place. A DLA only ever grants one of these two:
export type DlaAccessLevel = "level2" | "level3";

export const dlaLevelMeta: Record<DlaAccessLevel, { label: string; short: string; description: string }> = {
  level2: {
    label: "Level 2 - Standard Access",
    short: "Level 2 - Standard Access",
    description: "Ideal for academic research, environmental monitoring, and biodiversity assessments with standard data protection requirements.",
  },
  level3: {
    label: "Level 3 - Enhanced Access",
    short: "Level 3 - Enhanced Access",
    description: "Required for sensitive species data, threatened species distribution, and conservation planning with enhanced confidentiality measures.",
  },
};

// The 4 real projects this codebase already ships (project-list-content.tsx) - per direct
// decision, a Level 3 request's own "Projects for Level 3 Access" checklist references these real
// records instead of the wireframe's fictional list ("Threatened Species Monitoring", ...), so a
// DLA request actually points at something else in the system rather than a floating text label.
export const dlaLevel3Projects: { id: string; name: string }[] = realProjects.map((p) => ({ id: p.id, name: p.name }));

// How a location was captured - drives the badge shown next to it on the review/detail screens.
// "map" covers both of the wireframe's "Defined on Map" (a drawn circle) and "Defined Polygon" (a
// drawn polygon) labels, disambiguated by the resulting boundary's own `kind` - see
// `dlaLocationMethodLabel` below. "list" (choosing a real national park) has no example row in the
// wireframe's own review screen, so its label ("Selected from List") is this build's own honest
// addition, not copied from anywhere.
export type DlaLocationMethod = "shapefile" | "map" | "list" | "coordinates";

export interface DlaLocation {
  id: string;
  name: string;
  method: DlaLocationMethod;
  boundary: Boundary;
  level: DlaAccessLevel;
  /** Only meaningful when `level` is "level3" - which real projects this location's enhanced access is requested for. */
  projectIds: string[];
}

export function dlaLocationMethodLabel(location: DlaLocation): string {
  if (location.method === "shapefile") return "Uploaded Shapefile";
  if (location.method === "list") return "Selected from List";
  if (location.method === "coordinates") return "Defined Coordinates";
  return location.boundary.kind === "polygon" ? "Defined Polygon" : "Defined on Map";
}

export interface DlaRequestor {
  firstName: string;
  lastName: string;
  organisation: string;
  email: string;
  phone: string;
}

export interface Dla {
  /** The display ID (DLA-2026-00502) - also the unique key. */
  id: string;
  status: DlaStatus;
  locations: DlaLocation[];
  purpose: string;
  /** The requester's own asked-for window (step 2, "Agreement Period") - distinct from the grant
   *  period an admin actually sets on approval below. */
  requestPeriodFrom: string;
  requestPeriodTo: string;
  /** The admin-set grant period ("Approve Request" modal) - "" until the request is approved. */
  validFrom: string;
  validTo: string;
  requestor: DlaRequestor;
  /** The signed agreement an admin attaches on approval - distinct from a requester's own upload, which this workflow doesn't have (a request has no file of its own to submit, only what an admin issues back). */
  agreementFile: { name: string } | null;
  /** "Custom DLA" checkbox on the Approve Request modal. */
  isCustom: boolean;
  customNote: string;
  rejectionReason: string;
  submittedAt: string;
  updatedAt: string;
}

/** What the record form edits - a `Dla` minus what the workflow itself assigns. */
export type DlaDraft = Omit<Dla, "id" | "status" | "submittedAt" | "updatedAt">;

/** What the "Approve Request" modal collects - the fields it sets on approval. */
export interface DlaApproveInput {
  validFrom: string;
  validTo: string;
  agreementFile: { name: string } | null;
  isCustom: boolean;
  customNote: string;
}

// ── Formatting (hand-rolled, not Intl, so server and client render the same string) ──

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** "12 Jul 2025" */
export function formatShortDate(iso: string): string {
  if (!iso) return "";
  const { y, m, d } = parseIso(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "Friday 30 Jan 2026" - the list's date-group headings. */
export function formatLongDate(iso: string): string {
  if (!iso) return "";
  const { y, m, d, weekday } = parseIso(iso);
  return `${DAYS[weekday]} ${d} ${MONTHS[m - 1]} ${y}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function requestorName(r: DlaRequestor): string {
  return `${r.firstName} ${r.lastName}`.trim();
}

/** Next display ID: DLA-<this year>-<one past the highest sequence number in use>. */
export function nextDlaId(existing: Dla[]): string {
  const highest = existing.reduce((max, dla) => Math.max(max, Number(dla.id.split("-")[2]) || 0), 0);
  return `DLA-${new Date().getFullYear()}-${String(highest + 1).padStart(5, "0")}`;
}

let locationCounter = 0;
export function newLocationId(): string {
  locationCounter += 1;
  return `loc-${Date.now().toString(36)}-${locationCounter}`;
}

const emptyRequestor = (): DlaRequestor => ({ firstName: "", lastName: "", organisation: "", email: "", phone: "" });

export function emptyDlaDraft(): DlaDraft {
  return {
    locations: [],
    purpose: "",
    requestPeriodFrom: "",
    requestPeriodTo: "",
    validFrom: "",
    validTo: "",
    requestor: emptyRequestor(),
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
  };
}

// ── Validation ──

export type DlaFormTab = "locations" | "details" | "review";

export type DlaErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requestorErrors(r: DlaRequestor, errors: DlaErrors) {
  if (!r.firstName.trim()) errors["requestor.firstName"] = "Enter a first name";
  if (!r.lastName.trim()) errors["requestor.lastName"] = "Enter a last name";
  if (!r.organisation.trim()) errors["requestor.organisation"] = "Enter an organisation";
  if (!r.email.trim()) errors["requestor.email"] = "Enter an email address";
  else if (!EMAIL.test(r.email.trim())) errors["requestor.email"] = "Enter a valid email address";
}

/** Field errors keyed by path ("purpose", "requestor.email", "locations.<id>.name", ...). */
export function validateDla(draft: DlaDraft): DlaErrors {
  const errors: DlaErrors = {};

  if (draft.locations.length === 0) errors.locations = "Add at least one location";
  for (const location of draft.locations) {
    const key = `locations.${location.id}`;
    if (!location.name.trim()) errors[`${key}.name`] = "Name this location";
    if (location.level === "level3" && location.projectIds.length === 0) errors[`${key}.projectIds`] = "Select at least one project for Level 3 access";
  }

  if (!draft.purpose.trim()) errors.purpose = "Describe your intended use";
  if (!draft.requestPeriodFrom) errors.requestPeriodFrom = "Select a start date";
  if (!draft.requestPeriodTo) errors.requestPeriodTo = "Select an end date";
  else if (draft.requestPeriodFrom && draft.requestPeriodTo < draft.requestPeriodFrom) errors.requestPeriodTo = "End date must be on or after the start date";

  requestorErrors(draft.requestor, errors);

  return errors;
}

export function errorTab(path: string): DlaFormTab {
  if (path === "locations" || path.startsWith("locations.")) return "locations";
  return "details";
}

// ── Seed data ──
// Real South Australian national parks (app/pages/_shared/map-search/geo.ts) stand in for the
// wireframe's fictional "Cleland National Park - Zone N" rows, same "reuse real data" precedent
// this build already applies to Explore's own search results.

const boundary = (id: string, center: [number, number], radiusKm: number): Boundary => ({ id, kind: "circle", center, radiusKm });

export const seedDlas: Dla[] = [
  {
    id: "DLA-2025-01348",
    status: "active",
    locations: [
      {
        id: "loc-1",
        name: "Flinders Ranges National Park",
        method: "map",
        boundary: boundary("b-1", [-31.49, 138.6], 40),
        level: "level3",
        projectIds: ["adelaide-hills", "flinders"],
      },
      {
        id: "loc-2",
        name: "Belair National Park",
        method: "shapefile",
        boundary: boundary("b-2", [-35.02, 138.65], 8),
        level: "level2",
        projectIds: [],
      },
    ],
    purpose: "Monitoring biodiversity health, assessing threatened species distribution, and conducting collaborative regional ecology research.",
    requestPeriodFrom: "2026-01-26",
    requestPeriodTo: "2027-01-25",
    validFrom: "2026-01-26",
    validTo: "2027-01-25",
    requestor: { firstName: "John", lastName: "Doe", organisation: "SA Museum", email: "john.doe@sa.gov.au", phone: "" },
    agreementFile: { name: "DLA-2025-01348.pdf" },
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-01-20",
    updatedAt: "2026-01-26",
  },
  {
    id: "DLA-2026-00502",
    status: "under_review",
    locations: [
      {
        id: "loc-3",
        name: "Coorong National Park",
        method: "list",
        boundary: boundary("b-3", [-35.79, 139.29], 15),
        level: "level3",
        projectIds: ["coorong"],
      },
    ],
    purpose: "Seasonal waterbird survey work requiring access to threatened shorebird occurrence records.",
    requestPeriodFrom: "2026-10-01",
    requestPeriodTo: "2027-09-30",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Maya", lastName: "Dewitt", organisation: "Birds SA", email: "maya.dewitt@example.org", phone: "0400 555 210" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-09-18",
    updatedAt: "2026-09-18",
  },
  {
    id: "DLA-2026-00487",
    status: "rejected",
    locations: [
      {
        id: "loc-4",
        name: "Nullarbor National Park",
        method: "coordinates",
        boundary: boundary("b-4", [-31.43, 130.9], 25),
        level: "level3",
        projectIds: ["flinders"],
      },
    ],
    purpose: "Independent contractor request for sensitive species locations ahead of a proposed development.",
    requestPeriodFrom: "2026-08-01",
    requestPeriodTo: "2027-07-31",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Phoenix", lastName: "Baker", organisation: "Baker Environmental Consulting", email: "phoenix.baker@example.org", phone: "" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "Insufficient evidence of institutional affiliation for enhanced-access sensitive species data. Please reapply with a supporting letter from a recognised research body.",
    submittedAt: "2026-08-05",
    updatedAt: "2026-08-12",
  },
  {
    id: "DLA-2024-00219",
    status: "expired",
    locations: [
      {
        id: "loc-5",
        name: "Kangaroo Island (Flinders Chase National Park)",
        method: "map",
        boundary: boundary("b-5", [-35.95, 136.71], 30),
        level: "level2",
        projectIds: [],
      },
    ],
    purpose: "Post-bushfire recovery tracking, standard-access monitoring data only.",
    requestPeriodFrom: "2025-01-15",
    requestPeriodTo: "2026-01-14",
    validFrom: "2025-01-15",
    validTo: "2026-01-14",
    requestor: { firstName: "Lana", lastName: "Steiner", organisation: "Natural Resources KI", email: "lana.steiner@example.org", phone: "" },
    agreementFile: { name: "DLA-2024-00219.pdf" },
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2025-01-10",
    updatedAt: "2025-01-15",
  },
  {
    id: "DLA-2026-00340",
    status: "withdrawn",
    locations: [
      {
        id: "loc-6",
        name: "Mount Remarkable National Park",
        method: "map",
        boundary: boundary("b-6", [-32.8, 138.14], 20),
        level: "level2",
        projectIds: [],
      },
    ],
    purpose: "Scoping request for a habitat restoration proposal that didn't proceed.",
    requestPeriodFrom: "2026-05-01",
    requestPeriodTo: "2027-04-30",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Olivia", lastName: "Wyatt", organisation: "SA Museum", email: "olivia.wyatt@sa.gov.au", phone: "" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-05-02",
    updatedAt: "2026-05-14",
  },
];

/** Every id /pages/dla/[id] is pre-rendered for in the static GitHub Pages build: the seeds, plus
 *  the next `count` ids `nextDlaId` would hand out this year and next. New DLAs live in memory only
 *  (a reload resets to the seeds), so a session never gets far past the seed numbers - without
 *  these, opening a just-created DLA would 404 on a static host. */
export function staticDlaIds(count = 50): string[] {
  const highest = seedDlas.reduce((max, item) => Math.max(max, Number(item.id.split("-")[2]) || 0), 0);
  const year = new Date().getFullYear();
  const upcoming = [year, year + 1].flatMap((y) =>
    Array.from({ length: count }, (_, i) => `DLA-${y}-${String(highest + 1 + i).padStart(5, "0")}`),
  );
  return [...new Set([...seedDlas.map((item) => item.id), ...upcoming])];
}
