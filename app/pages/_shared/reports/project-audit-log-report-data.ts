// The rows of the Project Audit Log Report (Figma YMproGZfrFB5jUqPHPxMhk frame 2658:176999): one row per entry of the project
// audit log (project-audit-log-store.ts), read as it is saved. A row is never stored here. Seq# is the entry's place in the whole
// log, oldest first, so it reads the same whatever is searched or filtered.

import { hasFeatureAccess } from "@/config/role-access.config";
import type { ProjectAuditEntry } from "@/app/pages/_shared/project-audit-log-store";
import type { UserRole } from "@/lib/user-role";

export interface AuditReportRow extends ProjectAuditEntry {
  seq: number;
}

/** A moment as the wireframe writes it: the day, then the time to the second ("15/01/2026 12:00:00 am"). */
export function formatAuditTimestamp(ms: number): string {
  return new Date(ms).toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).replace(",", "");
}

/** The whole log for a role that may report on it (BioData Admin), numbered; nothing for any other role. */
export function auditRowsFor(entries: ProjectAuditEntry[], role: UserRole): AuditReportRow[] {
  if (!hasFeatureAccess("projectAuditLog", role)) return [];
  return [...entries].sort((a, b) => a.at - b.at).map((entry, i) => ({ ...entry, seq: i + 1 }));
}
