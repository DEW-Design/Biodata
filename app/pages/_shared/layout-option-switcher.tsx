"use client";

import { useRouter } from "next/navigation";
import { Columns03 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { FloatingMenuFab } from "@/app/pages/_shared/floating-fab";
import { useRoleHref } from "@/lib/use-role-href";

// The floating "compare options" control for any screen that has competing layouts (see
// CONTEXT.md, "Exploratory page layouts"). A draggable `FloatingMenuFab` like `RoleSwitcher`; by
// default it sits directly above it in the bottom-right corner, clear of a page's footer bar.
// `Dropdown.Root` accepts any trigger, so the FAB opens the menu directly: one click to open, one
// to pick.

export interface LayoutOption {
  id: string;
  label: string;
  href: string;
}

export function LayoutOptionSwitcher({ ariaLabel, options, current }: { ariaLabel: string; options: LayoutOption[]; current: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <FloatingMenuFab storageKey="layout-options" defaultPosition={{ right: 20, bottom: 148 }} ariaLabel={ariaLabel} icon={Columns03}>
      <Dropdown.Menu
        aria-label={ariaLabel}
        selectionMode="single"
        selectedKeys={[current]}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const [id] = Array.from(keys) as string[];
          const option = options.find((o) => o.id === id);
          if (option && option.id !== current) router.push(roleHref(option.href));
        }}
      >
        {options.map((option) => (
          <Dropdown.Item key={option.id} id={option.id} label={option.id === current ? `${option.label} (this page)` : option.label} />
        ))}
      </Dropdown.Menu>
    </FloatingMenuFab>
  );
}
