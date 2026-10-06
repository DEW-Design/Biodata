"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { diffProjectFields, type ProjectFieldState } from "@/app/pages/_shared/project-audit-diff";
import type { UserRole } from "@/lib/user-role";

// The project audit log (designer, 6 Oct 2026: "Record real changes from now on"). The app holds no history for a project, so the
// log starts when a change is made in this browser: a CREATE when Add Project submits, and one UPDATE per field when a project's
// edit is saved, each with the real time, the person, and where it came from. A project that has not been registered or edited
// since then has no rows; nothing is made up for it (CONTRACTS 0.3). Kept in localStorage, like the other stores here (there is
// no backend), and read by the Project Audit Log Report (reports/project-audit-log-report.tsx).

export type AuditAction = "CREATE" | "UPDATE";

export interface ProjectAuditEntry {
  id: string;
  /** Milliseconds. */
  at: number;
  /** The project's own ID, e.g. BD-5039. */
  projectCode: string;
  projectTitle: string;
  /** "Record" for a whole project (a CREATE), "Field" for one of its fields (an UPDATE). */
  entityType: "Record" | "Field";
  /** What was changed: "Record", or the field's name. */
  modifiedEntity: string;
  previous: string;
  current: string;
  action: AuditAction;
  /** Where the change came from. Every change in this build is made in the web portal. */
  sourceType: "Web Portal";
  /** The role it was made as, as the role is named on screen. */
  source: string;
  user: string;
}

interface AuditState {
  entries: ProjectAuditEntry[];
}

const useAuditStore = create<AuditState>()(
  persist<AuditState>(() => ({ entries: [] }), {
    name: "biodata-project-audit-log",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

// How a role is named in the log's Source column: the names the product uses for the roles.
const SOURCE_NAME: Record<UserRole, string> = {
  "biodata-super-admin": "BioData Super Admin",
  "biodata-admin": "BioData Admin",
  "biodata-user": "BioData User",
  "privileged-admin": "Privileged Admin",
  "privileged-user": "Privileged User",
  "registered-user": "Registered User",
  "public-user": "Public User",
};

const newId = () => `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function append(entries: Omit<ProjectAuditEntry, "id" | "at" | "sourceType" | "source" | "user">[], role: UserRole) {
  if (entries.length === 0) return;
  // Read what is already in localStorage first, so a change made in another tab is not overwritten.
  if (!useAuditStore.persist.hasHydrated()) useAuditStore.persist.rehydrate();
  const at = Date.now();
  const made = entries.map((e) => ({ ...e, id: newId(), at, sourceType: "Web Portal" as const, source: SOURCE_NAME[role], user: CURRENT_USER_NAME }));
  useAuditStore.setState((s) => ({ entries: [...s.entries, ...made] }));
}

/** A project was registered: one CREATE for the whole record. */
export function logProjectCreated(project: { code: string; title: string }, role: UserRole) {
  append([{ projectCode: project.code, projectTitle: project.title, entityType: "Record", modifiedEntity: "Record", previous: "", current: "", action: "CREATE" }], role);
}

/** A project's edit was saved: one UPDATE for each field whose value is different now. */
export function logProjectChanges(project: { code: string }, before: ProjectFieldState, after: ProjectFieldState, role: UserRole) {
  const changes = diffProjectFields(before, after);
  append(
    changes.map((c) => ({ projectCode: project.code, projectTitle: after.details.shortTitle, entityType: "Field" as const, modifiedEntity: c.field, previous: c.previous, current: c.current, action: "UPDATE" as const })),
    role,
  );
}

/** Every entry, oldest first, reading the saved ones after the first render. */
export function useProjectAuditLog(): ProjectAuditEntry[] {
  useRehydrate(useAuditStore);
  return useAuditStore((s) => s.entries);
}
