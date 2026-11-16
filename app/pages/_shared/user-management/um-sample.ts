import { getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DEW, UM_ORGANISATIONS, type RoleKind, type UmRole } from "@/app/pages/_shared/user-management/um-data";

// The User Management add forms' sample answers, for the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts). Each form is answered down its fullest branch (the designer, 10 Nov 2026):
// - Add user: an alias (the optional name), an organisation, an access period with an end date, and a system role and a custom role.
// - Add role: a custom role, which asks for a department, and an end date.
// - Add permission: "New category", which asks for the category's name, and two permissions in it.
// Honest (CONTRACTS 0.3): the person is a placeholder (Phoenix Baker, example.com), the organisation is from the build's own list, no phone number is
// given because one would be invented, and the words describe what a role or permission is for, not a real one.

/** What a user form holds, in one object so the switch can set it all at once. */
export interface UserFormSample {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  position: string;
  organisation: string | null;
  startDate: DateValue | null;
  endDate: DateValue | null;
  roleIds: string[];
}

export function sampleUser(roles: UmRole[]): UserFormSample {
  const active = roles.filter((r) => r.status === "active");
  // A staff role and one of the organisation's own roles, so the tree and the permissions preview both have an answer.
  const system = active.find((r) => r.kind === "system" && r.name === "BioData User") ?? active.find((r) => r.kind === "system");
  const custom = active.find((r) => r.kind === "custom" && r.department === DEW) ?? active.find((r) => r.kind === "custom");
  const start: CalendarDate = today(getLocalTimeZone());
  return {
    firstName: "Phoenix",
    lastName: "Baker",
    displayName: "Phoenix",
    email: "phoenix.baker@example.com",
    phone: "",
    position: "Field Officer",
    organisation: DEW,
    startDate: start,
    endDate: start.add({ years: 1 }),
    roleIds: [system?.id, custom?.id].filter((id): id is string => !!id),
  };
}

export interface RoleFormSample {
  kind: RoleKind;
  department: string | null;
  roleType: string;
  name: string;
  description: string;
  startDate: DateValue | null;
  endDate: DateValue | null;
}

export function sampleRole(): RoleFormSample {
  const start = today(getLocalTimeZone());
  return {
    kind: "custom",
    department: UM_ORGANISATIONS[0] ?? null,
    roleType: "Data Submission",
    name: "Survey data reviewer",
    description: "Checks the records a project submits against its survey method before they are published.",
    startDate: start,
    endDate: start.add({ years: 2 }),
  };
}

export interface PermissionFormSample {
  category: string | null;
  newCategory: string;
  entries: { key: number; name: string; description: string }[];
  startDate: DateValue | null;
  endDate: DateValue | null;
}

/** `newCategoryId` is the form's own "New category" choice. */
export function samplePermission(newCategoryId: string): PermissionFormSample {
  const start = today(getLocalTimeZone());
  return {
    category: newCategoryId,
    newCategory: "Specimen Data",
    entries: [
      { key: 1, name: "Read Specimens", description: "View specimen records and their vouchers" },
      { key: 2, name: "Edit Specimens", description: "Change specimen records and their vouchers" },
    ],
    startDate: start,
    endDate: start.add({ years: 1 }),
  };
}
