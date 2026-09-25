"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileCheck02, FileLock01, Folder, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { createMenuItemsForRole, type CreateItemId } from "@/lib/create-menu";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// The header's single "Add" button (Jira-style "+ Create"): one control that opens the things this
// persona can create - a project, a DLA request, a DSA - instead of a separate button per thing.
// What appears comes from `lib/create-menu.ts` and the role-access matrix. A guest keeps the
// visible-but-gated rule: the same button, and clicking it opens the sign-up invite.
const itemIcons: Record<CreateItemId, FC<{ className?: string }>> = {
  project: Folder,
  dla: FileLock01,
  dsa: FileCheck02,
};

export function CreateMenu() {
  const role = useUserRole();
  const router = useRouter();
  const roleHref = useRoleHref();
  const [signUpOpen, setSignUpOpen] = useState(false);

  if (role === "public-user") {
    return (
      <>
        <Button color="primary" iconLeading={Plus} onClick={() => setSignUpOpen(true)}>
          Add
        </Button>
        <SignUpPromptModal
          isOpen={signUpOpen}
          onOpenChange={setSignUpOpen}
          icon={Plus}
          title="Sign up to add to BioData SA"
          description="Create a free BioData SA account to add projects and request data licences for South Australia's biodiversity record."
        />
      </>
    );
  }

  const items = createMenuItemsForRole(role);
  return (
    <Dropdown.Root>
      <Button color="primary" iconLeading={Plus} iconTrailing={ChevronDown} aria-label="Add">
        Add
      </Button>
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu aria-label="Add" onAction={(key) => {
          const item = items.find((i) => i.id === key);
          if (item) router.push(roleHref(item.href));
        }}>
          {items.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} icon={itemIcons[item.id]} label={item.label} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
