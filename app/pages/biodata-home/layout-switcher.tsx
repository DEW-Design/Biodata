"use client";

import { Suspense } from "react";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two home pages. Option 1 is the home page in the DEW homepage template the marketing team
// approved; option 2 (version-2) is the original BioData home page, with the same content. The home page has no app shell, so
// it mounts the Prototype tools bar itself, with the Layout tool on it.
export type HomeLayoutOption = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "In the approved DEW template", href: "/pages/biodata-home" },
  { id: "option-2", label: "Option 2", description: "The original home page", href: "/pages/biodata-home/version-2" },
];

// The bar and the switcher read the role from the URL (useSearchParams), so they sit in their own Suspense
// boundary: the static export needs one around anything that does.
export function HomeLayoutTools({ current }: { current: HomeLayoutOption }) {
  return (
    <Suspense fallback={null}>
      <PrototypeTools />
      <LayoutOptionSwitcher ariaLabel="Home page layout to show" options={OPTIONS} current={current} />
    </Suspense>
  );
}
