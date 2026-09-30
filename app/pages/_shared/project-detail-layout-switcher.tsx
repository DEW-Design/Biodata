"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the three project detail layouts being compared. It adds a Layout tool to the
// Prototype tools bar (`LayoutOptionSwitcher`).
//
// Sept 29 2026: rolled in from bc8ad0fb (the "v3 records" rewrite) and swapped with the canonical
// Adelaide Hills page per direct instruction, so ids now match their real folder/route names one to
// one: Option 1 is the v3 rewrite at the canonical route, Option 2 is Adelaide Hills (relocated to
// the option-2 slot), Option 3 is unchanged. This also fixes a stale indirection the switcher used to
// have - its own "option-2" id pointed at the option-3 route rather than the option-2 folder.
export type ProjectDetailLayout = "option-1" | "option-2" | "option-3";

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "Survey records (v3): tree/table, species, flagged concepts", href: "/pages/project-detail" },
  { id: "option-2", label: "Option 2", description: "Tabs with the records tree (Adelaide Hills)", href: "/pages/project-detail/option-2" },
  { id: "option-3", label: "Option 3", description: "About, Records and Species", href: "/pages/project-detail/option-3" },
];

export function ProjectDetailLayoutSwitcher({ current }: { current: ProjectDetailLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Project page layout to show" options={LAYOUT_OPTIONS} current={current} />;
}
