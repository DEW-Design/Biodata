// The Project Detail Report: one row per project, 41 columns (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk frame
// 1583:31154, columns list node 1583:31033). A row is never stored: it is read from the project's own page seed
// (report-records.ts), so the report and the project page cannot disagree about a project.
//
// Where the app holds no value the cell is empty and is not made up: no project has a created-on date or a
// last-updated-by name; only Adelaide Hills has contacts, managers, permits and restrictions, because the other
// projects are built from Explore's data, which carries none (project-seed.ts says the same).

import type { BadgeColor } from "@/components/base/badges/badges";
import { boundarySummary, SA_NATIONAL_PARKS } from "@/app/pages/_shared/map-search/geo";
import { countKinds, groupOfRecord, indexOf, recordsOfKind, type ReportProject } from "@/app/pages/_shared/reports/report-records";
import { formatIsoDay } from "@/app/pages/_shared/reports/ingestion-report-data";
import { conceptLabel } from "@/app/pages/project-registration/concept-rows";
import { COLLECTION_METHOD_OPTIONS, EMBARGO_TYPE_OPTIONS, PERMIT_TYPE_OPTIONS, PROJECT_METADATA_CONCEPTS, REGISTRATION_SPECIES, SPECIES_CONCEPTS } from "@/app/pages/project-registration/data";
import type { GeoExtentValue, RestrictionTypeKey } from "@/app/pages/project-registration/types";
import { contactRole, roleLabel } from "@/app/pages/project-detail/project-edit";

export interface ProjectRow {
  id: string;
  seq: number;
  code: string;
  title: string;
  description: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  events: number;
  occurrences: number;
  observations: number;
  /** ISO day, for sorting. */
  startIso: string;
  start: string;
  endIso: string;
  /** "Ongoing" for a project with no end date, as the project page says. */
  end: string;
  organisation: string;
  owner: string;
  ownerEmail: string;
  ownerContact: string;
  ownerRole: string;
  ownerOrganisation: string;
  manager: string;
  managerEmail: string;
  managerContact: string;
  managerRole: string;
  managerOrganisation: string;
  location: string;
  speciesGroups: string[];
  targetedSpecies: string;
  method: string;
  permitTypes: string[];
  permitNumbers: string;
  uriDoi: string;
  limitations: string;
  restricted: "Yes" | "No";
  embargo: "Yes" | "No";
  embargoTypes: string[];
  restrictedMetadata: string;
  restrictedSpecies: string;
  restrictedAttributes: string;
  restrictedLocation: string;
  otherRestrictions: string;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  /** Explore's own words for when the project last changed ("2 days ago"): the app holds no date for it. */
  updatedOn: string;
}

const join = (items: (string | undefined)[], separator = "; ") => items.filter(Boolean).join(separator);

function extentText(extent: GeoExtentValue): string {
  if (extent.method === "list" && extent.parkId) return SA_NATIONAL_PARKS.find((p) => p.id === extent.parkId)?.name ?? "";
  if (extent.method === "shapefile") return extent.shapefileName ?? "";
  return extent.boundary ? boundarySummary(extent.boundary) : "";
}

export function projectRowFor({ project, seq, seed }: ReportProject): ProjectRow {
  const { details: d, collection: c, restrictions: r, status } = seed.project;
  const index = indexOf(seed);
  const counts = countKinds(seed);
  const on = (key: RestrictionTypeKey) => r.hasRestrictions && r.enabledTypes.has(key);

  const owners = d.dataOwnerContacts.map((contact, i) => {
    const { role, roleOther } = contactRole(d, i);
    return { name: `${contact.firstName} ${contact.lastName}`.trim(), email: contact.email, phone: contact.phone, role: roleLabel(role, roleOther), organisation: contact.organisation };
  });
  const managers = d.projectManagers.map((m) => ({
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email,
    phone: m.phone,
    role: roleLabel(m.role, m.roleOther),
    organisation: m.organisation,
  }));

  const groups = new Set<string>();
  for (const record of [...recordsOfKind(seed, "occurrence"), ...recordsOfKind(seed, "observation")]) {
    const group = groupOfRecord(record, index);
    if (group) groups.add(group);
  }

  const speciesName = (id: string) => REGISTRATION_SPECIES.find((s) => s.id === id)?.commonName ?? id;
  const embargoTypes = on("embargo") ? r.embargo.types.map((t) => (t === "other" ? r.embargo.typeOther || "Other" : (EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label ?? t))) : [];
  const permits = c.permits.filter((p) => p.type || p.number);

  return {
    id: project.id,
    seq,
    code: seed.meta.code,
    title: d.shortTitle,
    description: d.abstract,
    status,
    statusColor: project.statusColor,
    ...counts,
    startIso: d.startDate?.toString() ?? "",
    start: formatIsoDay(d.startDate?.toString() ?? ""),
    endIso: d.endDate?.toString() ?? "",
    end: d.endDate ? formatIsoDay(d.endDate.toString()) : "Ongoing",
    organisation: d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : "",
    owner: join(owners.map((o) => o.name)),
    ownerEmail: join(owners.map((o) => o.email)),
    ownerContact: join(owners.map((o) => o.phone)),
    ownerRole: join(owners.map((o) => o.role)),
    ownerOrganisation: join(owners.map((o) => o.organisation)),
    manager: join(managers.map((m) => m.name)),
    managerEmail: join(managers.map((m) => m.email)),
    managerContact: join(managers.map((m) => m.phone)),
    managerRole: join(managers.map((m) => m.role)),
    managerOrganisation: join(managers.map((m) => m.organisation)),
    location: extentText(c.geographicExtent),
    speciesGroups: [...groups].sort(),
    targetedSpecies: join(c.targetedSpeciesIds.map(speciesName), ", "),
    method: COLLECTION_METHOD_OPTIONS.find((o) => o.id === c.collectionMethod)?.label ?? "",
    permitTypes: permits.map((p) => PERMIT_TYPE_OPTIONS.find((o) => o.id === p.type)?.label ?? "").filter(Boolean),
    permitNumbers: join(permits.map((p) => p.number)),
    uriDoi: c.uriDoi,
    limitations: c.limitationsAndBiases,
    restricted: r.hasRestrictions ? "Yes" : "No",
    embargo: on("embargo") ? "Yes" : "No",
    embargoTypes,
    restrictedMetadata: on("metadata") ? join(r.metadata.concepts.filter((x) => x.concept).map((x) => conceptLabel(x, PROJECT_METADATA_CONCEPTS)), ", ") : "",
    restrictedSpecies: on("species") ? join(r.species.map((s) => speciesName(s.speciesId)), ", ") : "",
    restrictedAttributes: on("species") ? join(r.species.map((s) => (s.scope === "all" ? "All concepts" : join(s.concepts.filter((x) => x.concept).map((x) => conceptLabel(x, SPECIES_CONCEPTS)), ", ")))) : "",
    restrictedLocation: on("locations") ? join(r.locations.map((l) => l.name)) : "",
    otherRestrictions: on("other") ? r.otherRestrictions : "",
    createdBy: project.contributorName ?? "",
    createdOn: "",
    updatedBy: "",
    updatedOn: project.updated ?? "",
  };
}
