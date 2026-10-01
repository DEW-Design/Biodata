"use client";

import { useState, type FC } from "react";
import { ArrowNarrowUpRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Progress } from "@/components/application/progress-steps/progress-steps";

// The explainer card: information about how a screen's subject works, above the list it belongs to (never in column 2,
// which is navigation and actions only, contract 3.10). A bordered card with a small heading, an optional one-line lead,
// and the subject laid out as a row of steps: numbered when it is a sequence ("How a nomination is reviewed"), or with an
// icon each when it is a structure. It is for the short ones; a longer explanation, or one on a dense list, is a
// `WalkthroughModal` (what a project is moved there: the card took too much of the list). Documented at /patterns/banners.
//
// It can be closed, and for the demo it comes back on every refresh: the closed state lives in this module, so it
// survives moving between screens in a visit (switching from All projects to My projects does not bring it back) and is
// gone when the page is reloaded.
const closed = new Set<string>();

export interface ExplainerStep {
  title: string;
  description: string;
  /** Required when the card's steps carry icons (`stepType="featured-icon"`). */
  icon?: FC<{ className?: string }>;
}

export function ExplainerCard({
  id,
  title,
  lead,
  steps,
  stepType = "number",
  action,
  dismissible = true,
}: {
  /** Names the card for the closed state, and is its accessible name when there is no title. */
  id: string;
  title: string;
  lead?: string;
  steps: ExplainerStep[];
  stepType?: "number" | "featured-icon";
  /** One link to more, e.g. the guides. */
  action?: { label: string; href: string };
  dismissible?: boolean;
}) {
  const [open, setOpen] = useState(() => !closed.has(id));
  if (!open) return null;

  const items = steps.map((step) => ({ ...step, status: "incomplete" as const }));
  // The stepper fades an "incomplete" step's text to 60% (2.4:1 on white for the description, under the 4.5:1 a reader
  // needs). These steps are not progress, only a list, so the text is restored to full strength; the icon and number
  // keep their quiet "not started" grey, and the title (semibold, secondary) over the description (regular, tertiary)
  // keeps the hierarchy.
  const steady = "[&_.opacity-60]:opacity-100";
  return (
    <section aria-label={title} className="relative shrink-0 rounded-lg border border-secondary p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">{title}</p>
          {lead && <p className="m-0 max-w-2xl text-sm text-balance text-tertiary">{lead}</p>}
        </div>
        <div className="-mt-1.5 -mr-1.5 flex shrink-0 items-center gap-1">
          {action && (
            <Button color="link-color" size="sm" href={action.href} iconTrailing={ArrowNarrowUpRight}>
              {action.label}
            </Button>
          )}
          {dismissible && (
            <CloseButton
              size="xs"
              label="Dismiss"
              slot={null}
              onPress={() => {
                closed.add(id);
                setOpen(false);
              }}
            />
          )}
        </div>
      </div>
      {stepType === "featured-icon" ? (
        <Progress.IconsWithText type="featured-icon" orientation="horizontal" size="sm" className={steady} items={items.map((item) => ({ ...item, icon: item.icon! }))} />
      ) : (
        <Progress.IconsWithText type="number" orientation="horizontal" size="sm" className={steady} items={items} />
      )}
    </section>
  );
}
