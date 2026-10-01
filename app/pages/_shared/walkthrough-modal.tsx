"use client";

import { useEffect, useState, type FC } from "react";
import { ArrowLeft, ArrowNarrowUpRight, ArrowRight, Check } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { Heading } from "react-aria-components";

// PARKED (1 Oct 2026): not used by any screen. The designer found the walkthrough unhelpful and its look poor, so the
// Projects list went back to no explainer; see the backlog in `.claude/rules/ref-shell.md` for what it was and what is
// open. Kept here so the work is not lost.
//
// The walkthrough modal: a short, stepped explanation of how something works, for a person who is new to it. One
// step at a time (an icon, a title, a line), step dots under it, Back and Next, and the close control in the corner.
// It takes no room on the screen it explains: it opens by itself the first time the screen loads, and a small help
// button on that screen opens it again. Documented at /patterns/banners.
//
// For the demo it opens on every page load: which walkthroughs have opened lives in this module, so moving between
// screens in a visit does not bring one back, and a reload does.
const opened = new Set<string>();

export interface WalkthroughStep {
  title: string;
  description: string;
  icon: FC<{ className?: string }>;
}

/** `[isOpen, setOpen]` for a walkthrough that opens itself once per page load, while `enabled`. */
export function useWalkthrough(id: string, enabled: boolean): [boolean, (open: boolean) => void] {
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled || opened.has(id)) return;
    opened.add(id);
    // After paint, so the screen is there behind the modal and the server and first client render match.
    const timer = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(timer);
  }, [id, enabled]);
  return [isOpen, setOpen];
}

export function WalkthroughModal({
  title,
  steps,
  isOpen,
  onOpenChange,
  action,
}: {
  /** The subject, e.g. "What is a project?": the small heading over each step and the dialog's name. */
  title: string;
  steps: WalkthroughStep[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** One link to more, on the last step. */
  action?: { label: string; href: string };
}) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  const Icon = step.icon;

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        onOpenChange(open);
        // Always start from the first step next time.
        if (!open) setIndex(0);
      }}
    >
      <Modal className="w-full sm:max-w-md">
        <Dialog aria-label={title} className="flex flex-col">
          <CloseButton theme="light" size="sm" className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4" />
          <div key={index} className="flex flex-col items-center gap-5 px-6 pt-8 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
            <FeaturedIcon icon={Icon} theme="modern" color="brand" size="lg" />
            <div className="flex flex-col gap-2">
              <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">
                {title} · {index + 1} of {steps.length}
              </p>
              <Heading slot="title" className="m-0! text-lg! font-semibold! tracking-normal! text-balance text-primary!">
                {step.title}
              </Heading>
              <p className="m-0 min-h-[60px] text-sm text-balance text-tertiary">{step.description}</p>
            </div>
            {last && action && (
              <Button color="link-color" size="sm" href={action.href} iconTrailing={ArrowNarrowUpRight} className="-mt-2">
                {action.label}
              </Button>
            )}
          </div>
          <Progress.MinimalIcons
            size="sm"
            className="mt-6"
            items={steps.map((s, i) => ({ title: s.title, status: i < index ? ("complete" as const) : i === index ? ("current" as const) : ("incomplete" as const) }))}
          />
          <div className="flex items-center justify-between gap-3 p-6 pt-6">
            {index > 0 ? (
              <Button color="secondary" iconLeading={ArrowLeft} onPress={() => setIndex(index - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {last ? (
              <Button color="primary" iconLeading={Check} onPress={() => onOpenChange(false)}>
                Done
              </Button>
            ) : (
              <Button color="primary" iconTrailing={ArrowRight} onPress={() => setIndex(index + 1)} autoFocus>
                Next
              </Button>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
