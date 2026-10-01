"use client";

// Column 2 of the Projects list and of project detail: one shared column, so the two read the same.
// A scope switcher (All projects / My projects, the same vertical tabs as the DLA and DSA lists'
// All requests / My requests) and the Actions group. What a project is, and the guides, sit above the list (`ExplainerCard`):
// column 2 is navigation and actions only (CONTRACTS 3.10).
//
// The scope lives in the Projects list's URL (`?scope=mine|all`). On project detail the switcher
// shows which list the project belongs to, and picking a scope opens the list in that scope.
// A public user has no projects of their own, so they see All projects only.

import { Folder, User01 } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { ProjectActions } from "@/app/pages/_shared/project-actions";
import { useUserRole } from "@/lib/use-user-role";

export type ProjectScope = "mine" | "all";

export function readProjectScope(value: string | null): ProjectScope {
  return value === "mine" ? "mine" : "all";
}

export function ProjectsSidebar({
  scope,
  onScopeChange,
  sectionLabel = "Projects",
}: {
  scope: ProjectScope;
  onScopeChange: (scope: ProjectScope) => void;
  sectionLabel?: string;
}) {
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  return (
    <aside
      aria-label="Section"
      className="hidden w-[286px] shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex"
    >
      <div className="flex flex-col">
        <Tabs
          orientation="vertical"
          selectedKey={isPublicUser ? "all" : scope}
          onSelectionChange={(key) =>
            onScopeChange(readProjectScope(String(key)))
          }
          className="flex flex-col gap-1"
        >
          <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
            {sectionLabel}
          </p>
          <TabList
            aria-label="Which projects"
            orientation="vertical"
            type="button-brand"
            fullWidth
            className="w-full"
          >
            <Tab id="all" label="All projects" icon={Folder} />
            {!isPublicUser && (
              <Tab id="mine" label="My projects" icon={User01} />
            )}
          </TabList>
          <ProjectActions sameForEveryone />
        </Tabs>
      </div>
    </aside>
  );
}
