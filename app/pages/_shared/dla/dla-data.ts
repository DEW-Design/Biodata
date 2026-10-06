import { projects as realProjects } from "@/app/pages/_shared/project-list-data";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";

// Data Licencing Agreement (DLA) model + seed data for /pages/dla. Shaped from the Master Flows
// wireframe (Figma YMproGZfrFB5jUqPHPxMhk, node 33:43259: No DLAs Yet / Request-Renew / View /
// Approve-Reject), re-fitted to the shell the same way DSA was - see context/decisions/2026-09-23-03-data-licencing-agreement-dla-workflow-built-at-pages.md, "Data Licencing
// Agreement (DLA)" for the full mapping and every deliberate departure from the wireframe.
//
// Status now follows the shared DSA/DLA workflow model (see agreement-status.ts) - Draft, Submitted,
// Under Review, On Hold, Approved, Rejected, Active, Closed, Cancelled - replacing the wireframe's
// own narrower Active/Under Review/Rejected/Expired/Withdrawn set (see context/decisions/2026-09-24-04-unified-dsa-dla-status-model-rolled-straight-into.md, "Unified
// DSA/DLA status model" for the source and every decision behind it). Two real, new capabilities
// this brought to DLA specifically: a request can now be saved as a Draft before submitting (the
// wireframe's own form had no draft step at all), and Submitted/Under Review are now distinct
// stages, not one and the same.
export type { AgreementStatus as DlaStatus, AgreementEvent as DlaEvent } from "@/app/pages/_shared/agreement-status";
export { agreementStatusOrder as dlaStatusOrder, agreementStatusMeta as dlaStatusMeta } from "@/app/pages/_shared/agreement-status";
import type { AgreementStatus as DlaStatus, AgreementEvent as DlaEvent } from "@/app/pages/_shared/agreement-status";
import { localIsoDate } from "@/app/pages/_shared/agreement-status";
import { REVIEWING_ADMIN_NAME } from "@/app/pages/_shared/agreement-scope";

// Level 1 (public, no DLA needed) is the tier already documented sitewide (see .claude/rules/ref-domain.md, "BDBSA
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
  /** The signed agreement an admin attaches on approval - distinct from a requester's own upload, which this workflow doesn't have (a request has no file of its own to submit, only what an admin issues back). Real bytes (a base64 data URL), not just a filename - see CONTEXT.md, "Phase 1: admin uploads, requester downloads" - so "Download PDF" on the deep dive is a genuine download, not a toast. */
  agreementFile: DlaAgreementFile | null;
  /** "Custom DLA" checkbox on the Approve Request modal. */
  isCustom: boolean;
  customNote: string;
  rejectionReason: string;
  submittedAt: string;
  updatedAt: string;
  /** The Audit Log tab's own dated trail of every status this request has moved through. */
  history: DlaEvent[];
}

/** The Approve Request modal's own real upload - a name, its byte size (enforced against
 *  `MAX_AGREEMENT_FILE_BYTES` at the point of picking it), and the file's own content as a real,
 *  downloadable `data:` URL (`FileReader.readAsDataURL`, read in `dla-detail.tsx` - a DOM API, kept
 *  out of this otherwise-server-safe data module). A base64 data URL is a plain string, so it
 *  round-trips through `JSON.stringify`/localStorage exactly like everything else this store
 *  persists - no new serialisation plumbing needed, unlike a raw `Blob` (which `JSON.stringify`
 *  reduces to `"{}"`). */
export interface DlaAgreementFile {
  name: string;
  size: number;
  dataUrl: string;
}

/** The "PDF, PNG, JPG (max. 2mb)" hint on the Approve Request modal's `InputFile`, enforced for
 *  real - a real per-record file base64-encoded into a zustand-persisted, localStorage-backed
 *  store is a genuine quota risk (a browser's whole-origin localStorage budget is typically
 *  5-10MB) if left unbounded; 2MB keeps a single record's worst case well inside that. */
export const MAX_AGREEMENT_FILE_BYTES = 2 * 1024 * 1024;

/** What the record form edits - a `Dla` minus what the workflow itself assigns. */
export type DlaDraft = Omit<Dla, "id" | "status" | "submittedAt" | "updatedAt" | "history">;

/** What the "Approve Request" modal collects - the fields it sets on approval. */
export interface DlaApproveInput {
  validFrom: string;
  validTo: string;
  agreementFile: DlaAgreementFile | null;
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
  return localIsoDate();
}

export function requestorName(r: DlaRequestor): string {
  return `${r.firstName} ${r.lastName}`.trim();
}

/** A minimal, real, valid one-page PDF (plain text objects, the built-in Helvetica font, a real
 *  computed xref table) - not a fabricated byte blob. Used only for seed data: the 3 already-
 *  "approved" seed requests below need something real to download too, and there is no actual
 *  signed document behind them to recover, so this stands in as an honest placeholder ("this is a
 *  placeholder", not real agreement text) rather than the record silently having no downloadable
 *  file at all. Every agreement approved through the real Approve Request modal from here on
 *  attaches the requester's own real uploaded bytes instead (`readAgreementFile`, dla-detail.tsx). */
