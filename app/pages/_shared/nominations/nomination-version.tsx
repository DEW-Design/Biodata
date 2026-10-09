"use client";

import { createContext, useContext, type ReactNode } from "react";
import { VersionSwitcher } from "@/app/pages/_shared/version-switcher";

// Nominations has two versions, compared with the Version tool on the Prototype tools bar (VersionSwitcher):
//   1. /pages/nominations: nominations only. The panel accepts or rejects; nothing records how the species is treated.
//   2. /pages/nominations/version-2 (the designer, 9 Oct 2026): the same nominations, and for the BioData Super Admin a
//      "Species sensitivity" item in column 2: a configuration of every species' data release risk and user access level,
//      for the whole species or some of its attributes (species-sensitivity-list.tsx, species-sensitivity-record.tsx). The
//      nominations themselves are unchanged. Every other role sees version 1's screens.
// The routes of a version read their base path from here, so a row, the switcher, the Back link and the record's links stay
// in the version they started in. Create and edit are version 1's routes in both.

export type NominationVersion = 1 | 2;

export const NOMINATION_BASE: Record<NominationVersion, string> = { 1: "/pages/nominations", 2: "/pages/nominations/version-2" };
export const SENSITIVITY_PATH = `${NOMINATION_BASE[2]}/species-sensitivity`;

const VersionContext = createContext<NominationVersion>(1);

export function NominationVersionProvider({ version, children }: { version: NominationVersion; children: ReactNode }) {
  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

export function useNominationVersion(): { version: NominationVersion; base: string } {
  const version = useContext(VersionContext);
  return { version, base: NOMINATION_BASE[version] };
}

/** The Version tool. On a record it opens the same nomination in the other version; elsewhere, the other version's list. */
export function NominationVersionTool({ recordId }: { recordId?: string }) {
  const { version } = useNominationVersion();
  const href = (v: NominationVersion) => (recordId ? `${NOMINATION_BASE[v]}/${recordId}` : NOMINATION_BASE[v]);
  return (
    <VersionSwitcher
      label="Nominations version to show"
      current={String(version)}
      options={[
        { id: "1", label: "Version 1", description: "Nominations only: the panel accepts or rejects", href: href(1) },
        { id: "2", label: "Version 2", description: "Super Admin configures each species' release risk and access level", href: href(2) },
      ]}
    />
  );
}
