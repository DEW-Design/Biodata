"use client";

// The project's add menu on the post-6-oct lab, first the bar's "+" and, from 22 Oct 2026, the top-right Add on a project's page (`ProjectAddButton` in shell.tsx) (the designer, 19 Oct 2026): Upload a dataset, a divider, Add an event, Add an occurrence, Add an observation (each opening its types, as the
// project's own "Add inside" menu does), a divider, then Add an attachment. The lab's own copy of the part of the product's `ActionsMenu` it needs (its submenu of types, drawn from the same
// `childOptions` and the same record icons), so that nothing of this lab sits in production code (the designer, 19 Oct 2026: "post-6-oct stuff should sit only on the /proto route without being
// rolled into production"); `ActionsMenu` is as it was. A copy of product code by the designer's instruction: CONTRACTS 1.6 and 0.9 are overridden for this lab only (logged in
// context/decisions, 19 Oct 2026). Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type { FC, ReactNode } from "react";
import { SubmenuTrigger, type Key } from "react-aria-components";
import { Activity, Eye, Paperclip, Target05, Upload01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { recordIcon } from "@/app/pages/project-detail/record-inspector";
import { childOptions, type ChildOption } from "@/app/pages/project-detail/record-rules";
import type { RecordKind, SurveyRecord } from "@/app/pages/project-detail/survey-data";

const KINDS: { kind: RecordKind; label: string; icon: FC<{ className?: string }> }[] = [
  { kind: "event", label: "Add an event", icon: Activity },
  { kind: "occurrence", label: "Add an occurrence", icon: Target05 },
  { kind: "observation", label: "Add an observation", icon: Eye },
];

// What can be added directly under a project: every event type, occurrence and observation (the product's `childOptions` for the project itself).
const OPTIONS = childOptions(null, []);

export function ProjectAddMenu({ trigger, onUpload, onAdd, onAttach }: { trigger: ReactNode; onUpload: () => void; onAdd: (option: ChildOption) => void; onAttach: () => void }) {
  const pick = (key: Key) => {
    const option = OPTIONS.find((o) => `${o.kind}:${o.type}` === key);
    if (option) onAdd(option);
  };
  return (
    <Dropdown.Root>
      {trigger}
      <Dropdown.Popover placement="bottom right" className="w-60">
        <Dropdown.Menu
          aria-label="Add"
          onAction={(key) => {
            if (key === "upload") onUpload();
            else if (key === "attach") onAttach();
          }}
        >
          <Dropdown.Section>
            <Dropdown.Item id="upload" label="Upload a dataset" icon={Upload01} />
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Section>
            {KINDS.map((k) => (
              <SubmenuTrigger key={k.kind}>
                <Dropdown.Item id={`kind:${k.kind}`} label={k.label} icon={k.icon} />
                <Dropdown.Popover placement="end top" className="w-52">
                  <Dropdown.Menu aria-label={k.label} onAction={pick}>
                    {OPTIONS.filter((o) => o.kind === k.kind).map((o) => (
                      <Dropdown.Item key={`${o.kind}:${o.type}`} id={`${o.kind}:${o.type}`} label={o.type} icon={recordIcon({ kind: o.kind, type: o.type as SurveyRecord["type"] })} />
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </SubmenuTrigger>
            ))}
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Section>
            <Dropdown.Item id="attach" label="Add an attachment" icon={Paperclip} />
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
