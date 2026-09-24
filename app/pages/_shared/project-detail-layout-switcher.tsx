"use client";

import { useRouter } from "next/navigation";
import { Button as AriaButton } from "react-aria-components";
import { Columns03 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useRoleHref } from "@/lib/use-role-href";

// Floating panel to jump between the two project detail layouts being compared. Same FAB +
// Dropdown pattern as `RoleSwitcher` (bottom-right) - placed bottom-left, and above Next's own
// dev-mode badge, so the two floating panels never overlap. `Dropdown.Root` accepts any trigger,
// so the FAB opens the menu directly: one click to open, one to pick.
export type ProjectDetailLayout = "option-1" | "option-2";

const LAYOUT_OPTIONS: { id: ProjectDetailLayout; label: string; href: string }[] = [
  { id: "option-1", label: "Option 1", href: "/pages/project-detail" },
  { id: "option-2", label: "Option 2", href: "/pages/project-detail/option-3" },
];

export function ProjectDetailLayoutSwitcher({ current }: { current: ProjectDetailLayout }) {
  const router = useRouter();
  const roleHref = useRoleHref();

  return (
    <div className="fixed bottom-24 left-5 z-50">
      <Dropdown.Root>
        <AriaButton
          aria-label="Compare project detail layouts"
          className="flex size-12 items-center justify-center rounded-full bg-primary-solid text-white shadow-lg outline-brand transition duration-100 ease-linear hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.96]"
        >
          <Columns03 className="size-5" />
        </AriaButton>
        <Dropdown.Popover placement="top left">
          <Dropdown.Menu
            aria-label="Compare layouts"
            selectionMode="single"
            selectedKeys={[current]}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const [id] = Array.from(keys) as string[];
              const option = LAYOUT_OPTIONS.find((o) => o.id === id);
              if (option && option.id !== current) router.push(roleHref(option.href));
            }}
          >
            {LAYOUT_OPTIONS.map((option) => (
              <Dropdown.Item
                key={option.id}
                id={option.id}
                label={option.id === current ? `${option.label} (this page)` : option.label}
              />
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </div>
  );
}