function placeholderAgreementFile(id: string): DlaAgreementFile {
  const lines = [
    "Data Licencing Agreement",
    id,
    "This is a placeholder document. This preview does not store a real signed agreement for it.",
  ];
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = lines.map((line, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 72 ${700 - i * 26} Td (${escape(line)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return { name: `${id}.pdf`, size: pdf.length, dataUrl: `data:application/pdf;base64,${btoa(pdf)}` };
}

/** Draft through On Hold, a request's own access level is still being decided, so the form stays
 *  open. Approved already is a decision - the business's own sheet has it "remain as Approved...
 *  until the date... becomes active" - so a granted level (Level 2 or Level 3) can't be swapped for
 *  the other one in place; getting the other level for that location takes a new request, the same
 *  "Renew creates a new record" precedent this workflow already applies to a Closed agreement. See
 *  CONTEXT.md, "DLA: an access level can't be changed once granted".
 *
 *  The single source of truth for whether a request can be edited at all - both the deep dive's own
 *  Edit action (dla-detail.tsx) and the edit route itself (app/pages/dla/[id]/edit) must check this,
 *  since a status guard only on the button doesn't stop a direct URL visit. */
export function isDlaEditable(status: DlaStatus): boolean {
  return status === "draft" || status === "submitted" || status === "under_review" || status === "on_hold";
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
    // The agreement starts today unless the person chooses another day (designer, 6 Oct 2026: start dates open as today).
    requestPeriodFrom: todayIso(),
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

/** Field errors keyed by path ("purpose", "requestor.email", "locations.<id>.name", ...). A draft
 *  only needs the requestor's organisation - the same "just enough to identify it" rule as DSA's
 *  own draft mode. */
export function validateDla(draft: DlaDraft, mode: "draft" | "submit" = "submit"): DlaErrors {
  const errors: DlaErrors = {};
  if (mode === "draft") {
    if (!draft.requestor.organisation.trim()) errors["requestor.organisation"] = "Enter an organisation";
    return errors;
  }

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
    requestor: { firstName: "Phoenix", lastName: "Baker", organisation: "South Australian Museum", email: "phoenix.baker@example.org", phone: "" },
    agreementFile: placeholderAgreementFile("DLA-2025-01348"),
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-01-20",
    updatedAt: "2026-01-26",
    history: [
      { status: "draft", at: "2026-01-20", by: "Phoenix Baker" },
      { status: "submitted", at: "2026-01-21", by: "Phoenix Baker" },
      { status: "under_review", at: "2026-01-23", by: REVIEWING_ADMIN_NAME },
      { status: "active", at: "2026-01-26", by: REVIEWING_ADMIN_NAME },
    ],
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
    history: [
      { status: "draft", at: "2026-09-18", by: "Maya Dewitt" },
      { status: "submitted", at: "2026-09-18", by: "Maya Dewitt" },
      { status: "under_review", at: "2026-09-18", by: REVIEWING_ADMIN_NAME },
    ],
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
    requestor: { firstName: "Phoenix", lastName: "Baker", organisation: "South Australian Museum", email: "phoenix.baker@example.org", phone: "" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "Insufficient evidence of institutional affiliation for enhanced-access sensitive species data. Please reapply with a supporting letter from a recognised research body.",
    submittedAt: "2026-08-05",
    updatedAt: "2026-08-12",
    history: [
      { status: "draft", at: "2026-08-05", by: "Phoenix Baker" },
      { status: "submitted", at: "2026-08-05", by: "Phoenix Baker" },
      { status: "under_review", at: "2026-08-08", by: REVIEWING_ADMIN_NAME },
      {
        status: "rejected",
        at: "2026-08-12",
        by: REVIEWING_ADMIN_NAME,
        note: "Insufficient evidence of institutional affiliation for enhanced-access sensitive species data. Please reapply with a supporting letter from a recognised research body.",
      },
    ],
  },
  {
    id: "DLA-2024-00219",
    status: "closed",
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
    agreementFile: placeholderAgreementFile("DLA-2024-00219"),
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2025-01-10",
    updatedAt: "2025-01-15",
    history: [
      { status: "draft", at: "2025-01-10", by: "Lana Steiner" },
      { status: "submitted", at: "2025-01-11", by: "Lana Steiner" },
      { status: "under_review", at: "2025-01-13", by: REVIEWING_ADMIN_NAME },
      { status: "active", at: "2025-01-15", by: REVIEWING_ADMIN_NAME },
      { status: "closed", at: "2026-01-14", by: "System", note: "Closed automatically - the agreement's end date passed." },
    ],
  },
  {
    id: "DLA-2026-00340",
    status: "cancelled",
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
    requestor: { firstName: "Olivia", lastName: "Wyatt", organisation: "South Australian Museum", email: "olivia.wyatt@sa.gov.au", phone: "" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-05-02",
    updatedAt: "2026-05-14",
    history: [
      { status: "draft", at: "2026-05-02", by: "Olivia Wyatt" },
      { status: "submitted", at: "2026-05-02", by: "Olivia Wyatt" },
      { status: "under_review", at: "2026-05-06", by: REVIEWING_ADMIN_NAME },
      { status: "cancelled", at: "2026-05-14", by: "Olivia Wyatt" },
    ],
  },
  // Draft through Approved: real examples of every stage in the shared DSA/DLA workflow (see
  // agreement-status.ts) that DLA didn't have seed coverage for before - Draft and Submitted (as
  // its own distinct stage from Under Review) are both genuinely new capabilities for DLA.
  {
    id: "DLA-2026-00520",
    status: "draft",
    locations: [],
    purpose: "",
    requestPeriodFrom: "",
    requestPeriodTo: "",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Phoenix", lastName: "Baker", organisation: "South Australian Museum", email: "phoenix.baker@example.org", phone: "" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-09-19",
    updatedAt: "2026-09-19",
    history: [{ status: "draft", at: "2026-09-19", by: "Phoenix Baker" }],
  },
  {
    id: "DLA-2026-00515",
    status: "submitted",
    locations: [
      {
        id: "loc-7",
        name: "Belair National Park",
        method: "list",
        boundary: boundary("b-7", [-35.02, 138.65], 8),
        level: "level2",
        projectIds: [],
      },
    ],
    purpose: "Standard-access monitoring data to support a joint revegetation survey.",
    requestPeriodFrom: "2026-11-01",
    requestPeriodTo: "2027-10-31",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Maya", lastName: "Dewitt", organisation: "BirdLife Australia", email: "maya.dewitt@example.org", phone: "03 9347 0757" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-09-21",
    updatedAt: "2026-09-21",
    history: [
      { status: "draft", at: "2026-09-21", by: "Maya Dewitt" },
      { status: "submitted", at: "2026-09-21", by: "Maya Dewitt" },
    ],
  },
  {
    id: "DLA-2026-00498",
    status: "on_hold",
    locations: [
      {
        id: "loc-8",
        name: "Flinders Ranges National Park",
        method: "map",
        boundary: boundary("b-8", [-31.49, 138.6], 40),
        level: "level3",
        projectIds: ["flinders"],
      },
    ],
    purpose: "Enhanced-access sensitive species data for a proposed grazing management plan.",
    requestPeriodFrom: "2026-10-15",
    requestPeriodTo: "2027-10-14",
    validFrom: "",
    validTo: "",
    requestor: { firstName: "Lana", lastName: "Steiner", organisation: "Natural Resources KI", email: "lana.steiner@example.org", phone: "08 8553 4444" },
    agreementFile: null,
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-09-11",
    updatedAt: "2026-09-19",
    history: [
      { status: "draft", at: "2026-09-11", by: "Lana Steiner" },
      { status: "submitted", at: "2026-09-11", by: "Lana Steiner" },
      { status: "under_review", at: "2026-09-15", by: REVIEWING_ADMIN_NAME },
      {
        status: "on_hold",
        at: "2026-09-19",
        by: REVIEWING_ADMIN_NAME,
        note: "Waiting on confirmation of the grazing management plan's own project boundaries before the review can continue.",
      },
    ],
  },
  {
    id: "DLA-2026-00510",
    status: "approved",
    locations: [
      {
        id: "loc-9",
        name: "Naracoorte Caves National Park",
        method: "coordinates",
        boundary: boundary("b-9", [-36.98, 140.8], 12),
        level: "level2",
        projectIds: [],
      },
    ],
    purpose: "Standard-access cave fauna monitoring data ahead of the next survey season.",
    requestPeriodFrom: "2026-12-01",
    requestPeriodTo: "2028-11-30",
    validFrom: "2026-12-01",
    validTo: "2028-11-30",
    requestor: { firstName: "Olivia", lastName: "Wyatt", organisation: "South Australian Museum", email: "olivia.wyatt@sa.gov.au", phone: "" },
    agreementFile: placeholderAgreementFile("DLA-2026-00510"),
    isCustom: false,
    customNote: "",
    rejectionReason: "",
    submittedAt: "2026-09-05",
    updatedAt: "2026-09-23",
    history: [
      { status: "draft", at: "2026-09-05", by: "Olivia Wyatt" },
      { status: "submitted", at: "2026-09-05", by: "Olivia Wyatt" },
      { status: "under_review", at: "2026-09-10", by: REVIEWING_ADMIN_NAME },
      { status: "approved", at: "2026-09-23", by: REVIEWING_ADMIN_NAME },
    ],
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
