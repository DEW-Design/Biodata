"use client";

import { useRouter } from "next/navigation";
import { GitBranch01 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { useRoleHref } from "@/lib/use-role-href";

// Compare versions of one layout option: the same screen before and after a round of changes, each on its own route.
// It puts a "Version" tool on the Prototype tools bar, beside Layout ("Version 2 of 2"), rather than drawing its own
// button (CONTRACTS 3.8), so only a screen with versions shows it. Picking a version opens its route, keeping the role.
// A layout option is a different direction (LayoutOptionSwitcher); a version is the same direction, revised.

export interface VersionOption {
  id: string;
  /** "Version 1". */
  label: string;
  /** One line on what the version is, when there's a useful one. */
  description?: string;
  href: string;
}

export function VersionSwitcher({ label, options, current }: { label: string; options: VersionOption[]; current: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const index = Math.max(0, options.findIndex((o) => o.id === current));

  useRegisterTool({
    id: "version",
    label,
    barLabel: "Version",
    barValue: `${index + 1} of ${options.length}`,
    icon: GitBranch01,
    options: options.map(({ id, label, description }) => ({ id, label, description })),
    value: current,
    onChange: (id) => {
      const option = options.find((o) => o.id === id);
      if (option) router.push(roleHref(option.href));
    },
  });

  return null;
}
