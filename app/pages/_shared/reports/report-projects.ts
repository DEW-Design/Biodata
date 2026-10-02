import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { projects } from "@/app/pages/_shared/project-list-data";
import { searchEvents, type SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import type { UserRole } from "@/lib/user-role";

// Which projects a report may draw on, for one rule in one place (the ingestion report's rule, 2026-09-28-38:
// "seen per person for the projects they can access, and BioData Admin sees all"). BioData Admin reports across every
// project on the platform; everyone else across the projects they contribute to. A project is the root Project event
// the Explore data and the project pages share, so a report and a project page cannot disagree about it.
export function reportProjectsFor(role: UserRole): SearchEvent[] {
  const roots = searchEvents.filter((e) => e.type === "Project");
  if (role === "biodata-admin") return roots;
  const mine = new Set(projects.filter((p) => p.contributorName === CURRENT_USER_NAME).map((p) => p.id));
  return roots.filter((e) => mine.has(e.id));
}
