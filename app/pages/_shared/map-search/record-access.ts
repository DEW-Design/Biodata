"use client";

import { hasFeatureAccess } from "@/config/role-access.config";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";
import { findObservation, findOccurrence, restrictedRadiusKm, type LicenceLevel, type SearchResource, type SpeciesGroup } from "./search-data";

// Who sees restricted (Level 2 and above) records, and how, per the designer (Sept 28 2026):
// - BioData Admin sees Level 1 to 4 in full, with precise locations (`restrictedData` in the role
//   access matrix, admin only).
// - A public user sees Level 1 only: restricted records are left out of results, counts, the map
//   and search. To see more they sign up and request a Data Licencing Agreement (DLA).
// - Every other signed-in role sees restricted records with the location generalised and blurred,
//   and can request a DLA.
// The one place this rule lives; every screen that shows a record asks here.

export type RecordAccess = "full" | "generalised" | "hidden";

type Licensed = { licenceLevel?: LicenceLevel; group?: SpeciesGroup };

/** Level 2 and above. A record with no level is public. */
export function isRestricted(record: Licensed): boolean {
  return record.licenceLevel !== undefined && record.licenceLevel !== "Level 1";
}

export function recordAccess(record: Licensed, role: UserRole): RecordAccess {
  if (!isRestricted(record) || hasFeatureAccess("restrictedData", role)) return "full";
  return role === "public-user" ? "hidden" : "generalised";
}

/** How far to generalise this record's location for this role, in km, or null to show it as
 *  recorded. */
export function generalisedKm(record: Licensed, role: UserRole): number | null {
  return recordAccess(record, role) === "generalised" ? restrictedRadiusKm(record) : null;
}

/** The record an artefact is attached to; an artefact shares its record's access. */
export function artefactRecord(resource: SearchResource) {
  return findOccurrence(resource.recordId) ?? findObservation(resource.recordId);
}

/** The block size an artefact is shown at: its record's (an artefact sits where its record was made). */
export function artefactGeneralisedKm(resource: SearchResource, role: UserRole): number | null {
  const record = artefactRecord(resource);
  return record ? generalisedKm(record, role) : null;
}

export function artefactAccess(resource: SearchResource, role: UserRole): RecordAccess {
  const record = artefactRecord(resource);
  return record ? recordAccess(record, role) : "full";
}

/** The current role's access, for components. */
export function useRecordAccess() {
  const role = useUserRole();
  return {
    role,
    access: (record: Licensed) => recordAccess(record, role),
    generalisedKm: (record: Licensed) => generalisedKm(record, role),
    artefactAccess: (resource: SearchResource) => artefactAccess(resource, role),
  };
}
