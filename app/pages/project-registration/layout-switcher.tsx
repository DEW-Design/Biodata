"use client";

import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two Add Project layouts being compared (30 Oct 2026): the form as it is, with its sections in column 2
// (Option 1, where every "Add project" leads), and the same form with a Datasets step after the geographic extent (Option 2), which the
// business is considering. Option 1 is not changed by the comparison (4.4).
export type RegistrationLayout = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "As it is today", href: "/pages/project-registration" },
  { id: "option-2", label: "Option 2", description: "With dataset upload", href: "/pages/project-registration/option-2" },
];

export function RegistrationLayoutSwitcher({ current }: { current: RegistrationLayout }) {
  return <LayoutOptionSwitcher ariaLabel="Add Project layout to show" options={OPTIONS} current={current} />;
}
