"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { useAllProjects } from "@/app/pages/_shared/created-projects-store";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";

// "Projects" in the breadcrumb of a project page and its record pages: a searchable switcher (the design
// system ComboBox) over the projects in the Projects list (A-Z, the same set that list shows), with the
// current one ticked and a "View all projects" bar to the list. Picking a project opens its page.
export function ProjectSwitcher({ currentProjectId }: { currentProjectId: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const all = useAllProjects();
  const items = useMemo(() => [...all].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ id: p.id, label: p.name, addon: p.code })), [all]);
  return (
    <BreadcrumbSwitcher
      label="Projects"
      ariaLabel="Switch project"
      placeholder="Search projects"
      items={items}
      currentId={currentProjectId}
      onSelect={(id) => router.push(roleHref(all.find((p) => p.id === id)?.href ?? projectDetailsPath(id)))}
      viewAllLabel="View all projects"
      onViewAll={() => router.push(roleHref("/pages/project-list"))}
    />
  );
}
