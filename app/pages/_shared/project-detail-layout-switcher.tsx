"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two project detail layouts being compared. The floating control itself is the
// shared `LayoutOptionSwitcher` (stacked above the role switcher, bottom-right).
export type ProjectDetailLayout = "option-1" | "option-2";

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", href: "/pages/project-detail" },
  { id: "option-2", label: "Option 2", href: "/pages/project-detail/option-3" },
];

export function ProjectDetailLayoutSwitcher({ current }: { current: ProjectDetailLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Compare project detail layouts" options={LAYOUT_OPTIONS} current={current} />;
}
