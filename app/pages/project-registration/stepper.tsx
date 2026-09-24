"use client";

// The 3-step progress header at the top of the wizard - shown on every step, all 3 titles/
// descriptions visible at once (matching the Figma wireframe, where all 3 step headings/
// descriptions render together on every one of its 3 screens), with the current step highlighted.
// Page-local, not shared with the auth flow's own `SetupStepper` (app/pages/auth/_shared/
// setup-stepper.tsx) - that one's a bare dot-and-line indicator for a narrow centred card; this one
// needs to show each step's title + description inline, a different shape, per this codebase's own
// "page-local, not cross-imported between /pages/** files" convention (see CONTEXT.md's auth-flow
// entry for the precedent).

import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export const STEPS = [
    { id: 1, title: "Project Identification", description: "Basic information about the project, including title, description, and objectives" },
    { id: 2, title: "Data Collection and Storage", description: "Types of data collected, storage methods, and any relevant handling procedures" },
    { id: 3, title: "Privacy and Restrictions", description: "Set visibility, embargo, and data sharing options to control who can access project and observation data." },
] as const;

export function RegistrationStepper({
    currentStep,
    onStepClick,
}: {
    currentStep: 1 | 2 | 3;
    /** Called with a completed step's own id when its header is clicked - per direct request to
     *  "allow the users to go back and forth to step 1 or 2 (completed steps) by clicking over
     *  it." Only ever called for a step that's already complete (`step.id < currentStep`); the
     *  current step and any not-yet-reached step render as plain, non-interactive text, same as
     *  before. */
    onStepClick?: (step: 1 | 2 | 3) => void;
}) {
    return (
        <ol className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
            {STEPS.map((step, i) => {
                const isComplete = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const badge = (
                    <span
                        className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                            isComplete && "border-brand-solid bg-brand-solid text-white",
                            isCurrent && "border-brand-solid text-brand-secondary",
                            !isComplete && !isCurrent && "border-secondary text-quaternary",
                        )}
                    >
                        {isComplete ? <Check className="size-4" /> : step.id}
                    </span>
                );
                const label = (
                    <div className="flex flex-col gap-0.5">
                        <p className={cx("text-sm font-semibold", isCurrent ? "text-primary" : "text-tertiary")}>{step.title}</p>
                        <p className="hidden text-xs text-tertiary sm:block">{step.description}</p>
                    </div>
                );
                return (
                    <li key={step.id} className="flex flex-1 items-start gap-3">
                        {isComplete && onStepClick ? (
                            // No `flex-1` here, matching the plain (non-clickable) branch below
                            // exactly - only the separator line after it should absorb the row's
                            // leftover space, same as before this button wrapper existed. Giving
                            // this wrapper its own `flex-1` too (a real regression caught live)
                            // made it compete with the separator for growth, squeezing the label
                            // text narrower and wrapping "Project Identification" onto two lines.
                            <button
                                type="button"
                                onClick={() => onStepClick(step.id)}
                                className="flex items-start gap-3 rounded-lg text-left outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                {badge}
                                {label}
                            </button>
                        ) : (
                            <div className="flex items-start gap-3">
                                {badge}
                                {label}
                            </div>
                        )}
                        {i < STEPS.length - 1 && <span className="mt-4 hidden h-px flex-1 bg-secondary lg:block" />}
                    </li>
                );
            })}
        </ol>
    );
}
