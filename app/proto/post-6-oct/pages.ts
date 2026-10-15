// What a tab shows, and the helpers that name it. In a file of their own so the shell and the nested rail (nested-rail.tsx) both
// read them. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { SectionKey } from "./sections";

/** What a tab shows: a rail section's list, one project, or Search. A tab keeps its own page; moving replaces it (everything happens in one tab unless a tab is opened). */
export type Page = { kind: "section"; section: SectionKey; statuses?: string[] } | { kind: "project"; projectId: string } | { kind: "search" };

export interface LabTab {
  id: string;
  page: Page;
}

export const sectionPage = (section: SectionKey, statuses?: string[]): Page => ({ kind: "section", section, statuses });
export const projectPage = (projectId: string): Page => ({ kind: "project", projectId });
export const searchPage: Page = { kind: "search" };

/** Which page it is, for keeping a view (the pill's choice) per tab and page. */
export const pageKey = (page: Page) => (page.kind === "section" ? `section:${page.section}` : page.kind === "project" ? `project:${page.projectId}` : "search");
