"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two project detail layouts being compared. It adds a Layout tool to the Prototype
// tools bar (`LayoutOptionSwitcher`).
export type ProjectDetailLayout = "option-1" | "option-2";

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "Tabs with the records tree", href: "/pages/project-detail" },
  { id: "option-2", label: "Option 2", description: "About, Records and Species", href: "/pages/project-detail/option-3" },
];

export function ProjectDetailLayoutSwitcher({ current }: { current: ProjectDetailLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Project page layout to show" options={LAYOUT_OPTIONS} current={current} />;
}
