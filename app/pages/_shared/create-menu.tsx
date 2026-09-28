"use client";

import { useState, type FC } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Feather, FileCheck02, FileLock01, Folder, Plus, Upload01, UserPlus01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ChooseProjectModal } from "@/app/pages/_shared/dataset-upload/choose-project-modal";
import { createMenuItemsForRole, type CreateItemId } from "@/lib/create-menu";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// The header's single "Add" button (Jira-style "+ Create"): one control that opens the things this
// persona can create - a project, a DLA request, a DSA - instead of a separate button per thing.
// What appears comes from `lib/create-menu.ts` and the role-access matrix.
//
// A guest gets nothing here, not a visible-but-gated button - reversed per direct feedback back to
// the earlier "hidden outright" behaviour (the same button + sign-up-invite version was tried and
// is now reverted a second time). Since AppHeader is the one shared header every screen renders
// (CONTRACTS.md 3.1-3.5), this hides it for public-user everywhere, not just Explore.
const itemIcons: Record<CreateItemId, FC<{ className?: string }>> = {
  project: Folder,
  dataset: Upload01,
  dla: FileLock01,
  nomination: Feather,
  dsa: FileCheck02,
  user: UserPlus01,
};

export function CreateMenu() {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const pathname = usePathname();
  const [chooseProject, setChooseProject] = useState(false);

  if (role === "public-user") return null;

  const items = createMenuItemsForRole(role);
  // On a project's own pages (/pages/project-list/<id>/...) that project is already the answer to
  // "which project is this dataset for?".
  // Adelaide Hills' own page is /pages/project-detail.
  const currentProjectId = pathname === "/pages/project-detail" ? "adelaide-hills" : pathname.match(/^\/pages\/project-list\/([^/]+)\//)?.[1];
  return (
    <>
      <Dropdown.Root>
        <Button color="primary" iconLeading={Plus} iconTrailing={ChevronDown} aria-label="Add">
          Add
        </Button>
        <Dropdown.Popover placement="bottom right">
          <Dropdown.Menu
            aria-label="Add"
            onAction={(key) => {
              const item = items.find((i) => i.id === key);
              if (!item) return;
              if (item.id === "dataset") setChooseProject(true);
              else if (item.href) router.push(roleHref(item.href));
            }}
          >
            {items.map((item) => (
              <Dropdown.Item key={item.id} id={item.id} icon={itemIcons[item.id]} label={item.label} />
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
      {/* Keyed on the current project so a fresh open on another project starts with that one. */}
      <ChooseProjectModal key={currentProjectId ?? "none"} isOpen={chooseProject} onOpenChange={setChooseProject} defaultProjectId={currentProjectId} />
    </>
  );
}
