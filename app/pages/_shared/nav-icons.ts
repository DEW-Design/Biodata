import type { FC } from "react";
import { BarChart01, Bell01, SwitchHorizontal01, Database01, Dataflow03, Feather, FileCheck02, FileLock01, FileSearch01, Folder, HomeLine, Map01, Users01 } from "@untitledui/icons";
import { CTRL_VOCAB_SECTION_LABEL, DLA_SECTION_LABEL, DSA_SECTION_LABEL, NOTIFICATION_SECTION_LABEL, TAXONOMY_SECTION_LABEL, USER_MANAGEMENT_SECTION_LABEL, VOUCHER_SECTION_LABEL } from "@/lib/registered-user-nav";

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
  [USER_MANAGEMENT_SECTION_LABEL]: Users01,
  // The admin Home already draws Controlled Vocabulary with Database01: one icon per concept.
  [CTRL_VOCAB_SECTION_LABEL]: Database01,
  // A branching hierarchy: the taxonomy tree.
  [TAXONOMY_SECTION_LABEL]: Dataflow03,
  // The Figma draws no icon for it; a bell is the convention for notifications.
  [NOTIFICATION_SECTION_LABEL]: Bell01,
  // The Figma draws no icon for it; two opposing arrows for two records compared and reconciled.
  [VOUCHER_SECTION_LABEL]: SwitchHorizontal01,
};
