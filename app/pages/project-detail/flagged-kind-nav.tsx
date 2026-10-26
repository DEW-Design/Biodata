"use client";

import { Tabs } from "react-aria-components";
import { Columns03, Flag01 } from "@untitledui/icons";
import { Tab, TabList } from "@/components/application/tabs/tabs";

// The Flagged concepts page has two kinds of flagged concept (26 Oct 2026): values on records that are
// questionable, and custom concepts, columns an uploader added that BioData does not have. Column 2 switches
// between them the way All and My switch a list (`AgreementScopeNav`): a vertical switch with an icon on each
// item (3.11). It is a file of its own because it is a switch, not the form's tabs (4.1b).
export type FlaggedKind = "values" | "custom";

/** The page's two kinds in column 2, the way All and My are on the lists: a vertical switch with an icon on each. */
export function FlaggedKindNav({ kind, onChange, valuesOpen, customOpen }: { kind: FlaggedKind; onChange: (kind: FlaggedKind) => void; valuesOpen: number; customOpen: number }) {
  return (
    <Tabs orientation="vertical" selectedKey={kind} onSelectionChange={(key) => onChange(key as FlaggedKind)}>
      <TabList aria-label="Kinds of flagged concept" orientation="vertical" type="button-brand" fullWidth className="w-full">
        <Tab id="values" label="Questionable values" icon={Flag01} badge={valuesOpen} />
        <Tab id="custom" label="Custom concepts" icon={Columns03} badge={customOpen} />
      </TabList>
    </Tabs>
  );
}

