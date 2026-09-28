"use client";

import { useRouter } from "next/navigation";
import { Columns03 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/pages/_shared/prototype-tools/tools";
import { useRoleHref } from "@/lib/use-role-href";

// Compare layout options on a screen that has competing layouts (see CONTEXT.md, "Exploratory page
// layouts"). It puts a "Layout" tool on the Prototype tools bar ("Layout Option 2 of 2") rather than
// drawing its own button, so only screens with options to compare show it. Picking an option opens
// that layout's route, keeping the role.

export interface LayoutOption {
  id: string;
  /** "Option 1". */
  label: string;
  /** One line on what the option is, when there's a useful one. */
  description?: string;
  href: string;
}

export function LayoutOptionSwitcher({ ariaLabel, options, current }: { ariaLabel: string; options: LayoutOption[]; current: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const index = Math.max(0, options.findIndex((o) => o.id === current));

  useRegisterTool({
    id: "layout",
    label: ariaLabel,
    barLabel: "Layout",
    barValue: `Option ${index + 1} of ${options.length}`,
    icon: Columns03,
    options: options.map(({ id, label, description }) => ({ id, label, description })),
    value: current,
    onChange: (id) => {
      const option = options.find((o) => o.id === id);
      if (option) router.push(roleHref(option.href));
    },
  });

  return null;
}
