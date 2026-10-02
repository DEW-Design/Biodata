"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two project detail layouts being compared. It adds a Layout tool to the
// Prototype tools bar (`LayoutOptionSwitcher`).
//
// Sept 30 2026: a same-day Option 3 (Project at a glance as a Datasets card and a records card) was
// approved and moved into Option 1, then retired. Sept 30 2026: Option 1 became the project page template for every project (project-detail-template.tsx);
// Option 2 stays on its own route for comparison and is reached from this switcher. Option 3 (About, Records and Species) removed per direct instruction, ahead of
// merging sai-wips into main - down to the two real directions. Sept 29 2026: rolled in from
// bc8ad0fb (the "v3 records" rewrite) and swapped with the canonical Adelaide Hills page per direct
// instruction, so ids now match their real folder/route names one to one: Option 1 is the v3
// rewrite at the canonical route, Option 2 is Adelaide Hills (relocated to the option-2 slot).
export type ProjectDetailLayout = "option-1" | "option-2";

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "Project records (v3): tree/table, species, flagged concepts", href: "/pages/project-detail" },
  { id: "option-2", label: "Option 2", description: "Tabs with the records tree (Adelaide Hills)", href: "/pages/project-detail/option-2" },
];

export function ProjectDetailLayoutSwitcher({ current }: { current: ProjectDetailLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Project page layout to show" options={LAYOUT_OPTIONS} current={current} />;
}
