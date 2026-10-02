"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { projects, type Project } from "@/app/pages/_shared/project-list-data";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { deserializeForm, serializeForm } from "@/app/pages/project-registration/form-storage";
import type { FormState } from "@/app/pages/project-registration/option-2/sections";

// The projects created in this browser through Add Project, kept in localStorage (the same plumbing as
// the other stores here; there is no backend). Each is the form exactly as it was submitted, as text
// (form-storage.ts), plus an id, a project number and who and when. The project page (reached at
// /pages/project-detail/created?project=<id>, a fixed route because a static export cannot make a page
// for an id that does not exist until someone creates it) and the Projects list read it from here.
//
// Only the Projects list, its switcher and the project page know about these. The other places that read
// the built-in projects (the header search, DLA, the reports, Explore) are untouched.

export interface CreatedProject {
  id: string;
  /** The project's number, e.g. BD-5103. Continues from the highest one in use. */
  code: string;
  createdAt: string;
  createdBy: string;
  /** The submitted form, serialised (form-storage.ts). */
  formJson: string;
}

interface CreatedProjectsState {
  created: CreatedProject[];
}

const useStore = create<CreatedProjectsState>()(
  persist(() => ({ created: [] as CreatedProject[] }), {
    name: "biodata-created-projects",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

const numberOf = (code: string) => Number(code.replace(/\D/g, "")) || 0;

/** Saves a submitted Add Project form as a new project and returns it. */
export function saveCreatedProject(form: FormState): CreatedProject {
  // Read what is already in localStorage first, so a project created in another tab is not overwritten.
  if (!useStore.persist.hasHydrated()) useStore.persist.rehydrate();
  const existing = useStore.getState().created;
  const next = Math.max(0, ...projects.map((p) => numberOf(p.code)), ...existing.map((c) => numberOf(c.code))) + 1;
  const code = `BD-${next}`;
  const project: CreatedProject = {
    id: `new-${code.toLowerCase()}`,
    code,
    createdAt: new Date().toISOString(),
    createdBy: CURRENT_USER_NAME,
    formJson: serializeForm(form),
  };
  useStore.setState({ created: [...existing, project] });
  return project;
}

export function useCreatedProjects(): CreatedProject[] {
  useRehydrate(useStore);
  return useStore((s) => s.created);
}

/** One created project by id, and whether localStorage has been read yet (before that it looks missing). */
export function useCreatedProject(id: string | null): { project: CreatedProject | undefined; hydrated: boolean } {
  useRehydrate(useStore);
  const hydrated = useHydrated(useStore);
  const created = useStore((s) => s.created);
  return { project: id ? created.find((c) => c.id === id) : undefined, hydrated };
}

export function createdProjectForm(project: CreatedProject): FormState {
  return deserializeForm(project.formJson);
}

/** Where a created project's page is (before the role is added). */
export function createdProjectHref(id: string): string {
  return `/pages/project-detail/created?project=${encodeURIComponent(id)}`;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** A created project as a row of the Projects list. */
export function createdProjectRow(c: CreatedProject): Project {
  const { details } = createdProjectForm(c);
  const org = details.dataOwnerType === "organisation" ? details.dataOwnerOrgName : `${details.dataOwnerContacts[0]?.firstName ?? ""} ${details.dataOwnerContacts[0]?.lastName ?? ""}`.trim();
  return {
    id: c.id,
    code: c.code,
    name: details.shortTitle,
    href: createdProjectHref(c.id),
    org,
    status: "Active",
    statusColor: "success",
    contributorInitials: initialsOf(c.createdBy),
    contributorName: c.createdBy,
    updated: "Today",
    description: details.abstract,
  };
}

/** The built-in projects followed by the ones created in this browser, newest last. */
export function useAllProjects(): Project[] {
  const created = useCreatedProjects();
  return useMemo(() => [...projects, ...created.map(createdProjectRow)], [created]);
}
