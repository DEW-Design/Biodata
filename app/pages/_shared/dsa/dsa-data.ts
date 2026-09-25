// Data Sharing Agreement (DSA) model + seed data for /pages/dsa. Shaped from the Master Flows
// lo-fi (Figma yzQY87GXoyGGGPJDnh1hmi, node 3:15901: DSA List, DSA Empty State, DSA Record form).
// There's no backend in this build, so the page keeps this list in local state - create, edit,
// cancel and draft all really work for the session, they just don't persist past a reload.
//
// Status now follows the shared DSA/DLA workflow model (see agreement-status.ts) - Draft, Submitted,
// Under Review, On Hold, Approved, Rejected, Active, Closed, Cancelled, and the real transitions
// between them, replacing the earlier lo-fi-only Active/Inactive/Revoked/Draft set (see CONTEXT.md,
// "Unified DSA/DLA status model" for the source and every decision behind it).
export type { AgreementStatus as DsaStatus } from "@/app/pages/_shared/agreement-status";
export { agreementStatusOrder as dsaStatusOrder, agreementStatusMeta as dsaStatusMeta } from "@/app/pages/_shared/agreement-status";
import type { AgreementStatus as DsaStatus } from "@/app/pages/_shared/agreement-status";

export type DsaScope = "species" | "location" | "project";

export const dsaScopeOptions: { id: DsaScope; label: string }[] = [
  { id: "species", label: "Species" },
  { id: "location", label: "Location" },
  { id: "project", label: "Project" },
];

export interface DsaContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface DsaSystem {
  id: string;
  name: string;
  redirectUrl: string;
  scopes: DsaScope[];
  canRead: boolean;
  canWrite: boolean;
  /** Who operates the receiving system - the "Department / Agency" column in the detail table. */
  org: { name: string } & DsaContact;
  accessToken: string;
  refreshToken: string;
}

