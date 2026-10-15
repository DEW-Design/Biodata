"use client";

import { createContext, useContext, type ReactNode } from "react";
import { VersionSwitcher } from "@/app/pages/_shared/version-switcher";

// Nominations has two versions, compared with the Version tool on the Prototype tools bar (VersionSwitcher):
//   1. /pages/nominations: nominations only. The panel accepts or rejects; nothing records how the species is treated.
//   3. /pages/nominations/version-3: a species or a location is nominated, each attribute and area with its reason; a BioData
//      Admin or Super Admin approves their own nomination at once, edits any submitted one, and sets the data release risk and
//      user access level of each thing protected (a Location by area), seen by those two roles only. The record page is
//      nomination-record-v3.tsx: what is protected as a table, Audit history. Version 2 (9 to 12 Oct 2026) was the step between;
//      it was deleted on 14 Oct 2026 (the designer: "get rid of version 2"), and version 3 keeps its number so links stay. Code
//      that tests `version >= 2` is version 3's behaviour.
// The routes of a version read their base path from here, so a row, the switcher, the Back link and the record's links stay
// in the version they started in. Each version has its own create and edit routes.

export type NominationVersion = 1 | 3;

export const NOMINATION_BASE: Record<NominationVersion, string> = { 1: "/pages/nominations", 3: "/pages/nominations/version-3" };

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
        { id: "3", label: "Version 3", description: "Species and locations, a reason per attribute; admins approve, edit and rate", href: href(3) },
      ]}
    />
  );
}
