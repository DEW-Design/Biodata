"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Progress } from "@/components/application/progress-steps/progress-steps";

// Column 2 of every form (CONTRACTS.md 4.1): the whole form as one list of sections, so a person
// always sees where they are, what is done and what still needs attention, and can jump to any
// section - not a tab strip, and not a stepper that only moves forward. Add Project, DSA and DLA
// all render this, built from the real vertical Progress steps component.

export type SectionStatus = "current" | "complete" | "error" | "pending";

export interface FormSectionItem {
  id: string;
  title: string;
  status: SectionStatus;
  /** Small text after the title, e.g. "3 to fix". */
  detail?: string;
}

export interface FormSectionGroup {
  /** The step number and title shown above its sections. Omit for a flat list. */
  step?: number;
  title?: string;
  sections: FormSectionItem[];
}

/** How a section's state is derived, shared so every form means the same thing by each icon. */
export function deriveSectionStatus({ isCurrent, isValid, visited, attempted }: { isCurrent: boolean; isValid: boolean; visited: boolean; attempted: boolean }): SectionStatus {
  if (isCurrent) return "current";
  if (attempted && !isValid) return "error";
  if (visited && isValid) return "complete";
  return "pending";
}

export function FormSectionList({
  heading,
  groups,
  closing,
  onSelect,
  progress,
}: {
  heading: string;
  groups: FormSectionGroup[];
  /** A last section set apart by a rule, usually "Review and create". */
  closing?: FormSectionItem;
  onSelect: (id: string) => void;
  progress: { done: number; total: number };
}) {
  // Each group is one vertical `Progress.IconsWithText` (the real progress steps component), so the
  // connector runs within a step's sections. Every step is a button: any section can be opened.
  const toSteps = (sections: FormSectionItem[]) =>
    sections.map((item) => ({
      title: item.title,
      description: item.detail,
      status: (item.status === "current" ? "current" : item.status === "complete" ? "complete" : "incomplete") as "current" | "complete" | "incomplete",
      error: item.status === "error",
      onClick: () => onSelect(item.id),
    }));

  // Numbers keep counting across groups (1, 2, 3 ... then the closing step), not restart per group.
  const numberedBefore = (groupIndex: number) => groups.slice(0, groupIndex).reduce((n, g) => n + g.sections.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{heading}</p>
        <div className="flex flex-col gap-2 px-1">
          <ProgressBarBase value={progress.done} max={Math.max(1, progress.total)} />
          <p className="text-xs text-tertiary">
            {progress.done} of {progress.total} sections complete
          </p>
        </div>
      </div>
      {groups.map((group, i) => (
        <div key={group.step ?? i} className="flex flex-col gap-3 px-1">
          {group.title && (
            <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">{group.title}</p>
          )}
          <Progress.IconsWithText items={toSteps(group.sections)} type="number" orientation="vertical" size="sm" startAt={numberedBefore(i) + 1} />
        </div>
      ))}
      {closing && (
        <div className="border-t border-secondary px-1 pt-4">
          <Progress.IconsWithText items={toSteps([closing])} type="number" orientation="vertical" size="sm" connector={false} startAt={numberedBefore(groups.length) + 1} />
        </div>
      )}
    </div>
  );
}

// A form lives in the main column but its section list belongs in column 2, which the shell owns.
// The shell provides its column-2 element through this context; `FormSidebar` renders into it.
export const FormSidebarSlotContext = createContext<HTMLElement | null>(null);

export function FormSidebar({ children }: { children: ReactNode }) {
  const slot = useContext(FormSidebarSlotContext);
  return slot ? createPortal(children, slot) : null;
}
