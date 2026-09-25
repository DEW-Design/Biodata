"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two Add Project layouts being compared: the one-question-at-a-time flow (Option
// 1) and the three-column layout with a section list beside the form (Option 2).
export type RegistrationLayout = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", href: "/pages/project-registration" },
  { id: "option-2", label: "Option 2", href: "/pages/project-registration/option-2" },
];

export function RegistrationLayoutSwitcher({ current }: { current: RegistrationLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Compare Add Project layouts" options={OPTIONS} current={current} />;
}