export interface Dsa {
  /** The display ID (DSA-2025-01348) - also the unique key. */
  id: string;
  status: DsaStatus;
  partner: string;
  purpose: string;
  /** ISO dates (YYYY-MM-DD), "" when not set yet (drafts). */
  validFrom: string;
  validTo: string;
  agreementFile: { name: string } | null;
  requestedBy: DsaContact;
  custodian: DsaContact;
  sharedOffline: boolean;
  sharedViaSystem: boolean;
  systems: DsaSystem[];
  /** Set by `rejectDsa` on the Rejected transition - never edited through the form itself. */
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

/** What the record form edits - a `Dsa` minus what the workflow itself assigns. */
export type DsaDraft = Omit<Dsa, "id" | "status" | "createdAt" | "updatedAt">;

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

export function contactName(c: DsaContact): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

// ── IDs and tokens ──

/** Next display ID: DSA-<this year>-<one past the highest sequence number in use>. */
export function nextDsaId(existing: Dsa[]): string {
  const highest = existing.reduce((max, dsa) => Math.max(max, Number(dsa.id.split("-")[2]) || 0), 0);
  return `DSA-${new Date().getFullYear()}-${String(highest + 1).padStart(5, "0")}`;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function randomSegment(length: number) {
  return Array.from({ length }, () => B64[Math.floor(Math.random() * B64.length)]).join("");
}

/** A JWT-shaped placeholder. Random, never a real credential - there is no token service in this build. */
export function mockToken(): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${randomSegment(64)}.${randomSegment(43)}`;
}

let systemCounter = 0;
export function newSystemId(): string {
  systemCounter += 1;
  return `sys-${Date.now().toString(36)}-${systemCounter}`;
}

const emptyContact = (): DsaContact => ({ firstName: "", lastName: "", email: "", phone: "" });

export function emptyDsaSystem(partner = ""): DsaSystem {
  return {
    id: newSystemId(),
    name: "",
    redirectUrl: "",
    scopes: [],
    canRead: false,
    canWrite: false,
    org: { name: partner, ...emptyContact() },
    accessToken: mockToken(),
    refreshToken: mockToken(),
  };
}

export function emptyDsaDraft(): DsaDraft {
  return {
    partner: "",
    purpose: "",
    validFrom: "",
    validTo: "",
    agreementFile: null,
    requestedBy: emptyContact(),
    custodian: emptyContact(),
    sharedOffline: false,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
  };
}

// ── Validation ──

export type DsaFormTab = "agreement" | "contacts" | "sharing";

export type DsaErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function contactErrors(prefix: string, c: DsaContact, errors: DsaErrors, opts: { requirePhone?: boolean } = {}) {
  if (!c.firstName.trim()) errors[`${prefix}.firstName`] = "Enter a first name";
  if (!c.lastName.trim()) errors[`${prefix}.lastName`] = "Enter a last name";
  if (!c.email.trim()) errors[`${prefix}.email`] = "Enter an email address";
  else if (!EMAIL.test(c.email.trim())) errors[`${prefix}.email`] = "Enter a valid email address";
  if (opts.requirePhone && !c.phone.trim()) errors[`${prefix}.phone`] = "Enter a contact number";
}

/** Field errors keyed by path ("partner", "requestedBy.email", "systems.<id>.redirectUrl", ...). */
export function validateDsa(draft: DsaDraft, mode: "draft" | "submit"): DsaErrors {
  const errors: DsaErrors = {};
  if (!draft.partner.trim()) errors.partner = "Enter the institution or organisation";
  if (mode === "draft") return errors;

  if (!draft.purpose.trim()) errors.purpose = "Describe the purpose of data sharing";
  if (!draft.validFrom) errors.validFrom = "Select a start date";
  if (!draft.validTo) errors.validTo = "Select an end date";
  else if (draft.validFrom && draft.validTo < draft.validFrom) errors.validTo = "End date must be on or after the start date";
  if (!draft.agreementFile) errors.agreementFile = "Upload the signed agreement (PDF)";

  contactErrors("requestedBy", draft.requestedBy, errors);
  contactErrors("custodian", draft.custodian, errors);

  if (!draft.sharedOffline && !draft.sharedViaSystem) errors.method = "Select at least one way the data is shared";
  if (draft.sharedViaSystem && draft.systems.length === 0) errors.systems = "Add at least one system";
  if (draft.sharedViaSystem) {
    for (const system of draft.systems) {
      const key = `systems.${system.id}`;
      if (!system.name.trim()) errors[`${key}.name`] = "Enter the system or application name";
      if (!system.redirectUrl.trim()) errors[`${key}.redirectUrl`] = "Enter the redirect URL";
      else if (!isUrl(system.redirectUrl.trim())) errors[`${key}.redirectUrl`] = "Enter a valid URL, starting with https://";
      if (system.scopes.length === 0) errors[`${key}.scopes`] = "Select at least one scope";
      if (!system.canRead && !system.canWrite) errors[`${key}.permissions`] = "Select at least one permission";
      if (!system.org.name.trim()) errors[`${key}.org.name`] = "Enter the organisation name";
      contactErrors(`${key}.org`, system.org, errors);
    }
  }
  return errors;
}

export function errorTab(path: string): DsaFormTab {
  if (path === "partner" || path === "purpose" || path === "validFrom" || path === "validTo" || path === "agreementFile") return "agreement";
  if (path.startsWith("requestedBy") || path.startsWith("custodian")) return "contacts";
  return "sharing";
}

// ── Seed data ──
//
// Placeholder people follow the repo convention (Phoenix Baker, Lana Steiner, Olivia Wyatt, Maya
// Dewitt); partner names are the real BDBSA partners already used elsewhere in this build. The
// requester's email is example.org, the DEW custodian's is sa.gov.au (as in the lo-fi).

const person = (firstName: string, lastName: string, domain: string, phone = ""): DsaContact => ({
  firstName,
  lastName,
  email: `${firstName}.${lastName}@${domain}`.toLowerCase(),
  phone,
});

const custodian = person("Lana", "Steiner", "sa.gov.au", "08 8204 1234");

// Fixed strings, not mockToken(): seed data renders on the server too, and a random value would
// mismatch on hydration.
const SEED_ACCESS = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkc2Etc2VlZCIsInNjb3BlIjoic3BlY2llcyJ9.k3m9Vq2xT7uB1nWc8ZrYdE4hJfLpA0sGoXiN5tKzR6w";
const SEED_REFRESH = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkc2Etc2VlZCIsInR5cGUiOiJyZWZyZXNoIn0.Qp8Fh3sLm1Dz6YcVw9NxUj2aBt7eKgR4oIyH0vMnT5E";

export const seedDsas: Dsa[] = [
  {
    id: "DSA-2025-01348",
    status: "active",
    partner: "SA Museum",
    purpose: "Monitoring biodiversity health, assessing threatened species distribution, and conducting collaborative regional ecology research.",
    validFrom: "2025-07-12",
    validTo: "2027-07-12",
    agreementFile: { name: "SA-Museum-DSA-2025-01348.pdf" },
    requestedBy: person("Phoenix", "Baker", "example.org", "08 8207 7500"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: true,
    systems: [
      {
        id: "sys-01348-1",
        name: "Collections Database Sync",
        redirectUrl: "https://collections.example.org/oauth/callback",
        scopes: ["species", "location"],
        canRead: true,
        canWrite: false,
        org: { name: "SA Museum", ...person("Phoenix", "Baker", "example.org", "08 8207 7500") },
        accessToken: SEED_ACCESS,
        refreshToken: SEED_REFRESH,
      },
      {
        id: "sys-01348-2",
        name: "Public Records Gateway",
        redirectUrl: "https://gateway.example.org/oauth/callback",
        scopes: ["project"],
        canRead: true,
        canWrite: true,
        org: { name: "Department for Infrastructure and Transport", ...person("Olivia", "Wyatt", "example.org", "08 8226 8111") },
        accessToken: SEED_ACCESS,
        refreshToken: SEED_REFRESH,
      },
    ],
    rejectionReason: "",
    createdAt: "2026-01-30",
    updatedAt: "2026-01-30",
  },
  {
    id: "DSA-2025-01351",
    status: "active",
    partner: "BirdLife Australia",
    purpose: "Sharing threatened woodland bird records to support the regional recovery plan and annual population reporting.",
    validFrom: "2025-08-01",
    validTo: "2027-07-31",
    agreementFile: { name: "BirdLife-Australia-DSA-2025-01351.pdf" },
    requestedBy: person("Maya", "Dewitt", "example.org", "03 9347 0757"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-01-31",
    updatedAt: "2026-02-04",
  },
  {
    id: "DSA-2025-01352",
    status: "active",
    partner: "Birds SA",
    purpose: "Exchange of volunteer bird survey observations for inclusion in the statewide biodiversity record.",
    validFrom: "2025-08-15",
    validTo: "2026-12-31",
    agreementFile: { name: "Birds-SA-DSA-2025-01352.pdf" },
    requestedBy: person("Olivia", "Wyatt", "example.org", "08 8271 4544"),
    custodian,
    sharedOffline: false,
    sharedViaSystem: true,
    systems: [
      {
        id: "sys-01352-1",
        name: "Survey Submissions Feed",
        redirectUrl: "https://submit.example.org/oauth/callback",
        scopes: ["species", "location", "project"],
        canRead: true,
        canWrite: true,
        org: { name: "Birds SA", ...person("Olivia", "Wyatt", "example.org", "08 8271 4544") },
        accessToken: SEED_ACCESS,
        refreshToken: SEED_REFRESH,
      },
    ],
    rejectionReason: "",
    createdAt: "2026-01-31",
    updatedAt: "2026-01-31",
  },
  {
    id: "DSA-2025-01353",
    status: "active",
    partner: "Adelaide Hills Landcare",
    purpose: "Access to site and visit records across the Adelaide Hills to plan revegetation and weed control works.",
    validFrom: "2025-09-01",
    validTo: "2027-08-31",
    agreementFile: { name: "Adelaide-Hills-Landcare-DSA-2025-01353.pdf" },
    requestedBy: person("Phoenix", "Baker", "example.org", "08 8388 1234"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-01-31",
    updatedAt: "2026-01-31",
  },
  {
    id: "DSA-2025-01290",
    status: "active",
    partner: "Natural Resources Kangaroo Island",
    purpose: "Supply of island-wide occurrence data for fire recovery monitoring and threatened species management.",
    validFrom: "2025-05-20",
    validTo: "2027-05-19",
    agreementFile: { name: "Natural-Resources-KI-DSA-2025-01290.pdf" },
    requestedBy: person("Lana", "Steiner", "example.org", "08 8553 4444"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2025-11-12",
    updatedAt: "2025-11-12",
  },
  {
    id: "DSA-2024-00871",
    status: "closed",
    partner: "BirdLife Australia",
    purpose: "Two-year exchange of shorebird count data for the Coorong monitoring program.",
    validFrom: "2024-07-01",
    validTo: "2025-06-30",
    agreementFile: { name: "BirdLife-Australia-DSA-2024-00871.pdf" },
    requestedBy: person("Maya", "Dewitt", "example.org", "03 9347 0757"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2024-06-18",
    updatedAt: "2025-07-01",
  },
  {
    id: "DSA-2024-00912",
    status: "closed",
    partner: "Birds SA",
    purpose: "Pilot exchange of citizen-science sightings ahead of the current agreement.",
    validFrom: "2024-09-01",
    validTo: "2025-08-31",
    agreementFile: { name: "Birds-SA-DSA-2024-00912.pdf" },
    requestedBy: person("Olivia", "Wyatt", "example.org", "08 8271 4544"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2024-08-22",
    updatedAt: "2025-09-01",
  },
  {
    id: "DSA-2026-01402",
    status: "draft",
    partner: "Adelaide Hills Landcare",
    purpose: "",
    validFrom: "2026-10-01",
    validTo: "",
    agreementFile: null,
    requestedBy: person("Phoenix", "Baker", "example.org"),
    custodian: emptyContact(),
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-09-15",
    updatedAt: "2026-09-15",
  },
  // Submitted through Cancelled: real examples of every stage in the shared DSA/DLA workflow (see
  // agreement-status.ts) - none of these existed under the old Active/Inactive/Revoked/Draft set.
  {
    id: "DSA-2026-01410",
    status: "submitted",
    partner: "BirdLife Australia",
    purpose: "Access to migratory shorebird tracking data to support a joint East Asian-Australasian Flyway reporting obligation.",
    validFrom: "2026-11-01",
    validTo: "2028-10-31",
    agreementFile: { name: "BirdLife-Australia-DSA-2026-01410.pdf" },
    requestedBy: person("Maya", "Dewitt", "example.org", "03 9347 0757"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-09-20",
    updatedAt: "2026-09-20",
  },
  {
    id: "DSA-2026-01405",
    status: "under_review",
    partner: "Natural Resources Kangaroo Island",
    purpose: "Sharing post-fire vegetation recovery transects to support a joint state-of-the-island report.",
    validFrom: "2026-10-15",
    validTo: "2028-10-14",
    agreementFile: { name: "Natural-Resources-KI-DSA-2026-01405.pdf" },
    requestedBy: person("Lana", "Steiner", "example.org", "08 8553 4444"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-09-16",
    updatedAt: "2026-09-22",
  },
  {
    id: "DSA-2026-01398",
    status: "on_hold",
    partner: "Adelaide Hills Landcare",
    purpose: "Site and visit records for a revised revegetation plan covering three additional sub-catchments.",
    validFrom: "2026-11-15",
    validTo: "2028-11-14",
    agreementFile: { name: "Adelaide-Hills-Landcare-DSA-2026-01398.pdf" },
    requestedBy: person("Phoenix", "Baker", "example.org", "08 8388 1234"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-21",
  },
  {
    id: "DSA-2026-01415",
    status: "approved",
    partner: "SA Museum",
    purpose: "Specimen collection metadata exchange to support a joint taxonomic reference project.",
    validFrom: "2026-12-01",
    validTo: "2028-11-30",
    agreementFile: { name: "SA-Museum-DSA-2026-01415.pdf" },
    requestedBy: person("Olivia", "Wyatt", "example.org", "08 8271 4544"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-09-08",
    updatedAt: "2026-09-23",
  },
  {
    id: "DSA-2026-01388",
    status: "rejected",
    partner: "Birds SA",
    purpose: "Bulk export of raw survey coordinates for an internal analytics pilot with no named research outcome.",
    validFrom: "2026-10-01",
    validTo: "2027-09-30",
    agreementFile: { name: "Birds-SA-DSA-2026-01388.pdf" },
    requestedBy: person("Maya", "Dewitt", "example.org", "03 9347 0757"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "The stated purpose doesn't identify a specific research or reporting outcome. Please resubmit with a defined project and expected use of the exported data.",
    createdAt: "2026-08-28",
    updatedAt: "2026-09-05",
  },
  {
    id: "DSA-2026-01372",
    status: "cancelled",
    partner: "Birds SA",
    purpose: "Scoping request for a shared observation feed that the partnership decided not to proceed with.",
    validFrom: "2026-09-01",
    validTo: "2028-08-31",
    agreementFile: { name: "Birds-SA-DSA-2026-01372.pdf" },
    requestedBy: person("Phoenix", "Baker", "example.org", "08 8388 1234"),
    custodian,
    sharedOffline: true,
    sharedViaSystem: false,
    systems: [],
    rejectionReason: "",
    createdAt: "2026-08-10",
    updatedAt: "2026-08-19",
  },
];

/** Every id /pages/dsa/[id] is pre-rendered for in the static GitHub Pages build: the seeds, plus
 *  the next `count` ids `nextDsaId` would hand out this year and next. New DSAs live in memory only
 *  (a reload resets to the seeds), so a session never gets far past the seed numbers - without
 *  these, opening a just-created DSA would 404 on a static host. */
export function staticDsaIds(count = 50): string[] {
  const highest = seedDsas.reduce((max, item) => Math.max(max, Number(item.id.split("-")[2]) || 0), 0);
  const year = new Date().getFullYear();
  const upcoming = [year, year + 1].flatMap((y) =>
    Array.from({ length: count }, (_, i) => `DSA-${y}-${String(highest + 1 + i).padStart(5, "0")}`),
  );
  return [...new Set([...seedDsas.map((item) => item.id), ...upcoming])];
}
