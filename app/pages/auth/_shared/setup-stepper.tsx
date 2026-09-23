"use client";

import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

// Matches the Figma "Setup your Profile" progress steps (nodes 49:799 / 62:799 / 65:3164) - 3
// steps connected by a line, each complete (filled brand circle + check) / current (outline ring)
// / incomplete (plain outline circle). No DEW stepper component exists yet - composed from real
// tokens, same "structural shell, not a contained widget" precedent as the Accordion-wrapped
// sections in /test-site-details (see CONTEXT.md's "Generated screens" section).
const STEPS = ["Your details", "Organisation details", "Privacy & Terms of Use"] as const;

export function SetupStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative flex items-start justify-center gap-4">
        <div className="absolute top-3 right-[16.5%] left-[16.5%] h-px bg-[var(--ui-border-secondary)]" />
        {STEPS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div key={label} className="relative flex flex-1 flex-col items-center gap-3">
              <span
                className={cx(
                  "flex size-6 items-center justify-center rounded-full bg-primary",
                  isComplete && "bg-brand-solid text-white",
                  isCurrent && "ring-2 ring-brand-solid",
                  !isComplete && !isCurrent && "border border-primary text-transparent",
                )}
              >
                {isComplete ? <Check className="size-3" strokeWidth={3} /> : <span className={cx("size-2 rounded-full", isCurrent && "bg-brand-solid")} />}
              </span>
              <p className={cx("text-center text-sm font-semibold", isCurrent ? "text-brand-secondary" : "text-secondary")}>{label}</p>
            </div>
          );
        })}
      </div>
      <div className="h-px w-full bg-[var(--ui-border-secondary)]" />
    </div>
  );
}
