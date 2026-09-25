import type { FC } from "react";
import { BarChart01, Feather, FileCheck02, FileLock01, FileSearch01, Folder, HomeLine, Map01 } from "@untitledui/icons";
import { DLA_SECTION_LABEL, DSA_SECTION_LABEL } from "@/lib/registered-user-nav";

// The one icon per primary-nav section, for the icon rail and the mobile menu on every screen.
// Adding a section to `lib/registered-user-nav.ts` means adding its icon here, once - never a
// per-screen map (they had drifted: two screens had no icon for the DSA rail item).
export const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  [DLA_SECTION_LABEL]: FileLock01,
  [DSA_SECTION_LABEL]: FileCheck02,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};
